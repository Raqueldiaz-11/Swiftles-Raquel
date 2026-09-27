const todayDateElement = document.getElementById('today-date');

const sharedResults = {
  song: 'Not played yet',
  songAttempts: 0,
  hangman: 'Not played yet',
  hangmanAttempts: 0,
  abelian: 'Not played yet',
  abelianAttempts: 0,
  abelianClues: 0
};

const dailyGames = [
  { name: 'Sudoku', desc: 'Razonar y completar patrones.' },
  { name: 'Wordle', desc: 'Adivina la palabra del día.' },
  { name: 'Minesweeper', desc: 'Descubre caminos sin explotar.' },
  { name: 'Tetris', desc: 'Ordena piezas y busca ritmo.' },
  { name: 'Memory', desc: 'Encuentra parejas y recuerda.' },
  { name: 'Hangman', desc: 'Descifra letras antes de que se complete.' },
  { name: 'Connect 4', desc: 'Forma líneas y gana con estrategia.' },
  { name: 'Pong', desc: 'Rebota y apuesta por la ventaja.' },
  { name: '2048', desc: 'Combina números y sigue avanzando.' }
];

function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function getDailySeed(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function pickFromDate(items, date, offset = 0) {
  const seed = getDailySeed(date) + offset;
  return items[seed % items.length];
}

function updateDailyGames() {
  const nameElement = document.getElementById('game-name-3');
  const descriptionElement = document.getElementById('game-desc-3');

  if (nameElement) nameElement.textContent = 'Abelian Description';
  if (descriptionElement) descriptionElement.textContent = '13 intentos';
}

function normalizeLetter(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function setupHangman() {
  const wordElement = document.getElementById('hangman-word');
  const form = document.getElementById('hangman-form');
  const input = document.getElementById('hangman-input');
  const statusElement = document.getElementById('hangman-status');
  const successElement = document.getElementById('hangman-success');
  const failElement = document.getElementById('hangman-fail');
  const correctAnswerElement = document.getElementById('hangman-correct-answer');

  if (!wordElement || !form || !input || !statusElement || !successElement || !failElement || !correctAnswerElement) return;

  const dailySong = pickFromDate(taylorSongs, new Date(), 8);
  const answer = dailySong.answer.replace(/\s*\([^)]*\)/g, '').trim();
  const normalizedAnswer = normalizeLetter(answer);
  const guessedLetters = new Set();
  const maxMistakes = 5;
  let mistakes = 0;
  let finished = false;

  function renderWord() {
    wordElement.textContent = [...answer].map((character, index) => {
      if (!/[\p{L}\p{N}]/u.test(character)) return character;
      return guessedLetters.has(normalizedAnswer[index]) ? character : '_';
    }).join(' ');
  }

  renderWord();
  statusElement.textContent = `${maxMistakes} intentos`;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (finished) return;

    const letter = normalizeLetter(input.value.trim());
    input.value = '';
    if (!letter || !/^[a-z0-9]$/i.test(letter)) return;

    if (guessedLetters.has(letter)) {
      statusElement.textContent = 'Ya has probado esa letra';
      return;
    }

    guessedLetters.add(letter);
    sharedResults.hangmanAttempts += 1;
    const isCorrect = normalizedAnswer.includes(letter);
    if (!isCorrect) mistakes += 1;
    renderWord();

    const allLettersGuessed = [...normalizedAnswer].every((character, index) => {
      return !/[a-z0-9]/i.test(character) || guessedLetters.has(character);
    });

    if (allLettersGuessed) {
      finished = true;
      statusElement.textContent = `Correcto: ${answer}`;
      sharedResults.hangman = `Guessed with ${mistakes} ${mistakes === 1 ? 'mistake' : 'mistakes'}`;
      statusElement.classList.add('success');
      successElement.classList.remove('hidden');
      failElement.classList.add('hidden');
      input.disabled = true;
      form.querySelector('button').disabled = true;
    } else if (mistakes >= maxMistakes) {
      finished = true;
      statusElement.textContent = `Fin: ${answer}`;
      sharedResults.hangman = 'FAKE FAN';
      statusElement.classList.add('error');
      successElement.classList.add('hidden');
      failElement.classList.remove('hidden');
      correctAnswerElement.textContent = `La respuesta era: ${answer}`;
      wordElement.textContent = answer;
      input.disabled = true;
      form.querySelector('button').disabled = true;
    } else {
      statusElement.textContent = `${maxMistakes - mistakes} intentos restantes`;
    }
  });
}

