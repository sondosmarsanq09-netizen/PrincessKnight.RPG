function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right');

let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room'; // 'room' <-> 'balcony'

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let pMoving = false;

  if (keys['w'] || keys['arrowup']) {
    pY -= speed;
    pMoving = true;
  }
  if (keys['s'] || keys['arrowdown']) {
    pY += speed;
    pMoving = true;
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  if (keys['a'] || keys['arrowleft']) {
    pX -= speed;
    pMoving = true;
    princess.classList.add('facing-left');
    princess.classList.remove('facing-right');
  }
  if (keys['d'] || keys['arrowright']) {
    pX += speed;
    pMoving = true;
    princess.classList.remove('facing-left');
    princess.classList.add('facing-right');
  }

  if (currentArea === 'room') {
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      if (pX > window.innerWidth - 280) {
        arrowRight.classList.add('highlight');
      } else {
        arrowRight.classList.remove('highlight');
      }
    }

    if (pX < 10) pX = 10;

    if (pX >= window.innerWidth - 130) {
      currentArea = 'balcony';
      if (gameBody) gameBody.style.backgroundImage = "url('NightimeBalcony.png')";
      if (locationBanner) locationBanner.textContent = "📍 Royal Balcony";
      if (objectiveText) objectiveText.textContent = "Free Roam: On the Balcony. Head left back into your room.";
      pX = 20;
    }
  } else if (currentArea === 'balcony') {
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= 10) {
      currentArea = 'room';
      if (gameBody) gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
      if (locationBanner) locationBanner.textContent = "📍 Princess's Chambers";
      if (objectiveText) objectiveText.textContent = "Free Roam: Walk around your room or head right to the Balcony.";
      pX = window.innerWidth - 150;
    }
    if (pX > window.innerWidth - 130) pX = window.innerWidth - 130;
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.toggle('running', pMoving);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
