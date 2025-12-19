// principal
let appState = {
  players: [],
  gameMode: "strict",
  backlog: [],
  currentIndex: 0,

  round: 1,
  votes: [],
  currentVoter: 0,
  selectedCard: null
};

// Backlog par defaut si aucun JSON importé
const DEFAULT_BACKLOG = [
  {
    id: 1,
    title: "Inscription utilisateur",
    description: "Permettre à un utilisateur de créer un compte.",
    status: "pending",
    estimatedDifficulty: null
  },
  {
    id: 2,
    title: "Connexion",
    description: "Permettre à un utilisateur existant de se connecter.",
    status: "pending",
    estimatedDifficulty: null
  },
  {
    id: 3,
    title: "Mot de passe oublié",
    description: "Permettre de réinitialiser le mot de passe via email.",
    status: "pending",
    estimatedDifficulty: null
  }
];

// Cartes simples
const CARDS = [1, 2, 3, 5, 8, 13, "café"];

// fonctions 
function hideAllScreens() {
  document.getElementById("menu").classList.add("hidden");
  document.getElementById("config-screen").classList.add("hidden");
  document.getElementById("feature-screen").classList.add("hidden");
  document.getElementById("vote-screen").classList.add("hidden");
  document.getElementById("end-screen").classList.add("hidden");
}

function downloadJsonFile(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function resetVoteState() {
  appState.round = 1;
  appState.votes = [];
  appState.currentVoter = 0;
  appState.selectedCard = null;
}

// !!!!!!!!!!!!! PAGE 1 : MENU  !!!!!!!!!!!
function initMenu() {
  const newGameBtn = document.getElementById("new-game-btn");
  const resumeBtn = document.getElementById("resume-game-btn");
  const resumeFile = document.getElementById("resume-file");
  const menuMsg = document.getElementById("menu-message");

  newGameBtn.addEventListener("click", () => {
    menuMsg.textContent = "";
    hideAllScreens();
    document.getElementById("config-screen").classList.remove("hidden");
    initConfigScreen();
  });

  // Reprendre = choisir un fichier pause.json
  resumeBtn.addEventListener("click", () => {
    menuMsg.textContent = "Choisis un fichier pause.json pour reprendre.";
    resumeFile.click();
  });

  resumeFile.addEventListener("change", async () => {
    const file = resumeFile.files && resumeFile.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      // pause.json attendu : { gameMode, players, currentIndex, backlog }
      if (!parsed || !Array.isArray(parsed.players) || !Array.isArray(parsed.backlog)) {
        menuMsg.textContent = "Fichier pause.json invalide.";
        return;
      }

      appState.players = parsed.players;
      appState.gameMode = parsed.gameMode || "strict";
      appState.backlog = parsed.backlog;
      appState.currentIndex = Number(parsed.currentIndex || 0);

      resetVoteState();

      hideAllScreens();
      document.getElementById("feature-screen").classList.remove("hidden");
      showFeatureScreen();
      menuMsg.textContent = "";
    } catch {
      menuMsg.textContent = "Impossible de lire le fichier JSON.";
    } finally {
      resumeFile.value = ""; // pour pouvoir recharger le meme fichier après
    }
  });
}

// !!!!!!!!!!!!!!!PAGE 2 : CONFIG !!!!!!!!!!!!!!!
function initConfigScreen() {
  const playerCountInput = document.getElementById("player-count");
  const playerNamesContainer = document.getElementById("player-names");
  const startBtn = document.getElementById("start-game-btn");
  const errorEl = document.getElementById("config-error");

  const modeSelect = document.getElementById("game-mode");
  const backlogFileInput = document.getElementById("backlog-file");

  function renderPlayerInputs() {
    const count = Number(playerCountInput.value);
    playerNamesContainer.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const div = document.createElement("div");
      div.className = "field";
      div.innerHTML = `
        <label>Pseudo du joueur ${i + 1}</label>
        <input type="text" class="player-name" placeholder="Joueur ${i + 1}">
      `;
      playerNamesContainer.appendChild(div);
    }
  }

  playerCountInput.onchange = renderPlayerInputs;
  renderPlayerInputs();

  startBtn.onclick = async () => {
    const names = [...document.querySelectorAll(".player-name")].map(i => i.value.trim());

    // vérifs
    if (names.some(n => n === "")) {
      errorEl.textContent = "Tous les pseudos doivent être remplis.";
      return;
    }
    if (new Set(names).size !== names.length) {
      errorEl.textContent = "Les pseudos doivent être uniques.";
      return;
    }
    errorEl.textContent = "";

    // état
    appState.players = names;
    appState.gameMode = modeSelect.value;

    // backlog
    const file = backlogFileInput.files && backlogFileInput.files[0];
    if (file) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        appState.backlog = Array.isArray(parsed.backlog) ? parsed.backlog : [];
      } catch {
        errorEl.textContent = "Erreur : JSON invalide.";
        return;
      }
    } else {
      // fallback
      appState.backlog = JSON.parse(JSON.stringify(DEFAULT_BACKLOG));
    }

    if (!appState.backlog || appState.backlog.length === 0) {
      errorEl.textContent = "Backlog vide.";
      return;
    }

    // init statut si pas fourni
    appState.backlog.forEach(item => {
      if (!item.status) item.status = "pending";
      if (typeof item.estimatedDifficulty === "undefined") item.estimatedDifficulty = null;
    });

    appState.currentIndex = 0;
    resetVoteState();

    hideAllScreens();
    document.getElementById("feature-screen").classList.remove("hidden");
    showFeatureScreen();
  };
}

