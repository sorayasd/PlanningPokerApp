function initMenu() {
  const newGameBtn = document.getElementById('new-game-btn');
  const resumeGameBtn = document.getElementById('resume-game-btn');
  const messageEl = document.getElementById('menu-message');
  const menuSection = document.getElementById('menu');
  const configSection = document.getElementById('config-screen');

  newGameBtn.addEventListener('click', () => {
    menuSection.classList.add('hidden');
    configSection.classList.remove('hidden');
    initConfigScreen();
  });

  resumeGameBtn.addEventListener('click', () => {
    messageEl.textContent =
      'Reprendre une partie : cette fonctionnalité arrivera très bientôt !';
  });
}

function initConfigScreen() {
  const playerCountInput = document.getElementById('player-count');
  const playerNamesContainer = document.getElementById('player-names');
  const startGameBtn = document.getElementById('start-game-btn');
  const errorEl = document.getElementById('config-error');

  function renderPlayerInputs() {
    const count = Number(playerCountInput.value);
    playerNamesContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
      const div = document.createElement('div');
      div.classList.add('field');

      div.innerHTML = `
        <label>Pseudo du joueur ${i + 1}</label>
        <input type="text" class="player-name" placeholder="Joueur ${i + 1}">
      `;
      playerNamesContainer.appendChild(div);
    }
  }

  playerCountInput.addEventListener('change', renderPlayerInputs);

  renderPlayerInputs();

  startGameBtn.addEventListener('click', () => {
    const names = [...document.querySelectorAll('.player-name')].map(
      input => input.value.trim()
    );

    if (names.some(n => n === "")) {
      errorEl.textContent = "Tous les pseudos doivent être remplis.";
      return;
    }

    if (new Set(names).size !== names.length) {
      errorEl.textContent = "Les pseudos doivent être uniques.";
      return;
    }

    errorEl.textContent = "";
    alert("Configuration validée ! 🚀 La suite arrive bientôt.");

    // passer à la page 3 (affichage du backlog)
  });
}

document.addEventListener('DOMContentLoaded', initMenu);
