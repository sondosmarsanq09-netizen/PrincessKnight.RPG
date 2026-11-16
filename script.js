const princess = document.getElementById('princess');

let x = 300;
let y = 200;
const speed = 4;
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let moving = false;

  if (keys['arrowup'] || keys['w']) {
    y -= speed;
    moving = true;
  }
  if (keys['arrowdown'] || keys['s']) {
    y += speed;
    moving = true;
  }
 if (keys['arrowleft'] || keys['a']) {
    x -= speed;
    moving = true;
    princess.classList.remove('facing-left'); // Faces natural left
  }
  if (keys['arrowright'] || keys['d']) {
    x += speed;
    moving = true;
    princess.classList.add('facing-left'); // Flips to face right
  }

  princess.style.left = x + 'px';
  princess.style.top = y + 'px';

  if (moving) {
    princess.classList.add('walking');
  } else {
    princess.classList.remove('walking');
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
