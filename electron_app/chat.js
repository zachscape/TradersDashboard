const { ipcRenderer } = require('electron');
const axios = require('axios');
let messageCount = 0;
let voice;

speechSynthesis.onvoiceschanged = function() {
  let voices = speechSynthesis.getVoices();
  voice = voices[2]; // Selects the third voice in the array
}

function renderMessage(message, sender) {
  let messageContainer = document.createElement('div');
  let messageTitle = document.createElement('p');
  let messageContent = document.createElement('p');

  messageContainer.className = sender === 'user' ? 'message user' : 'message chatbot';
  messageTitle.className = 'message-title';
  messageTitle.innerText = sender === 'user' ? 'Me' : 'GPT';
  messageContent.innerText = message;

  messageContainer.appendChild(messageTitle);
  messageContainer.appendChild(messageContent);

  document.querySelector('#chat-container').appendChild(messageContainer);

  if (sender === 'chatbot') {
    let utterance = new SpeechSynthesisUtterance(message);
    utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }
  
  messageCount += 1;
}

function sendMessageToServer(message) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post('http://localhost:3001/generate-text', {
        prompt: message
      });

      let botResponse = response.data.choices[0].message.content;
      resolve(botResponse);
    } catch (error) {
      console.error(error);
      reject(error);
    }
  });
}

document.querySelector('#chat-input').addEventListener('keydown', async (evt) => {
  if (evt.key === 'Enter') {
    evt.preventDefault();
    let message = evt.target.value;
    evt.target.value = '';
    renderMessage(message, 'user');

    let botResponse = await sendMessageToServer(message);
    renderMessage(botResponse, 'chatbot');
  }
});

document.querySelector('#close-button').addEventListener('click', () => {
  ipcRenderer.send('close-chat-window');
});

ipcRenderer.on('message-to-server', async (event, arg) => {
  let message = arg.prompt;
  renderMessage(message, 'user');

  let botResponse = await sendMessageToServer(message);
  renderMessage(botResponse, 'chatbot');
});