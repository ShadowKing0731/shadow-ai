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

// Shadow config
const configPath = './shadowConfig.json';

function getSelectedAI() {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return data.selectedAI || 'gemini';
}

function updateAIEngine(newModel) {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  config.selectedAI = newModel;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

async function queryAI(prompt, model) {
  if (model === 'gemini') {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  }

  if (['gpt4', 'grok', 'llama'].includes(model)) {
    const modelMap = {
      gpt4: 'openai/gpt-4o',
      grok: 'xai/grok-1',
      llama: 'meta-llama/llama-3-8b-instruct'
    };
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelMap[model],
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No response';
  }

  if (model === 'mistral') {
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

  return 'No model selected';
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/shadow', async (req, res) => {
  const { message, userVoiceID } = req.body;
  console.log(`🎙️ ${userVoiceID}: ${message}`);

  const lowered = message.toLowerCase();

  if (lowered.includes('switch to gpt')) {
    updateAIEngine('gpt4');
    return res.json({ response: '✅ Switched to GPT-4o successfully.' });
  } else if (lowered.includes('switch to gemini')) {
    updateAIEngine('gemini');
    return res.json({ response: '✅ Gemini is now your AI brain.' });
  } else if (lowered.includes('switch to grok')) {
    updateAIEngine('grok');
    return res.json({ response: '✅ Switched to Grok AI.' });
  } else if (lowered.includes('switch to llama')) {
    updateAIEngine('llama');
    return res.json({ response: '✅ Using LLaMA model now.' });
  }

  try {
    const model = getSelectedAI();
    const reply = await queryAI(message, model);
    res.json({ response: reply });
  } catch (err) {
    console.error('❌ Shadow AI error:', err);
    res.status(500).json({ error: 'AI server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🧠 Shadow AI ready at http://localhost:${PORT}`);
});
