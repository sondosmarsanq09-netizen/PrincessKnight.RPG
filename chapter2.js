window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');

let kX = 400;
let kY = 450;
const speed = 6;
let currentArea = 'hall'; 
let inDialogue = false;

// Task System State
let taskStage = 0;
let canInteract = false;

// Helper to show sparkling feedback floating right above the knight's head
function showActionFeedback(message) {
  actionPopup.textContent = "✨ " + message + " ✨";
  
  actionPopup.style.left = (kX + 60) + 'px';
  actionPopup.style.top = (kY - 10) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight; // trigger reflow
  actionPopup.style.animation = 'float-above-knight 1.6s ease-out forwards';
  
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
      showActionFeedback("Anvil Inspected! +1 Forged Steel");
      objectiveText.textContent = "Objective: Head right to the Royal Garden to harvest a Moonbloom flower.";
    } else if (taskStage === 1) {
      taskStage = 2;
      showActionFeedback("Moonbloom Harvested Successfully!");
      objectiveText.textContent = "Objective: Return to Dragon's Hall and salute the grand statue.";
    } else if (taskStage === 2) {
      taskStage = 3;
      showActionFeedback("Grand Statue Saluted! Duties Complete!");
      objectiveText.textContent = "✅ All Chapter 2 palace duties completed successfully!";
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let kMoving = false;

  if (!inDialogue) {
    if (keys['w']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s']) {
      kY += speed;
      kMoving = true;
    }
    
    if (kY < 350) kY = 350;
    if (kY > window.innerHeight - 100) kY = window.innerHeight - 100;

    if (keys['a']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    if (currentArea === 'hall') {
      arrowLeft.style.display = 'flex';
      arrowRight.style.display = 'flex';
      
      if (kX < 180) {
        arrowLeft.classList.add('highlight');
      } else {
        arrowLeft.classList.remove('highlight');
      }
      if (kX > window.innerWidth - 280) {
        arrowRight.classList.add('highlight');
      } else {
        arrowRight.classList.remove('highlight');
      }
    } else {
      arrowLeft.style.display = 'none';
      arrowRight.style.display = 'none';
    }

    if (currentArea === 'hall') {
      if (kX <= 10) {
        currentArea = 'workspace';
        gameBody.style.backgroundImage = "url('WorkSpace.png')";
        locationBanner.textContent = "📍 Forge Chambers";
        kX = window.innerWidth - 150; 
      }
      else if (kX >= window.innerWidth - 130) {
        currentArea = 'garden';
        gameBody.style.backgroundImage = "url('RoyalGarden.png')";
        locationBanner.textContent = "📍 Royal Garden";
        kX = 20; 
      }
    } 
    else if (currentArea === 'workspace') {
      if (kX >= window.innerWidth - 130) {
        currentArea = 'hall';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Dragon's Hall";
        kX = 20;
      }
      if (kX < 10) kX = 10;
    } 
    else if (currentArea === 'garden') {
      if (kX <= 10) {
        currentArea = 'hall';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Dragon's Hall";
        kX = window.innerWidth - 150;
      }
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }

    // --- TASK LOGIC & MARKERS ---
    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (taskStage === 0) {
      if (currentArea === 'workspace') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '500px'; 
        taskMarker.style.top = '500px';

        if (Math.abs(kX - 500) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Inspect Forge Anvil";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } 
    else if (taskStage === 1) {
      if (currentArea === 'garden') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '350px';
        taskMarker.style.top = '480px';

        if (Math.abs(kX - 350) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Harvest Moonbloom";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } 
    else if (taskStage === 2) {
      if (currentArea === 'hall') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '600px';
        taskMarker.style.top = '500px';

        if (Math.abs(kX - 600) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Salute Dragon Statue";
          interactionPrompt.classList.remove('hidden');
        }
      }
    }
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';

    if (kMoving) {
      knight.classList.add('running');
    } else {
      knight.classList.remove('running');
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
