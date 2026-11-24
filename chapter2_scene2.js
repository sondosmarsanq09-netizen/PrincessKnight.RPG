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

const vfxFlash = document.createElement('div');
Object.assign(vfxFlash.style, {
  position: 'fixed',
  inset: '0',
  pointerEvents: 'none',
  opacity: '0',
  transition: 'opacity 240ms ease-out',
  zIndex: '45'
});
document.body.appendChild(vfxFlash);

function triggerFlash(color = 'rgba(255, 200, 230, 0.22)') {
  vfxFlash.style.background = color;
  vfxFlash.style.opacity = '1';
  setTimeout(() => {
    vfxFlash.style.opacity = '0';
  }, 90);
}

let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room';
let inDialogue = false;
let isFadingOut = false;
let questEnded = false;

let taskStage = 0;
let canInteract = false;
let popupTimeout = null;

function showActionFeedback(message) {
  if (!actionPopup) return;

  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = (pX + 40) + 'px';
  actionPopup.style.top = (pY - 20) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above-princess 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

function fadeToScene3(nextSceneUrl = 'chapter2scene3.html') {
  if (isFadingOut) return;
  isFadingOut = true;

  if (window.GameAudio) GameAudio.playPageTurn();
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
    }, 1500);
  } else {
    window.location.href = nextSceneUrl;
  }
}

const keys = {};

window.addEventListener('keydown', (e) => {
  if (window.GameAudio) GameAudio.unlock();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (k === 'e' && canInteract && !inDialogue && !questEnded && !isFadingOut) {
    if (taskStage === 0) {
      taskStage = 1;
      if (window.GameAudio) GameAudio.playUiTick();
      triggerFlash('rgba(255, 225, 180, 0.18)');
      showActionFeedback("Bed Made Neatly!");
      objectiveText.textContent = "Objective: Brush your hair at the vanity dresser (left).";
    } else if (taskStage === 1) {
      taskStage = 2;
      if (window.GameAudio) GameAudio.playUiTick();
      triggerFlash('rgba(255, 200, 225, 0.18)');
      showActionFeedback("Hair Brushed Smoothly!");
      objectiveText.textContent = "Objective: Put on your favorite perfume at the table (middle).";
    } else if (taskStage === 2) {
      taskStage = 3;
      if (window.GameAudio) GameAudio.playChoiceChime();
      triggerFlash('rgba(255, 210, 240, 0.24)');
      showActionFeedback("Perfume Applied!");
      objectiveText.textContent = "🔊 Objective: Strange noises are coming from outside... Head right to the Balcony to investigate!";
    } else if (taskStage === 3) {
      taskStage = 4;
      questEnded = true;
      if (window.GameAudio) GameAudio.playSuccess();
      triggerFlash('rgba(255, 175, 215, 0.26)');
      taskMarker.classList.add('hidden');
      interactionPrompt.classList.add('hidden');
      showActionFeedback("💕 Oh! It's him... down in the Royal Garden!");
      objectiveText.textContent = "✅ Princess spotted her favorite knight! Scene complete.";

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

    if (window.GameAudio) {
      GameAudio.updateStrideFootsteps(pMoving);
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
        if (window.GameAudio) GameAudio.playPageTurn();
        triggerFlash('rgba(190, 220, 255, 0.2)');
        gameBody.style.backgroundImage = "url('Balcony.png')";
        locationBanner.textContent = "📍 Royal Balcony";
        pX = 20;
      }
    } else if (currentArea === 'balcony') {
      arrowRight.style.display = 'none';
      if (pX <= 10) {
        currentArea = 'room';
        if (window.GameAudio) GameAudio.playPageTurn();
        gameBody.style.backgroundImage = "url('PrincessRoom.png')";
        locationBanner.textContent = "📍 Princess's Chambers";
        pX = window.innerWidth - 150;
      }
      if (pX > window.innerWidth - 130) pX = window.innerWidth - 130;
    }

    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (!questEnded) {
      if (taskStage === 0) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '1050px';
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
          taskMarker.style.left = '150px';
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
          taskMarker.style.left = '580px';
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
    princess.classList.toggle('running', pMoving);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
