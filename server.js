const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let memory = JSON.parse(fs.readFileSync('shadowConfig.json', 'utf-8'));
let voice = JSON.parse(fs.readFileSync('voiceprint.json', 'utf-8'));

app.post('/shadow', async (req, res) => {
  const { prompt, userVoice } = req.body;

  if (userVoice !== voice.owner) {
    return res.status(403).send('Access Denied: Unauthorized Voice');
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('AI Brain Error');
  }
});

app.listen(3000, () => console.log('🧠 Shadow AI Core running on port 3000'));
