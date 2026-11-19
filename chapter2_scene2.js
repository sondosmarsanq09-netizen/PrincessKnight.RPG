function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

let pX = 400;
let pY = 570; // Planted firmly on the floor
const speed = 6;
let currentArea = 'room';
let inDialogue = false;
let isFadingOut = false;
let questEnded = false;

// Task System State
let taskStage = 0;
let canInteract = false;
let popupTimeout = null;

// Helper to show sparkling feedback floating right above the princess's head
function showActionFeedback(message) {
  if (!actionPopup) return;

  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = (pX + 40) + 'px';
  actionPopup.style.top = (pY - 20) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight; // trigger reflow
  actionPopup.style.animation = 'float-above-princess 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

// Pure black fade-out into chapter2scene3.html (no text)
function fadeToScene3(nextSceneUrl = 'chapter2scene3.html') {
  if (isFadingOut) return;
  isFadingOut = true;

  taskMarker.classList.add('hidden');
  interactionPrompt.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
    });

    setTimeout(() => {
      window.location.href = nextSceneUrl;
    }, 1500); // Matches the 1.5s CSS fade transition
  } else {
    window.location.href = nextSceneUrl;
  }
}

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  // Press 'E' to interact when near the task marker
  if (k === 'e' && canInteract && !inDialogue && !questEnded && !isFadingOut) {
    if (taskStage === 0) {
      taskStage = 1;
      showActionFeedback("Bed Made Neatly!");
      objectiveText.textContent = "Objective: Brush your hair at the vanity dresser (left).";
    } else if (taskStage === 1) {
      taskStage = 2;
      showActionFeedback("Hair Brushed Smoothly!");
      objectiveText.textContent = "Objective: Put on your favorite perfume at the table (middle).";
    } else if (taskStage === 2) {
      taskStage = 3;
      showActionFeedback("Perfume Applied!");
      objectiveText.textContent = "🔊 Objective: Strange noises are coming from outside... Head right to the Balcony to investigate!";
    } else if (taskStage === 3) {
      taskStage = 4;
      questEnded = true;
      taskMarker.classList.add('hidden');
      interactionPrompt.classList.add('hidden');
      showActionFeedback("💕 Oh! It's him... down in the Royal Garden!");
      objectiveText.textContent = "✅ Princess spotted her favorite knight! Scene complete.";

      // Quest ends immediately; ~2.5s to walk around before pure black fade to Scene 3
      setTimeout(() => {
        fadeToScene3('chapter2scene3.html');
      }, 2500);
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let pMoving = false;

  if (!inDialogue && !isFadingOut) {
    if (keys['w']) {
      pY -= speed;
      pMoving = true;
    }
    if (keys['s']) {
      pY += speed;
      pMoving = true;
    }

    if (pY < 480) pY = 480;
    if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

    if (keys['a']) {
      pX -= speed;
      pMoving = true;
      princess.classList.add('facing-left');
      princess.classList.remove('facing-right');
    }
    if (keys['d']) {
      pX += speed;
      pMoving = true;
      princess.classList.remove('facing-left');
      princess.classList.add('facing-right');
    }

    if (currentArea === 'room') {
      if (taskStage >= 3) {
        arrowRight.style.display = 'flex';
        if (pX > window.innerWidth - 280) {
          arrowRight.classList.add('highlight');
        } else {
          arrowRight.classList.remove('highlight');
        }
      } else {
        arrowRight.style.display = 'none';
      }

      if (taskStage >= 3 && pX >= window.innerWidth - 130) {
        currentArea = 'balcony';
        gameBody.style.backgroundImage = "url('Balcony.png')";
        locationBanner.textContent = "📍 Royal Balcony";
        pX = 20; // Enters from the left side of the balcony
      }
    } else if (currentArea === 'balcony') {
      arrowRight.style.display = 'none';
      if (pX <= 10) {
        currentArea = 'room';
        gameBody.style.backgroundImage = "url('PrincessRoom.png')";
        locationBanner.textContent = "📍 Princess's Chambers";
        pX = window.innerWidth - 150;
      }
      if (pX > window.innerWidth - 130) pX = window.innerWidth - 130;
    }

    // --- TASK LOGIC & MARKERS ---
    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (!questEnded) {
      if (taskStage === 0) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '1050px'; // Bed on the right side of the screen
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 1050) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Make Bed";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 1) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '150px'; // Vanity / Mirror on the left side
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 150) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Brush Hair";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 2) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '580px'; // Table / Perfume in the middle
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 580) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Apply Perfume";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 3) {
        if (currentArea === 'balcony') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '600px';
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 600) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Look Over Balcony Railing";
            interactionPrompt.classList.remove('hidden');
          }
        }
      }
    }
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';

    if (pMoving) {
      princess.classList.add('running');
    } else {
      princess.classList.remove('running');
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