// !!!!!!!!!!!!!!!!!!!!!!!!!  PAGE 3  !!!!!!!!!!!!!!!!!
function showFeatureScreen() {
  const item = appState.backlog[appState.currentIndex];

  document.getElementById("feature-title").textContent = item.title ?? "(Sans titre)";
  document.getElementById("feature-description").textContent = item.description ?? "";
  document.getElementById("feature-status").textContent = `Statut : ${item.status ?? "pending"}`;
  document.getElementById("feature-info").textContent =
    `Mode : ${appState.gameMode} — Joueurs : ${appState.players.join(", ")}`;

  document.getElementById("go-vote-btn").onclick = () => {
    initVoteRound();
    hideAllScreens();
    document.getElementById("vote-screen").classList.remove("hidden");
    showVoteScreen();
  };
}

// !!!!!!!!!!!!!!!!! PAGE 4 : VOTE !!!!!!!!!!!!!!!!!
function initVoteRound() {
  appState.votes = [];
  appState.currentVoter = 0;
  appState.selectedCard = null;
}

function showVoteScreen() {
  // reset affichage
  document.getElementById("vote-error").textContent = "";
  document.getElementById("vote-selected").textContent = "";
  document.getElementById("votes-reveal").classList.add("hidden");
  document.getElementById("votes-reveal").innerHTML = "";

  // boutons visibles/cachés
  document.getElementById("confirm-vote-btn").classList.remove("hidden");
  document.getElementById("reveal-btn").classList.add("hidden");
  document.getElementById("validate-round-btn").classList.add("hidden");
  document.getElementById("revote-btn").classList.add("hidden");

  // infos
  const item = appState.backlog[appState.currentIndex];
  document.getElementById("vote-player-name").textContent = appState.players[appState.currentVoter];
  document.getElementById("vote-feature-title").textContent = item.title ?? "";
  document.getElementById("vote-round").textContent = String(appState.round);

  // cartes
  renderCards();

  document.getElementById("confirm-vote-btn").onclick = confirmVote;
  document.getElementById("reveal-btn").onclick = revealVotes;
  document.getElementById("validate-round-btn").onclick = validateRound;
  document.getElementById("revote-btn").onclick = startNewRound;
}

function renderCards() {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";
  appState.selectedCard = null;

  CARDS.forEach(card => {
    const btn = document.createElement("button");
    btn.className = "card-btn";
    btn.textContent = String(card);

    btn.onclick = () => {
      [...container.querySelectorAll(".card-btn")].forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      appState.selectedCard = card;
      document.getElementById("vote-selected").textContent = `Carte sélectionnée : ${card}`;
      document.getElementById("vote-error").textContent = "";
    };

    container.appendChild(btn);
  });
}

function confirmVote() {
  const err = document.getElementById("vote-error");
  if (appState.selectedCard === null) {
    err.textContent = "Choisis une carte avant de valider.";
    return;
  }

  appState.votes.push(appState.selectedCard);
  appState.currentVoter++;

  if (appState.currentVoter < appState.players.length) {
    // prochain joueur
    showVoteScreen();
    return;
  }

  // tout le monde a  voté :  révélation
  document.getElementById("confirm-vote-btn").classList.add("hidden");
  document.getElementById("reveal-btn").classList.remove("hidden");
}

