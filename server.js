const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const configPath = './shadowConfig.json';

// 🧠 Load selected AI engine (Gemini, GPT-4, etc.)
function getSelectedAI() {
  const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  return data.selectedAI || 'gemini';
}

// 🔌 Talk to AI
async function queryAI(prompt, model) {
  if (model === 'gemini') {
    const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${process.env.GEMINI_API_KEY}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  } else {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.OPENROUTER_API_KEY}\`,
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
  }
}

// API Endpoint
app.post('/shadow', async (req, res) => {
  const { message } = req.body;
  try {
    const model = getSelectedAI();
    const response = await queryAI(message, model);
    res.json({ response });
  } catch (err) {
    console.error('Shadow AI error:', err);
    res.status(500).json({ error: 'AI server error' });
  }
});

// Serve UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🧠 Shadow AI running at http://localhost:\${PORT}\`);
});