function populateSongOptions() {
  const optionsElement = document.getElementById('song-options');
  if (!optionsElement) return;

  [...new Set(taylorSongs.map((song) => song.answer))].forEach((title) => {
    const option = document.createElement('option');
    option.value = title;
    optionsElement.appendChild(option);
  });
}

async function setupSongGame() {
  const clueElement = document.getElementById('guess-clue');
  const albumElement = document.getElementById('guess-album');
  const form = document.getElementById('guess-form');
  const input = document.getElementById('guess-input');
  const statusElement = document.getElementById('guess-status');
  const hintButton = document.getElementById('hint-button');
  const successPanel = document.getElementById('guess-success');
  const failPanel = document.getElementById('guess-fail');
  const correctAnswerElement = document.getElementById('guess-correct-answer');
  const guessPhoto = document.getElementById('guess-photo');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!clueElement || !albumElement || !form || !input || !statusElement || !hintButton || !successPanel || !failPanel || !correctAnswerElement || !guessPhoto || !submitButton) {
    return;
  }

  const today = new Date();
  const dailySong = pickFromDate(taylorSongs, today, 7);
  const clueStorageKey = `swiftles-song-clue-${today.toISOString().slice(0, 10)}`;
  const maxAttempts = 3;
  let attempts = 0;
  let solved = false;
  const answer = dailySong.answer;
  let clueUsed = false;

  clueElement.textContent = dailySong.clue;
  albumElement.textContent = dailySong.album;
  statusElement.textContent = `${maxAttempts} intentos`;

  try {
    const savedClue = JSON.parse(localStorage.getItem(clueStorageKey) || 'null');
    if (savedClue?.answer === answer && savedClue?.album === dailySong.album) {
      albumElement.classList.remove('hidden');
      clueUsed = true;
      hintButton.disabled = true;
    }
  } catch {
    // Ignore unavailable or malformed local storage.
  }

  hintButton.addEventListener('click', () => {
    albumElement.classList.remove('hidden');
    clueUsed = true;
    hintButton.disabled = true;
    localStorage.setItem(clueStorageKey, JSON.stringify({
      answer,
      album: dailySong.album
    }));
  });

  populateSongOptions();

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    if (solved) return;

    const guess = input.value.trim();
    if (!guess) {
      statusElement.textContent = 'Escribe algo primero';
      return;
    }

    attempts += 1;
    sharedResults.songAttempts = attempts;
    const guessedCorrectly = guess.toLowerCase() === answer.toLowerCase();

    if (guessedCorrectly) {
      solved = true;
      sharedResults.song = clueUsed ? 'Guessed with clue' : 'Guessed';
      statusElement.textContent = `Correcto: ${answer}`;
      statusElement.classList.add('success');
      successPanel.classList.remove('hidden');
      failPanel.classList.add('hidden');

      if (guessPhoto) {
        guessPhoto.src = 'fotoacierto.jpeg';
        guessPhoto.alt = answer;
      }

      submitButton.disabled = true;
      form.querySelector('button').disabled = true;
      return;
    }

    if (attempts >= maxAttempts) {
      solved = true;
      sharedResults.song = 'FAKE FAN';
      statusElement.textContent = 'Fallaste';
      statusElement.classList.add('error');

      successPanel.classList.add('hidden');
      failPanel.classList.remove('hidden');
      correctAnswerElement.textContent = `La respuesta era: ${answer}`;

      input.disabled = true;
      submitButton.disabled = true;
      return;
    }

    statusElement.textContent = `${maxAttempts - attempts} intentos restantes`;
  });
}

