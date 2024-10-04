import os
from flask import Flask, render_template, request, jsonify
from chat_handler import handle_chat_request

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message')
    schema = data.get('schema')
    response = handle_chat_request(user_input, schema)
    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
