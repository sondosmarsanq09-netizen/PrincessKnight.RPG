const princess = document.getElementById('princess');
const knight = document.getElementById('knight');

// Princess starting position
let pX = 400;
let pY = 200;

// Knight starting position
let kX = 200;
let kY = 215;

const speed = 4;
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  // --- 1. PRINCESS CONTROLS (Arrow Keys) ---
  let pMoving = false;

  if (keys['arrowup']) {
    pY -= speed;
    pMoving = true;
  }
  if (keys['arrowdown']) {
    pY += speed;
    pMoving = true;
  }
  if (keys['arrowleft']) {
    pX -= speed;
    pMoving = true;
    princess.classList.remove('facing-right');
  }
  if (keys['arrowright']) {
    pX += speed;
    pMoving = true;
    princess.classList.add('facing-right');
  }

  princess.style.left = pX + 'px';
  princess.style.top = pY + 'px';

  if (pMoving) {
    princess.classList.add('walking');
  } else {
    princess.classList.remove('walking');
  }

  // --- 2. KNIGHT CONTROLS (W, A, S, D) ---
  let kMoving = false;

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

  knight.style.left = kX + 'px';
  knight.style.top = kY + 'px';

  if (kMoving) {
    knight.classList.add('running');
  } else {
    knight.classList.remove('running');
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