function revealVotes() {
  const box = document.getElementById("votes-reveal");
  box.classList.remove("hidden");

  box.innerHTML = "<h3>Votes</h3>" + appState.players.map((p, i) => {
    return `<p>${p} : <strong>${appState.votes[i]}</strong></p>`;
  }).join("");

  document.getElementById("reveal-btn").classList.add("hidden");
  document.getElementById("validate-round-btn").classList.remove("hidden");
}

function validateRound() {
  const err = document.getElementById("vote-error");
  err.textContent = "";

  //  si tous café : sauvegarde pause.json + retour menu
  const allCoffee = appState.votes.every(v => v === "café");
  if (allCoffee) {
    const pause = {
      gameMode: appState.gameMode,
      players: appState.players,
      currentIndex: appState.currentIndex,
      backlog: appState.backlog
    };
    downloadJsonFile("pause.json", pause);

    hideAllScreens();
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("menu-message").textContent =
      "Pause sauvegardée (pause.json). Cliquer sur 'Reprendre une partie' et importer votre fichier .json .";
    resetVoteState();
    return;
  }

  // Règle : tour 1 = unanimité obligatoire pour tous les modes 
  if (appState.round === 1) {
    const unanimous = appState.votes.every(v => v === appState.votes[0]);
    if (!unanimous || appState.votes[0] === "☕") {
      err.textContent = "Tour 1 : unanimité obligatoire sur une valeur numérique. Nouveau tour.";
      showRevoteOnly();
      return;
    }
    acceptEstimate(Number(appState.votes[0]));
    return;
  }

  // Tours suivants
  if (appState.gameMode === "strict") {
    const unanimous = appState.votes.every(v => v === appState.votes[0]);
    if (!unanimous || appState.votes[0] === "☕") {
      err.textContent = "Mode strict : unanimité obligatoire (valeur numérique).";
      showRevoteOnly();
      return;
    }
    acceptEstimate(Number(appState.votes[0]));
    return;
  }

  if (appState.gameMode === "average") {
    const allNumeric = appState.votes.every(v => typeof v === "number");
    if (!allNumeric) {
      err.textContent = "Mode moyenne : uniquement des cartes numériques (pas ☕). Nouveau tour.";
      showRevoteOnly();
      return;
    }
    const sum = appState.votes.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / appState.votes.length);
    acceptEstimate(avg);
    return;
  }

  err.textContent = "Mode non supporté. Choisis Strict ou Moyenne.";
  showRevoteOnly();
}

function showRevoteOnly() {
  document.getElementById("validate-round-btn").classList.add("hidden");
  document.getElementById("revote-btn").classList.remove("hidden");
}

function startNewRound() {
  appState.round += 1;
  initVoteRound();
  showVoteScreen();
}

function acceptEstimate(value) {
  const item = appState.backlog[appState.currentIndex];
  item.status = "validated";
  item.estimatedDifficulty = value;

  // passer à la suite
  appState.currentIndex += 1;

  // reset vote pour prochaine fonctionnalié
  resetVoteState();

  // Fin du backlog : Page 5
  if (appState.currentIndex >= appState.backlog.length) {
    hideAllScreens();
    document.getElementById("end-screen").classList.remove("hidden");
    showEndScreen();
    return;
  }

  // Sinon retour Page 3
  hideAllScreens();
  document.getElementById("feature-screen").classList.remove("hidden");
  showFeatureScreen();
}

// !!!!!!!!!!!!!!!!!PAGE 5 : FIN !!!!!!!!!!!!!!!!!
function showEndScreen() {
  const summary = document.getElementById("end-summary");
  summary.innerHTML = "<h3>Résumé des estimations</h3>";

  appState.backlog.forEach(item => {
    summary.innerHTML += `<p><strong>${item.title}</strong> : ${item.estimatedDifficulty}</p>`;
  });

  document.getElementById("download-final-btn").onclick = () => {
    const finalResult = {
      gameMode: appState.gameMode,
      players: appState.players,
      backlog: appState.backlog
    };
    downloadJsonFile("resultats.json", finalResult);
  };

  document.getElementById("back-to-menu-btn").onclick = () => {
    hideAllScreens();
    document.getElementById("menu").classList.remove("hidden");
    document.getElementById("menu-message").textContent = "";
  };
}

// launch
document.addEventListener("DOMContentLoaded", () => {
  hideAllScreens();
  document.getElementById("menu").classList.remove("hidden");
  initMenu();
});
