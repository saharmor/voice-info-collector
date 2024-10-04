document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');
    const schemaInput = document.getElementById('schema-input');
    const collectedInfo = document.getElementById('collected-info');

    let schema = {};

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = userInput.value.trim();
        if (message) {
            appendMessage('user', message);
            userInput.value = '';
            await sendMessage(message);
        }
    });

    schemaInput.addEventListener('change', (e) => {
        try {
            schema = JSON.parse(e.target.value);
            console.log('Schema updated:', schema);
        } catch (error) {
            console.error('Invalid JSON schema:', error);
            alert('Invalid JSON schema. Please check your input.');
        }
    });

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
            }
        } catch (error) {
            console.error('Error:', error);
            appendMessage('error', 'An error occurred while sending your message.');
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
});
