from flask import Blueprint, request, jsonify
import sqlite3

api = Blueprint('api', __name__)

@api.route('/submit-data', methods=['POST'])
def submit_data():
    data = request.json.get('data')
    if not data:
        return jsonify({'message': 'No data received'}), 400

    conn = sqlite3.connect('data.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO data (content) VALUES (?)', (data,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Data submitted successfully'}), 200
