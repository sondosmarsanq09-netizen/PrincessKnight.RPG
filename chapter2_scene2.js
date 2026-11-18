function startScene2Intro() {
  const overlay = document.getElementById('transition-overlay');
  const meanwhileText = document.getElementById('meanwhile-text');

  if (!overlay) return;

  setTimeout(() => {
    if (meanwhileText) {
      meanwhileText.style.opacity = '0';
    }
    overlay.classList.remove('active');
    
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
let pY = 570; // Planted firmly on the floor
const speed = 5;
let currentArea = 'room'; // 'room', 'balcony'

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
  
  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  // FIXED CONTROLS: A = Walk Left (faces left), D = Walk Right (faces right)
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

    if (taskStage >= 3 && pX <= 10) {
      currentArea = 'balcony';
      gameBody.style.backgroundImage = "url('Balcony.png')";
      locationBanner.textContent = "📍 Royal Balcony";
      pX = 20; 
    }
  } else if (currentArea === 'balcony') {
    arrowLeft.style.display = 'none';
    if (pX >= window.innerWidth - 130) {
      currentArea = 'room';
      gameBody.style.backgroundImage = "url('PrincessRoom.png')";
      locationBanner.textContent = "📍 Princess's Chambers";
      pX = window.innerWidth - 150;
    }
    if (pX < 10) pX = 10;
  }

  // --- FIXED STATIONARY TASKS & MARKERS ---
  canInteract = false;
  taskMarker.classList.add('hidden');
  interactionPrompt.classList.add('hidden');

  if (taskStage === 0) {
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '200px'; // Stationary world coordinate
      taskMarker.style.top = '520px';

      if (Math.abs(pX - 200) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Make Bed";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 1) {
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '500px'; // Stationary world coordinate
      taskMarker.style.top = '520px';

      if (Math.abs(pX - 500) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Brush Hair";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 2) {
    if (currentArea === 'room') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '800px'; // Stationary world coordinate
      taskMarker.style.top = '520px';

      if (Math.abs(pX - 800) < 50) {
        canInteract = true;
        interactionPrompt.textContent = "Press [E] to Apply Perfume";
        interactionPrompt.classList.remove('hidden');
      }
    }
  } else if (taskStage === 3) {
    if (currentArea === 'balcony') {
      taskMarker.classList.remove('hidden');
      taskMarker.style.left = '600px'; // Stationary world coordinate
      taskMarker.style.top = '520px';

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

    if (pMoving) {
      princess.classList.add('running');
    } else {
      princess.classList.remove('running');
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
