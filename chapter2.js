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

let kX = 400;
let kY = 450;
const speed = 6;
let currentArea = 'hall'; 
let inDialogue = false;

// --- UPGRADED TASK SYSTEM ---
let taskStage = 0; 
let canInteract = false;

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  // Press 'E' to complete interaction when near a task marker
  if (k === 'e' && canInteract && !inDialogue) {
    if (taskStage === 0) {
      taskStage = 1;
      objectiveText.textContent = "Objective: Head right to the Royal Garden to harvest a Moonbloom flower.";
    } else if (taskStage === 1) {
      taskStage = 2;
      objectiveText.textContent = "Objective: Return to Dragon's Hall and salute the grand statue.";
    } else if (taskStage === 2) {
      taskStage = 3;
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

    // --- EDGE ARROWS & HIGHLIGHTS (Hall only) ---
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

    // --- AREA SWITCHING LOGIC ---
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

    // --- INTERACTIVE TASK LOGIC & MARKER PLACEMENT ---
    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (taskStage === 0) {
      // Task 1: Forge Chambers - Inspect the anvil/forge tools
      if (currentArea === 'workspace') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '150px';
        taskMarker.style.top = '500px';

        // Check if player is standing close to the marker
        if (Math.abs(kX - 150) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Inspect Forge Anvil";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } 
    else if (taskStage === 1) {
      // Task 2: Royal Garden - Harvest Moonbloom Flower near fountain
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
      // Task 3: Dragon's Hall - Salute the Dragon Statue
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
