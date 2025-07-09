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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function queryAI(prompt) {
  try {
    const res = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=\${process.env.GEMINI_API_KEY}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";
  } catch (err) {
    return "AI fetch error: " + err.message;
  }
}

app.post('/shadow', async (req, res) => {
  const { message } = req.body;
  const reply = await queryAI(message);
  res.json({ response: reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🧠 Shadow AI running on http://localhost:\${PORT}\`);
});
