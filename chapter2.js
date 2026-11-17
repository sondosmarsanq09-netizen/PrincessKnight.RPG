// Fade in on load
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

// Coordinates & Area State
let kX = 300;
let kY = 400;
const speed = 6;
let currentArea = 'middle'; // 'left' (WorkSpace), 'middle' (PolishDragon), 'right' (RoyalGarden)
let inDialogue = false;

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;
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
    
    // Vertical screen boundaries
    if (kY < 300) kY = 300;
    if (kY > window.innerHeight - 120) kY = window.innerHeight - 120;

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

    // --- AREA SWITCHING LOGIC (Left ↔ Middle ↔ Right) ---
    if (currentArea === 'middle') {
      // Walking left from PolishDragon -> WorkSpace.png
      if (kX <= 10) {
        currentArea = 'left';
        gameBody.style.backgroundImage = "url('WorkSpace.png')";
        locationBanner.textContent = "📍 Palace — Storage & Workspace";
        kX = window.innerWidth - 150; // Pop out on the right side of the workspace
      }
      // Walking right from PolishDragon -> RoyalGarden.png
      else if (kX >= window.innerWidth - 130) {
        currentArea = 'right';
        gameBody.style.backgroundImage = "url('RoyalGarden.png')";
        locationBanner.textContent = "📍 Palace — Royal Garden";
        kX = 20; // Pop out on the left side of the garden
      }
    } 
    else if (currentArea === 'left') {
      // Walking right from WorkSpace back to PolishDragon
      if (kX >= window.innerWidth - 130) {
        currentArea = 'middle';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Palace — Workshop";
        kX = 20;
      }
      // Wall clamp for the far-left edge
      if (kX < 10) kX = 10;
    } 
    else if (currentArea === 'right') {
      // Walking left from RoyalGarden back to PolishDragon
      if (kX <= 10) {
        currentArea = 'middle';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Palace — Workshop";
        kX = window.innerWidth - 150;
      }
      // Wall clamp for the far-right edge
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }
  }

  // Update DOM positions
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

// Start Chapter 2 Loop
gameLoop();
