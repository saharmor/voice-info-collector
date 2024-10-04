document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const schemaInput = document.getElementById('schema-input');
    const collectedInfo = document.getElementById('collected-info');
    const startRecordingBtn = document.getElementById('start-recording');
    const stopRecordingBtn = document.getElementById('stop-recording');
    const audioVisualizer = document.getElementById('audio-visualizer');

    let schema = {};
    let mediaRecorder;
    let audioChunks = [];
    let audioContext;
    let analyser;
    let microphone;

    schemaInput.addEventListener('change', (e) => {
        try {
            schema = JSON.parse(e.target.value);
            console.log('Schema updated:', schema);
        } catch (error) {
            console.error('Invalid JSON schema:', error);
            alert('Invalid JSON schema. Please check your input.');
        }
    });

    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', sendAudioToServer);

            mediaRecorder.start();
            startRecordingBtn.disabled = true;
            stopRecordingBtn.disabled = false;

            // Set up audio visualizer
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                microphone = audioContext.createMediaStreamSource(stream);
                microphone.connect(analyser);
                drawAudioVisualizer();
            }

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check your browser settings.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            startRecordingBtn.disabled = false;
            stopRecordingBtn.disabled = true;
        }
    }

    async function sendAudioToServer() {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        try {
            const response = await fetch('/api/speech-to-text', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.error) {
                appendMessage('error', data.error);
            } else {
                appendMessage('user', data.text);
                await sendMessage(data.text);
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('error', 'An error occurred while processing your audio.');
        }
    }

    async function sendMessage(message) {
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, schema }),
            });
            const data = await response.json();
            if (data.error) {
                appendMessage('error', data.error);
            } else {
                appendMessage('ai', data.message);
                updateCollectedInfo(data.collected_info);
                await playTextToSpeech(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('error', 'An error occurred while sending your message.');
        }
    }

    async function playTextToSpeech(text) {
        try {
            const response = await fetch('/api/text-to-speech', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
        } catch (error) {
            console.error('Error playing text-to-speech:', error);
            appendMessage('error', 'An error occurred while playing the response.');
        }
    }

    function appendMessage(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'p-3', 'rounded-lg', 'mb-2');
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'ai-message');
        messageElement.textContent = message;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateCollectedInfo(info) {
        collectedInfo.textContent = JSON.stringify(info, null, 2);
    }

    function drawAudioVisualizer() {
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const ctx = audioVisualizer.getContext('2d');
        const width = audioVisualizer.width;
        const height = audioVisualizer.height;

        function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.fillStyle = 'rgb(255, 255, 255)';
            ctx.fillRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] / 2;
                ctx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`;
                ctx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
        }

        draw();
    }

    // Initialize audio visualizer with dummy data
    const dummyAnalyser = {
        fftSize: 256,
        frequencyBinCount: 128,
        getByteFrequencyData: function(array) {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.random() * 128;
            }
        }
    };
    analyser = dummyAnalyser;
    drawAudioVisualizer();
});
