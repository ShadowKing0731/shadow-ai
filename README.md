# Shadow AI - Multi-AI Free Backend

## How to Use

1. Rename `.env.example` to `.env`
2. Add your API keys:
   - Gemini (Google)
   - OpenRouter (GPT-4, Claude, Grok)
   - HuggingFace (Mistral, LLaMA)
3. Run using: `node server.js`
4. Send a POST to `/shadow` with:
```json
{
  "message": "What is AI?",
  "userVoiceID": "bharath123"
}
```

Change AI mode in `shadowConfig.json`:
- "gemini"
- "gpt4"
- "grok"
- "mistral"