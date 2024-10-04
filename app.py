import os
from flask import Flask, render_template, request, jsonify, send_file
from chat_handler import handle_chat_request, speech_to_text, text_to_speech
import io

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

@app.route('/api/speech-to-text', methods=['POST'])
def api_speech_to_text():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    audio_file = request.files['audio']
    result = speech_to_text(audio_file)
    return jsonify(result)

@app.route('/api/text-to-speech', methods=['POST'])
def api_text_to_speech():
    data = request.json
    text = data.get('text')
    if not text:
        return jsonify({"error": "No text provided"}), 400
    result = text_to_speech(text)
    if 'error' in result:
        return jsonify(result), 500
    return send_file(
        io.BytesIO(result['audio']),
        mimetype='audio/mpeg',
        as_attachment=True,
        download_name='speech.mp3'
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
