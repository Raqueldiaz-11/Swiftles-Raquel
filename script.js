const gameButtons = document.querySelectorAll(".game-card");
const copyButton = document.querySelector("#copy-results");
const statusMessage = document.querySelector("#status-message");
let selectedGame = "";

function setStatus(message) {
  statusMessage.textContent = message;
}

gameButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedGame = button.dataset.game;
    gameButtons.forEach((gameButton) => gameButton.classList.remove("is-selected"));
    button.classList.add("is-selected");
    setStatus(`${selectedGame} selected — good luck!`);
  });
});

copyButton.addEventListener("click", async () => {
  const result = selectedGame ? `${selectedGame} — my Swiftles results 🎵` : "My Swiftles results 🎵";

  try {
    await navigator.clipboard.writeText(result);
    setStatus("Results copied to your clipboard!");
  } catch {
    setStatus("Select a game first, then try copying again.");
  }
});
