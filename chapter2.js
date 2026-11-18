window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');

let kX = 400;
let kY = 450;
const speed = 6;
let currentArea = 'hall'; 
let inDialogue = false;

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
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
