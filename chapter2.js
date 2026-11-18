// Fade in on load
window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');

// Coordinates & Zone Tracking
let kX = 100;
let kY = 400;
const speed = 6;
const keys = {};

// Zones: 1 = Chambers (Left), 2 = Workshop / PolishDragon (Center), 3 = Royal Garden (Right)
let currentZone = 1; 

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

  if (keys['w']) {
    kY -= speed;
    kMoving = true;
  }
  if (keys['s']) {
    kY += speed;
    kMoving = true;
  }
  
  // Boundary clamps
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

  // --- ZONE TRANSITIONS (Horizontal wrapping between screens) ---
  // Walking off the left edge of current zone
  if (kX < 0) {
    if (currentZone === 2) {
      // Move from Workshop back to Chambers
      currentZone = 1;
      document.body.style.backgroundImage = "url('Chambers.png')";
      locationBanner.textContent = "📍 Palace Chambers";
      kX = window.innerWidth - 100; // Appear on right side of Chambers
    } else {
      kX = 0; // Hard stop at far left of Chambers
    }
  }

  // Walking off the right edge of current zone
  if (kX > window.innerWidth - 80) {
    if (currentZone === 1) {
      // Move from Chambers to Workshop (PolishDragon)
      currentZone = 2;
      document.body.style.backgroundImage = "url('PolishDragon.png')";
      locationBanner.textContent = "📍 Palace Workshop — Gear Area";
      if (objectiveText) {
        objectiveText.textContent = "Objective: Tend to the workshop gear. What was that sound?";
      }
      kX = 50; // Appear on left side of Workshop
    } else if (currentZone === 2) {
      // Move from Workshop to Royal Garden
      currentZone = 3;
      document.body.style.backgroundImage = "url('RoyalGarden.png')";
      locationBanner.textContent = "📍 Royal Gardens";
      if (objectiveText) {
        objectiveText.textContent = "Objective: Patrol the quiet gardens.";
      }
      kX = 50; // Appear on left side of Garden
    } else {
      kX = window.innerWidth - 80; // Hard stop at far right of Garden
    }
  }

  // Update DOM position
  knight.style.left = kX + 'px';
  knight.style.top = kY + 'px';

  requestAnimationFrame(gameLoop);
}

// Start the loop
gameLoop();

// Chapter Transition Helper for later
function transitionToNextChapter(nextChapterFilename) {
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');
  setTimeout(() => {
    window.location.href = nextChapterFilename;
  }, 1000);
}
