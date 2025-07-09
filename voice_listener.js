// Background Voice Listener (Simulated)
const record = require('node-record-lpcm16');
const fs = require('fs');
const { exec } = require('child_process');

// Wake Word
const WAKE_WORD = "shadow";

// Start listening
console.log("🎙️ Shadow is now listening in background...");

record.start({ threshold: 0, verbose: false })
  .on('data', data => {
    // Simulate detection
    const audioText = data.toString('utf8').toLowerCase();
    if (audioText.includes(WAKE_WORD)) {
      console.log("🧠 Wake word detected: Shadow");
      exec("say 'Yes sir, I’m awake.'");  // For testing with TTS
    }
  });
