const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('.'));

const configPath = './shadowConfig.json';
const voiceDataPath = './voiceprint.json';

// 🧠 Load selected AI engine (Gemini, GPT-4, etc.)
function getSelectedAI() {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return data.selectedAI || 'gemini';
}

// 🧬 Voice authentication
function verifyVoice(userVoiceID) {
  const saved = JSON.parse(fs.readFileSync(voiceDataPath, 'utf-8'));
  return userVoiceID === saved.ownerVoiceID;
}

// 🔌 Talk to AI
async function queryAI(prompt, model) {
  if (model === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } else if (['gpt4', 'grok', 'llama'].includes(model)) {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model === 'gpt4' ? 'openai/gpt-4o' :
               model === 'grok' ? 'xai/grok-1' : 'meta-llama/llama-3-8b-instruct',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  } else if (model === 'mistral') {
    const res = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs: prompt })
    });
    const data = await res.json();
    return data[0]?.generated_text || 'No response';
  }
}

// 🌐 Serve the HTML dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🤖 Main Shadow AI API route
app.post('/shadow', async (req, res) => {
  const { message, userVoiceID } = req.body;

  if (!verifyVoice(userVoiceID)) {
    return res.status(403).json({ error: 'Unauthorized voice' });
  }

  try {
    const model = getSelectedAI();
    const response = await queryAI(message, model);
    res.json({ response });
  } catch (err) {
    console.error('Shadow AI error:', err);
    res.status(500).json({ error: 'AI server error' });
  }
});

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧠 Shadow AI running on http://localhost:${PORT}`);
});
