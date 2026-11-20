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

// King Presence UI Elements
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const hidePrompt = document.getElementById('hide-prompt');
const torchSweep = document.getElementById('torch-sweep');
const kingShadowWrap = document.getElementById('king-shadow-wrap');
const royalDialogueCard = document.getElementById('royal-dialogue-card');
const royalLine = document.getElementById('royal-line');

// Princess Coordinates & State
let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room'; // 'room' <-> 'balcony'
let isHiding = false;

// King Patrol State Machine: 'idle' | 'approaching' | 'checking' | 'dialogue'
let patrolState = 'idle';
let patrolTimers = [];
let patrolCount = 0;

const royalLines = [
  '"Guards! Keep watch on the eastern corridor until sunrise. Nobody enters or leaves."',
  '"Hmm... thought I heard footsteps near the Princess\'s wing. All seems quiet."',
  '"Double the lantern patrols along the courtyard wall before dawn."'
];

// Lightweight Web Audio Footstep Thud
let audioCtx = null;
function playFootstepSound() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(72, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, audioCtx.currentTime + 0.16);
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.18);
  } catch (e) {
    // Ignore if browser blocks audio before first gesture
  }
}

function triggerFootstepPulse() {
  gameBody.classList.remove('footstep-rumble');
  void gameBody.offsetWidth;
  gameBody.classList.add('footstep-rumble');
  playFootstepSound();
}

function clearPatrolTimers() {
  patrolTimers.forEach((id) => clearTimeout(id));
  patrolTimers = [];
}

function startKingPatrol() {
  if (patrolState !== 'idle') return;
  clearPatrolTimers();

  patrolState = 'approaching';
  patrolText.textContent = 'Heavy footsteps & lantern light approaching...';
  patrolAlert.classList.remove('hidden');
  torchSweep.classList.add('active');

  // 3 heavy footsteps leading up to the threshold
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, 750));
  patrolTimers.push(setTimeout(triggerFootstepPulse, 1500));

  // King's silhouette appears at the doorway / archway shadow
  patrolTimers.push(setTimeout(() => {
    patrolState = 'checking';
    patrolText.textContent = 'The King pauses at the threshold! Stay still or hide [E]!';
    kingShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      kingShadowWrap.classList.add('visible');
    });
  }, 2100));

  // Silhouette leans/looks into the room
  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('looking-in');
  }, 3000));

  // Dramatic Royal Dialogue Card pops up
  patrolTimers.push(setTimeout(() => {
    patrolState = 'dialogue';
    const line = royalLines[patrolCount % royalLines.length];
    patrolCount++;
    royalLine.textContent = line;
    royalDialogueCard.classList.remove('hidden');
  }, 4400));
}

function finishKingPatrol(wasCaught = false) {
  clearPatrolTimers();
  royalDialogueCard.classList.add('hidden');
  kingShadowWrap.classList.remove('visible', 'looking-in');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden');

  if (wasCaught) {
    // Gentle reset back into the room center if caught moving
    currentArea = 'room';
    gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
    objectiveText.textContent = "Close call! Stay still or press [E] to hide when the King passes.";
    pX = 420;
    pY = 570;
    isHiding = false;
    princess.classList.remove('hidden-in-shadows');
  } else {
    objectiveText.textContent = "The coast is clear. Head to the Balcony or prepare your escape.";
  }

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('hidden');
    patrolState = 'idle';
    scheduleNextPatrol();
  }, 700));
}

function scheduleNextPatrol() {
  clearPatrolTimers();
  // Automatically patrols every ~10 seconds during free roam
  patrolTimers.push(setTimeout(() => {
    if (patrolState === 'idle') {
      startKingPatrol();
    }
  }, 18000));
}

// Dismiss dialogue card on click or Space/E
royalDialogueCard.addEventListener('click', () => {
  if (patrolState === 'dialogue') {
    finishKingPatrol(false);
  }
});

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }

  // Advance royal dialogue card
  if (patrolState === 'dialogue' && (k === ' ' || k === 'e' || k === 'enter')) {
    finishKingPatrol(false);
    return;
  }

  // Manual trigger key [K] to test the King event anytime
  if (k === 'k' && patrolState === 'idle') {
    startKingPatrol();
    return;
  }

  // [E] to toggle hiding in the shadows
  if (k === 'e' && patrolState !== 'dialogue') {
    isHiding = !isHiding;
    princess.classList.toggle('hidden-in-shadows', isHiding);
    return;
  }

  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let pMoving = false;

  // Lock movement during dialogue card; moving un-hides the Princess
  if (patrolState !== 'dialogue') {
    if (keys['w'] || keys['arrowup']) {
      pY -= speed;
      pMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      pY += speed;
      pMoving = true;
    }
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

    if (pMoving && isHiding) {
      isHiding = false;
      princess.classList.remove('hidden-in-shadows');
    }
  }

  // If the King is actively looking into the room and Princess is moving in plain sight -> spotted!
  if (patrolState === 'checking' && pMoving && !isHiding && currentArea === 'room') {
    royalLine.textContent = '"Halt! Who is moving in the chambers at this hour?!"';
    patrolState = 'dialogue';
    royalDialogueCard.classList.remove('hidden');
    royalDialogueCard.onclick = () => {
      royalDialogueCard.onclick = null;
      finishKingPatrol(true);
    };
  }

  // Vertical bounds
  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  // Show hide prompt whenever patrol is active or Princess is near shadows
  if (patrolState === 'approaching' || patrolState === 'checking') {
    hidePrompt.classList.remove('hidden');
    hidePrompt.textContent = isHiding
      ? 'Hidden in the shadows — stay still!'
      : '[E] Duck into the shadows or freeze!';
  } else {
    hidePrompt.classList.add('hidden');
  }

  // Area transitions (Room <-> Balcony with arched doorway spawn)
  if (currentArea === 'room') {
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 280);
    }

    if (pX < 10) pX = 10;

    if (pX >= window.innerWidth - 130) {
      currentArea = 'balcony';
      gameBody.style.backgroundImage = "url('NightimeBalcony.png')";
      locationBanner.textContent = "📍 Royal Balcony";
      objectiveText.textContent = "Free Roam: On the Balcony. Head left back into your room.";
      pX = Math.round(window.innerWidth * 0.18);
      pY = Math.max(pY, 540);
    }
  } else if (currentArea === 'balcony') {
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= Math.round(window.innerWidth * 0.12)) {
      currentArea = 'room';
      gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
      locationBanner.textContent = "📍 Princess's Chambers";
      objectiveText.textContent = "Free Roam: Walk around your room or head right to the Balcony.";
      pX = window.innerWidth - 170;
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

scheduleNextPatrol();
gameLoop();
