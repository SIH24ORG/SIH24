from flask import Flask
from routes.api import api

app = Flask(__name__)

# Register the API blueprint
app.register_blueprint(api)

if __name__ == '__main__':
    app.run(debug=True)
