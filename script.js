const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const objectiveText = document.getElementById('objective');

// Knight starting position
let kX = 200;
let kY = 400;
const speed = 4;

// Scene & Quest Progression state
let currentScene = 1; // 1 = Town Square, 2 = Fountain Area
let hasRing = false;

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let kMoving = false;

  // Knight Controls (W, A, S, D)
  if (keys['w']) {
    kY -= speed;
    kMoving = true;
  }
  if (keys['s']) {
    kY += speed;
    kMoving = true;
  }
  if (keys['a']) {
    kX -= speed;
    kMoving = true;
    knight.classList.add('facing-left');
  }
  if (keys['d']) {
    kX += speed;
    kMoving = true;
    knight.classList.remove('facing-left');
  }

  // Vertical pathway bounds
  kY = Math.max(250, Math.min(650, kY));
  kX = Math.max(0, Math.min(window.innerWidth - 100, kX));

  // --- SC1 QUEST LOGIC ---
  if (currentScene === 1) {
    // Check if knight visits the Blacksmith shop area (e.g., right side of town square around X: 700+)
    if (!hasRing && kX >= 700) {
      hasRing = true;
      objectiveText.textContent = "Objective: Picked up the King's ring! Now head left to the outer gates fountain.";
      console.log("Ring acquired from the blacksmith!");
    }

    // If he has the ring and walks to the far left edge, transition to the fountain scene
    if (hasRing && kX <= 10) {
      currentScene = 2;
      gameBody.style.backgroundImage = "url('image_54e525.png')"; // Fountain background
      kX = 100; // Spawn knight on the left side of fountain
      
      // Reveal the Princess waiting by the fountain!
      princess.classList.remove('hidden');
      objectiveText.textContent = "Objective: Talk to the Princess by the fountain.";
      console.log("Transitioned to Fountain Scene - Princess appears!");
    }
  } else if (currentScene === 2) {
    // In the fountain scene, if he walks close to the princess, trigger dialogue encounter
    let distance = Math.abs(kX - parseInt(princess.style.left || 700));
    if (distance < 80) {
      objectiveText.textContent = "Event: 'Your Highness?! What are you doing out here?!'";
    }
  }

  // Update Knight position on screen
  knight.style.left = kX + 'px';
  knight.style.top = kY + 'px';

  if (kMoving) {
    knight.classList.add('running');
  } else {
    knight.classList.remove('running');
  }

  requestAnimationFrame(gameLoop);
}

// Start the loop
gameLoop();
