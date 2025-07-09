async function sendCommand() {
  const cmd = document.getElementById("cmd").value;
  const response = await fetch("/shadow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: cmd, userVoice: "bharath-maharaj" })
  });

  const result = await response.json();
  document.getElementById("response").innerText = result.reply;
}
