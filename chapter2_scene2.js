window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right'); // Balcony indicator on the right
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

let pX = 400;
let pY = 570; // Planted firmly on the floor
const speed = 6;
let currentArea = 'room'; 
let inDialogue = false;

// Task System State
let taskStage = 0;
let canInteract = false;

// Helper to show sparkling feedback floating right above the princess's head
function showActionFeedback(message) {
  actionPopup.textContent = "✨ " + message + " ✨";
  
  actionPopup.style.left = (pX + 40) + 'px';
  actionPopup.style.top = (pY - 20) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight; // trigger reflow
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

  // Press 'E' to interact when near the task marker
  if (k === 'e' && canInteract && !inDialogue) {
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
      objectiveText.textContent = "🔊 Objective: Strange noises are coming from outside... Head right to the Balcony to investigate!";
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

  if (!inDialogue) {
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
        pX = window.innerWidth - 150; // Returns to the right side of the room
      }
      if (pX > window.innerWidth - 130) pX = window.innerWidth - 130;
    }

    // --- TASK LOGIC & MARKERS ---
    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (taskStage === 0) {
      if (currentArea === 'room') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '200px'; 
        taskMarker.style.top = '520px';

        if (Math.abs(pX - 200) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Make Bed";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } 
    else if (taskStage === 1) {
      if (currentArea === 'room') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '500px';
        taskMarker.style.top = '520px';

        if (Math.abs(pX - 500) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Brush Hair";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } 
    else if (taskStage === 2) {
      if (currentArea === 'room') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '800px';
        taskMarker.style.top = '520px';

        if (Math.abs(pX - 800) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Apply Perfume";
          interactionPrompt.classList.remove('hidden');
        }
      }
    }
    else if (taskStage === 3) {
      if (currentArea === 'balcony') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '600px';
        taskMarker.style.top = '520px';

        if (Math.abs(pX - 600) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Look Over Balcony Railing";
          interactionPrompt.classList.remove('hidden');
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
