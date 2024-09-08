import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
import tensorflow as tf
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)

# Load the DNN model from .h5 file
dnn_model = tf.keras.models.load_model("dnn_model.h5")

# List of top 10 selected features
selected_features = [
    'Dst Port', 'Flow Pkts/s', 'Fwd Header Len', 'Bwd Header Len',
    'Fwd Pkts/s', 'Bwd Pkts/s', 'Init Fwd Win Byts', 'Init Bwd Win Byts',
    'Fwd Act Data Pkts', 'Fwd Seg Size Min'
]

# Preprocessing function


def preprocess_data(df):
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)

    # Ensure all selected features are present in the DataFrame
    missing_cols = [col for col in selected_features if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing columns in input data: {missing_cols}")

    # Normalize data using only the selected features
    min_max_scaler = MinMaxScaler()
    df[selected_features] = min_max_scaler.fit_transform(df[selected_features])

    return df[selected_features].values

# Prediction function


def predict_ddos(df):
    processed_data = preprocess_data(df)

    # DNN Prediction
    dnn_prediction_prob = dnn_model.predict(processed_data)
    dnn_prediction = (dnn_prediction_prob > 0.5).astype(int).flatten()

    return dnn_prediction

# Define the Flask route for prediction


@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the JSON data sent in the POST request
        data = request.get_json()

        # Convert JSON to DataFrame
        df = pd.DataFrame([data])

        # Column mapping dictionary
        column_mapping = {
            'destPort': 'Dst Port',
            'flowPktsPerSec': 'Flow Pkts/s',
            'fwdHeaderLen': 'Fwd Header Len',
            'bwdHeaderLen': 'Bwd Header Len',
            'fwdPktsPerSec': 'Fwd Pkts/s',
            'bwdPktsPerSec': 'Bwd Pkts/s',
            'initFwdWinByts': 'Init Fwd Win Byts',
            'initBwdWinByts': 'Init Bwd Win Byts',
            'fwdActDataPkts': 'Fwd Act Data Pkts',
            'fwdSegSizeMin': 'Fwd Seg Size Min'
        }

        # Rename columns based on the mapping
        df.rename(columns=column_mapping, inplace=True)
        print(df.columns)

        # Check for missing columns after renaming
        required_columns = list(column_mapping.values())

        missing_columns = [
            col for col in required_columns if col not in df.columns]

        if missing_columns:
            return jsonify({'error': f"Missing columns in input data: {missing_columns}"}), 400

        # Ensure valid data before prediction
        if df.empty:
            return jsonify({'error': 'Empty input data'}), 400

        # Run predictions
        dnn_result = predict_ddos(df)

        # Format the results into a JSON response
        response = {
            # Convert numpy array to list for JSON serialization
            "DNNPrediction": dnn_result.tolist()
        }

        return jsonify(response)

    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
