require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

let config = JSON.parse(fs.readFileSync('./shadowConfig.json', 'utf-8'));
let voiceprint = JSON.parse(fs.readFileSync('./voiceprint.json', 'utf-8'));

app.post('/shadow', async (req, res) => {
    const { message, userVoiceID } = req.body;
    if (userVoiceID !== voiceprint.ownerVoiceID) {
        return res.status(403).send('Unauthorized Voice');
    }

    const ai = config.selectedAI;
    let apiResponse = '';

    try {
        if (ai === 'gemini') {
            apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: message }] }]
                })
            });
        } else if (ai === 'gpt4') {
            apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'openai/gpt-4',
                    messages: [{ role: 'user', content: message }]
                })
            });
        } else if (ai === 'grok') {
            apiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'xai/grok-1',
                    messages: [{ role: 'user', content: message }]
                })
            });
        } else if (ai === 'mistral') {
            apiResponse = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ inputs: message })
            });
        }

        const data = await apiResponse.json();
        return res.send(data);
    } catch (err) {
        console.error('AI Server Error:', err);
        return res.status(500).send('Shadow AI error.');
    }
});

app.listen(3000, () => console.log('🧠 Shadow AI backend running on port 3000'));