function setupDescriptionGame() {
  const clueElement = document.getElementById('description-clue');
  const albumElement = document.getElementById('description-album');
  const initialsElement = document.getElementById('description-initials');
  const form = document.getElementById('description-form');
  const input = document.getElementById('description-input');
  const statusElement = document.getElementById('description-status');
  const hintButton = document.getElementById('description-hint');
  const successPanel = document.getElementById('description-success');
  const failPanel = document.getElementById('description-fail');
  const correctAnswerElement = document.getElementById('description-answer');
  const guessPhoto = document.getElementById('description-photo');
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!clueElement || !albumElement || !initialsElement || !form || !input || !statusElement || !hintButton || !successPanel || !failPanel || !correctAnswerElement || !guessPhoto || !submitButton) return;

  const dailySong = pickFromDate(taylorSongs, new Date(), 9);
  const answer = dailySong.answer;
  const clueStorageKey = `swiftles-description-clues-${new Date().toISOString().slice(0, 10)}`;
  const maxAttempts = 5;
  let attempts = 0;
  let solved = false;
  let clueUsed = false;
  let clueStep = 0;

  clueElement.textContent = dailySong.description;
  albumElement.textContent = dailySong.album;
  initialsElement.textContent = dailySong.initials;
  statusElement.textContent = `${maxAttempts} intentos`;

  try {
    const savedClues = JSON.parse(localStorage.getItem(clueStorageKey) || 'null');
    if (savedClues?.description === dailySong.description && savedClues?.album === dailySong.album) {
      albumElement.classList.remove('hidden');
      clueStep = 1;
      sharedResults.abelianClues = 1;
      hintButton.textContent = 'Clue 2';
    }
    if (savedClues?.description === dailySong.description && savedClues?.initials === dailySong.initials) {
      albumElement.classList.remove('hidden');
      initialsElement.classList.remove('hidden');
      clueStep = 2;
      clueUsed = true;
      sharedResults.abelianClues = 2;
      hintButton.disabled = true;
    }
  } catch {
    // Ignore unavailable or malformed local storage.
  }

  hintButton.addEventListener('click', () => {
    if (clueStep === 0) {
      albumElement.classList.remove('hidden');
      clueStep = 1;
      sharedResults.abelianClues = 1;
      hintButton.textContent = 'Clue 2';
      localStorage.setItem(clueStorageKey, JSON.stringify({
        description: dailySong.description,
        album: dailySong.album
      }));
      return;
    }

    initialsElement.classList.remove('hidden');
    clueStep = 2;
    clueUsed = true;
    sharedResults.abelianClues = 2;
    hintButton.disabled = true;
    localStorage.setItem(clueStorageKey, JSON.stringify({
      description: dailySong.description,
      album: dailySong.album,
      initials: dailySong.initials
    }));
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (solved) return;

    const guess = input.value.trim();
    if (!guess) {
      statusElement.textContent = 'Escribe algo primero';
      return;
    }

    attempts += 1;
    sharedResults.abelianAttempts = attempts;
    const guessedCorrectly = guess.toLowerCase() === answer.toLowerCase();

    if (guessedCorrectly) {
      solved = true;
      sharedResults.abelian = clueUsed ? 'Guessed with clue' : 'Guessed';
      statusElement.textContent = `Correcto: ${answer}`;
      statusElement.classList.add('success');
      successPanel.classList.remove('hidden');
      failPanel.classList.add('hidden');
      guessPhoto.src = 'fotoacierto.jpeg';
      guessPhoto.alt = answer;
      input.disabled = true;
      submitButton.disabled = true;
      return;
    }

    if (attempts >= maxAttempts) {
      solved = true;
      sharedResults.abelian = 'FAKE FAN';
      statusElement.textContent = 'Fallaste';
      statusElement.classList.add('error');
      successPanel.classList.add('hidden');
      failPanel.classList.remove('hidden');
      correctAnswerElement.textContent = `La respuesta era: ${answer}`;
      input.disabled = true;
      submitButton.disabled = true;
      return;
    }

    statusElement.textContent = `${maxAttempts - attempts} intentos restantes`;
  });
}

function copyTextFallback(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
}

function setupShare() {
  const shareButton = document.getElementById('share-button');
  if (!shareButton) return;

  shareButton.addEventListener('click', async () => {
    const message = [
      `Guess the song: "${sharedResults.song}" (${sharedResults.songAttempts} attempts)`,
      `Hangman: "${sharedResults.hangman}"`,
      `Abelian Description: "${sharedResults.abelian}" (${sharedResults.abelianAttempts} attempts, ${sharedResults.abelianClues} clues used)`
    ].join('\n');

    try {
      await navigator.clipboard.writeText(message);
    } catch {
      copyTextFallback(message);
    }

    shareButton.textContent = 'Copied!';
    window.setTimeout(() => {
      shareButton.textContent = 'Share';
    }, 1500);
  });
}

if (todayDateElement) {
  const today = new Date();
  todayDateElement.textContent = formatDate(today);
}

updateDailyGames();
setupSongGame();
setupDescriptionGame();
setupHangman();
setupShare();
