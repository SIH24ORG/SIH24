import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.feature_selection import RFE
from sklearn.metrics import accuracy_score, f1_score
import tensorflow as tf

RANDOM_STATE_SEED = 12

# Load the dataset
df = pd.read_csv(
    "C:\\Users\\Rohit Sinha\\Desktop\\Projects+Misc\\SIH24\\DDoS Protection\\DDoS Detector\\datasets\ids-intrusion-csv\\02-14-2018.csv")

# Data cleaning and preprocessing
df.replace([np.inf, -np.inf], np.nan, inplace=True)
df.dropna(inplace=True)
df.replace(to_replace=["FTP-BruteForce", "SSH-Bruteforce"],
           value="Malicious", inplace=True)

# Equal sampling of classes
df1 = df[df["Label"] == "Benign"][:380943]
df2 = df[df["Label"] == "Malicious"][:380943]
df_equal = pd.concat([df1, df2], axis=0)

# Replace labels with binary classification
df_equal.replace(to_replace="Benign", value=0, inplace=True)
df_equal.replace(to_replace="Malicious", value=1, inplace=True)

# Split dataset into training and testing sets
train, test = train_test_split(
    df_equal, test_size=0.3, random_state=RANDOM_STATE_SEED)

# Define numerical columns
numerical_columns = ['Flow Duration', 'Tot Fwd Pkts', 'Tot Bwd Pkts', 'TotLen Fwd Pkts', 'TotLen Bwd Pkts',
                     'Fwd Pkt Len Max', 'Fwd Pkt Len Min', 'Fwd Pkt Len Mean', 'Fwd Pkt Len Std',
                     'Bwd Pkt Len Max', 'Bwd Pkt Len Min', 'Bwd Pkt Len Mean', 'Bwd Pkt Len Std',
                     'Flow Byts/s', 'Flow Pkts/s', 'Flow IAT Mean', 'Flow IAT Std', 'Flow IAT Max',
                     'Flow IAT Min', 'Fwd IAT Tot', 'Fwd IAT Mean', 'Fwd IAT Std', 'Fwd IAT Max',
                     'Fwd IAT Min', 'Bwd IAT Tot', 'Bwd IAT Mean', 'Bwd IAT Std', 'Bwd IAT Max',
                     'Bwd IAT Min', 'Fwd PSH Flags', 'Bwd PSH Flags', 'Fwd URG Flags', 'Bwd URG Flags',
                     'Fwd Header Len', 'Bwd Header Len', 'Fwd Pkts/s', 'Bwd Pkts/s', 'Pkt Len Min',
                     'Pkt Len Max', 'Pkt Len Mean', 'Pkt Len Std', 'Pkt Len Var', 'FIN Flag Cnt',
                     'SYN Flag Cnt', 'RST Flag Cnt', 'PSH Flag Cnt', 'ACK Flag Cnt', 'URG Flag Cnt',
                     'CWE Flag Count', 'ECE Flag Cnt', 'Down/Up Ratio', 'Pkt Size Avg', 'Fwd Seg Size Avg',
                     'Bwd Seg Size Avg', 'Fwd Byts/b Avg', 'Fwd Pkts/b Avg', 'Fwd Blk Rate Avg',
                     'Bwd Byts/b Avg', 'Bwd Pkts/b Avg', 'Bwd Blk Rate Avg', 'Subflow Fwd Pkts',
                     'Subflow Fwd Byts', 'Subflow Bwd Pkts', 'Subflow Bwd Byts', 'Init Fwd Win Byts',
                     'Init Bwd Win Byts', 'Fwd Act Data Pkts', 'Fwd Seg Size Min', 'Active Mean',
                     'Active Std', 'Active Max', 'Active Min', 'Idle Mean', 'Idle Std', 'Idle Max',
                     'Idle Min']

# Normalize the numerical columns
min_max_scaler = MinMaxScaler().fit(train[numerical_columns])
train[numerical_columns] = min_max_scaler.transform(train[numerical_columns])
test[numerical_columns] = min_max_scaler.transform(test[numerical_columns])

# Drop 'Timestamp' column as it is irrelevant
train.drop(['Timestamp'], axis=1, inplace=True)
test.drop(['Timestamp'], axis=1, inplace=True)

# Split the dataset into features (X) and labels (y)
y_train = train.pop("Label").values  # pop removes "Label" from the dataframe
X_train = train.values

y_test = test.pop("Label").values
X_test = test.values

# Perform RFE using RandomForestClassifier
forest = RandomForestClassifier(
    n_estimators=100, random_state=RANDOM_STATE_SEED)

# Initialize RFE with 10 features
rfe = RFE(estimator=forest, n_features_to_select=10)
rfe.fit(X_train, y_train)

# Get the selected top features
selected_features = rfe.support_
selected_feature_names = train.columns[selected_features]

# Print the selected top features
print("Top 10 selected features:", selected_feature_names)

# Evaluate model performance on test data using selected features
X_train_selected = rfe.transform(X_train)
X_test_selected = rfe.transform(X_test)

# Re-train the model on the reduced feature set
forest.fit(X_train_selected, y_train)

# Predict on the test set
y_pred = forest.predict(X_test_selected)

# Calculate accuracy and F1 score
accuracy = accuracy_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)

print(f"Accuracy: {accuracy}")
print(f"F1 Score: {f1}")

# Plot feature ranking
ranking = rfe.ranking_
plt.figure()
plt.bar(range(len(ranking)), ranking)
plt.xlabel("Feature Index")
plt.ylabel("Ranking")
plt.title("RFE Feature Ranking")
plt.show()


def create_dnn_model(input_shape):
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu',
                              input_shape=(input_shape,)),
        tf.keras.layers.Dense(32, activation='relu'),
        # Binary classification (malicious or benign)
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer='adam',
                  loss='binary_crossentropy',  # Use binary cross-entropy for binary classification
                  metrics=['accuracy'])

    return model


input_shape = X_train_selected.shape[1]  # Number of selected features
model = create_dnn_model(input_shape)

# Train the model
history = model.fit(X_train_selected, y_train, epochs=10,
                    batch_size=32, validation_split=0.2)

# Predict on test data
y_pred_prob = model.predict(X_test_selected)
# Convert probabilities to binary labels (0 or 1)
y_pred = (y_pred_prob > 0.5).astype(int).flatten()

# Evaluate the model using accuracy and F1 score
accuracy_dnn = accuracy_score(y_test, y_pred)
f1_dnn = f1_score(y_test, y_pred)

print(f"Accuracy (DNN): {accuracy_dnn}")
print(f"F1 Score (DNN): {f1_dnn}")

plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Accuracy')
plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
plt.title('Model Accuracy')
plt.xlabel('Epoch')
plt.ylabel('Accuracy')
plt.legend()

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Model Loss')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()

plt.show()

model.save("dnn_model.keras")
