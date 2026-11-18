function startScene2Intro() {
  const overlay = document.getElementById('transition-overlay');
  const meanwhileText = document.getElementById('meanwhile-text');

  if (!overlay) return;

  // Keep "Meanwhile..." visible for 2 seconds, then fade both out smoothly
  setTimeout(() => {
    if (meanwhileText) {
      meanwhileText.style.opacity = '0';
    }
    overlay.classList.remove('active');
    
    // Completely hide the overlay after the 1.5s fade finishes so it never blocks clicks/screen
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 1500);
  }, 2000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startScene2Intro);
} else {
  startScene2Intro();
}

const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowLeft = document.getElementById('arrow-left');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

let pX = 400;
let pY = 450;
const speed = 5;
let currentArea = 'room'; // 'room', 'balcony'

// Task Stages:
// 0: Make bed in room
// 1: Brush hair on dresser
// 2: Apply perfume
// 3: Hear noise -> Go to balcony to inspect
// 4: Complete / Spot Knight
let taskStage = 0;
let canInteract = false;

function showActionFeedback(message) {
  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = (pX + 40) + 'px';
  actionPopup.style.top = (pY - 20) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above-princess 1.6s ease-out forwards';
  
  setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 1600);
}

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  // Press 'E' to interact
  if (k === 'e' && canInteract) {
    if (taskStage === 0) {
      taskStage = 1;
      showActionFeedback("Bed Made Neatly!");
      objectiveText.textContent = "Objective: Brush your hair at the vanity dresser.";
    } else if (taskStage === 1) {
      taskStage = 2;
      showActionFeedback("Hair Brushed Smoothly!");
      objectiveText.textContent = "Objective: Put on your favorite perfume.";
    } else if (taskStage === 2) {
      taskStage = 3;
      showActionFeedback("Perfume Applied!");
      objectiveText.textContent = "🔊 Objective: Strange noises are coming from outside... Head left to the Balcony to investigate!";
    } else if (taskStage === 3) {
      taskStage = 4;
      showActionFeedback("💕 Oh! It's him... down in the Royal Garden!");
      objectiveText.textContent = "✅ Princess spotted her favorite knight! Scene complete.";
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let pMoving = false;

  if (keys['w']) { pY -= speed; pMoving = true; }
  if (keys['s']) { pY += speed; pMoving = true; }
  
  if (pY < 350) pY = 350;
  if (pY > window.innerHeight - 100) pY = window.innerHeight - 100;

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

  // --- ROOM / BALCONY NAVIGATION ---
  if (currentArea === 'room') {
    if (taskStage >= 3) {
      arrowLeft.style.display = 'flex';
      if (pX < 180) {
        arrowLeft.classList.add('highlight');
      } else {
        arrowLeft.classList.remove('highlight');
      }
    } else {
      arrowLeft.style.display = 'none';
    }

    // Doorway / Edge to Balcony (only unlocked after hearing noise at stage 3)
    if (taskStage >= 3 && pX <= 10) {
      currentArea = 'balcony';
      gameBody.style.backgroundImage = "url('Balcony.png')"; // Replace with balcony background asset
      locationBanner.textContent = "📍 Royal Balcony";
      pX = window.innerWidth - 150;
    }
  } else if (currentArea === 'balcony') {
    arrowLeft.style.display = 'none';
    if (pX >= window.innerWidth - 130) {
      currentArea = 'room';
      gameBody.style.backgroundImage = "url('PrincessRoom.png')";
      locationBanner.textContent = "📍 Princess's Chambers";
      pX = 20;
    }
    if (pX < 10) pX = 10;
  }

  // --- TASKS & MARKERS ---
  canInteract = false;
  taskMarker.classList.add('hidden');
  interactionPrompt.classList.add('hidden');

  if (taskStage === 0) {
    // Make Bed (left side of room)
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '200px';
      taskMarker.style.top = '480px';

      if (Math.abs(pX - 200) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Make Bed";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 1) {
    // Brush Hair on Dresser (middle of room)
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '500px';
      taskMarker.style.top = '480px';

      if (Math.abs(pX - 500) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Brush Hair";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 2) {
    // Wear Perfume (right side of room)
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '800px';
      taskMarker.style.top = '480px';

      if (Math.abs(pX - 800) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Apply Perfume";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 3) {
    // Inspect Noise on Balcony
    if (currentArea === 'balcony') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '600px';
      taskMarker.style.top = '480px';

      if (Math.abs(pX - 600) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Look Over Balcony Railing";
        interactionPrompt.classList.remove('hidden');
      }
    }
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
