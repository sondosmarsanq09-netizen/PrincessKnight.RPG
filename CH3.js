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
const caughtFlash = document.getElementById('caught-flash');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right');

// King Presence & Dialogue UI
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const hidePrompt = document.getElementById('hide-prompt');
const torchSweep = document.getElementById('torch-sweep');
const kingShadowWrap = document.getElementById('king-shadow-wrap');
const royalDialogueCard = document.getElementById('royal-dialogue-card');
const royalSpeaker = document.getElementById('royal-speaker');
const royalLine = document.getElementById('royal-line');
const dialogueChoices = document.getElementById('dialogue-choices');
const cardFooter = document.getElementById('card-footer');

// Princess Coordinates & State
let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room'; // 'room' <-> 'balcony'
let isHiding = false;

// King Patrol State Machine: 'idle' | 'approaching' | 'checking' | 'dialogue' | 'scolding' | 'scold_result'
let patrolState = 'idle';
let patrolTimers = [];
let patrolCount = 0;
let scoldWasGrounded = false;

const royalLines = [
  '"Guards! Keep watch on the eastern corridor until sunrise. Nobody enters or leaves."',
  '"Hmm... thought I heard footsteps near the Princess\'s wing. All seems quiet."',
  '"Double the lantern patrols along the courtyard wall before dawn."'
];

const scoldScenarios = [
  {
    scold: '"BY THE CROWN! Why are you still wide awake past midnight instead of in bed?!"',
    choices: [
      {
        text: '1. "I couldn\'t sleep, Father—I just got up to sip some warm tea."',
        safe: true,
        reply: '"Hmph... very well. Finish your tea and get straight to sleep at once!"'
      },
      {
        text: '2. "I thought I heard a draft by the window and went to latch it."',
        safe: true,
        reply: '"A dutiful thought, though leave such checks to the night watch. Go to bed now."'
      },
      {
        text: '3. "Uh... I was just practicing walking in the dark for no reason!"',
        safe: false,
        reply: '"Nonsense! You\'re up to something! Straight to bed—I\'m posting a guard outside your door!"'
      }
    ]
  },
  {
    scold: '"HALT! What is the meaning of this?! You were ordered to be asleep hours ago!"',
    choices: [
      {
        text: '1. "Forgive me, Father—a terrible nightmare woke me up."',
        safe: true,
        reply: '"...A nightmare? *Sigh* Very well. Rest easy now, my daughter. Goodnight."'
      },
      {
        text: '2. "I dropped my prayer book and was searching the floor for it."',
        safe: true,
        reply: '"See that you find it quickly and extinguish the candles. Sleep well."'
      },
      {
        text: '3. "I\'m totally asleep right now! You\'re just seeing a sleepwalking ghost!"',
        safe: false,
        reply: '"Do NOT test my patience at this hour! Back to your bed immediately!"'
      }
    ]
  }
];

// --- WEB AUDIO SOUND EFFECTS ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

// Layered heavy boot thud + metallic armor/spur step sound
function playFootstepSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

    // Sound 1: Heavy boot heel thud
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(78, now);
    osc1.frequency.exponentialRampToValueAtTime(28, now + 0.18);
    gain1.gain.setValueAtTime(0.24, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.19);

    // Sound 2: Secondary sole / armor clink slightly delayed (0.07s)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(190, now + 0.07);
    osc2.frequency.exponentialRampToValueAtTime(65, now + 0.17);
    gain2.gain.setValueAtTime(0.08, now + 0.07);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.07);
    osc2.stop(now + 0.18);
  } catch (e) {}
}

// Dramatic low brass/alarm sting when caught
function playCaughtSting() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [110, 103.8].forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.55);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.58);
    });
  } catch (e) {}
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
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent = 'Heavy footsteps & lantern light approaching...';
  torchSweep.classList.add('active');

  // 4 faster, heavier footsteps building tension
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, 550));
  patrolTimers.push(setTimeout(triggerFootstepPulse, 1100));
  patrolTimers.push(setTimeout(triggerFootstepPulse, 1650));

  // King's silhouette steps into the doorway
  patrolTimers.push(setTimeout(() => {
    patrolState = 'checking';
    patrolAlert.classList.add('danger');
    patrolText.textContent = 'DANGER! Press [E] to HIDE in the shadows now!';
    kingShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      kingShadowWrap.classList.add('visible');
    });
  }, 1950));

  // First sharp glance inside
  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('looking-in');
  }, 2400));

  // Second deeper scan across the room (harder & longer hold!)
  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('deep-scan');
    patrolText.textContent = 'He is scanning the room... STAY HIDDEN!';
  }, 3600));

  // Survived! Normal royal line plays
  patrolTimers.push(setTimeout(() => {
    patrolState = 'dialogue';
    patrolAlert.classList.remove('danger');
    const line = royalLines[patrolCount % royalLines.length];
    patrolCount++;
    royalDialogueCard.classList.remove('hidden', 'scolding');
    royalSpeaker.textContent = '👑 HIS MAJESTY THE KING';
    royalLine.textContent = line;
    dialogueChoices.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    cardFooter.textContent = '[Space / E / Click] Continue';
  }, 5100));
}

function triggerCaughtScolding() {
  clearPatrolTimers();
  patrolState = 'scolding';
  scoldWasGrounded = false;

  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 650);

  kingShadowWrap.classList.add('visible', 'looking-in', 'deep-scan');
  patrolAlert.classList.add('danger');
  patrolText.textContent = 'CAUGHT! The King spotted you awake!';

  const scenario = scoldScenarios[patrolCount % scoldScenarios.length];
  patrolCount++;

  royalDialogueCard.classList.remove('hidden');
  royalDialogueCard.classList.add('scolding');
  royalSpeaker.textContent = '👑 FURIOUS KING — CAUGHT PAST CURFEW!';
  royalLine.textContent = scenario.scold;
  cardFooter.classList.add('hidden');

  // Build multi-choice answer buttons
  dialogueChoices.innerHTML = '';
  dialogueChoices.classList.remove('hidden');

  scenario.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      resolveScoldChoice(choice);
    });
    dialogueChoices.appendChild(btn);
  });
}

function resolveScoldChoice(choice) {
  patrolState = 'scold_result';
  scoldWasGrounded = !choice.safe;
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = choice.reply;
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = choice.safe
    ? '[Space / E / Click] Phew! Close call...'
    : '[Space / E / Click] Sent back to bed...';
}

function finishKingPatrol(wasGrounded = false) {
  clearPatrolTimers();
  royalDialogueCard.classList.add('hidden');
  royalDialogueCard.classList.remove('scolding');
  dialogueChoices.classList.add('hidden');
  kingShadowWrap.classList.remove('visible', 'looking-in', 'deep-scan');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden', 'danger');

  if (wasGrounded) {
    currentArea = 'room';
    gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
    objectiveText.textContent = "You got grounded to your bed! Wait for the coast to clear before sneaking out.";
    pX = window.innerWidth - 260;
    pY = 560;
    isHiding = false;
    princess.classList.remove('hidden-in-shadows');
  } else {
    objectiveText.textContent = "Close call! The King left—head to the Balcony or prepare your escape.";
  }

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('hidden');
    patrolState = 'idle';
    scheduleNextPatrol();
  }, 650));
}

function scheduleNextPatrol() {
  clearPatrolTimers();
  // Harder pacing: patrols every ~11 seconds
  patrolTimers.push(setTimeout(() => {
    if (patrolState === 'idle') {
      startKingPatrol();
    }
  }, 11000));
}

// Click card to advance non-choice dialogue
royalDialogueCard.addEventListener('click', () => {
  if (patrolState === 'dialogue') {
    finishKingPatrol(false);
  } else if (patrolState === 'scold_result') {
    finishKingPatrol(scoldWasGrounded);
  }
});

const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }

  // Number shortcuts 1 / 2 / 3 during scolding choices
  if (patrolState === 'scolding' && ['1', '2', '3'].includes(k)) {
    const btns = dialogueChoices.querySelectorAll('.choice-btn');
    const idx = parseInt(k, 10) - 1;
    if (btns[idx]) btns[idx].click();
    return;
  }

  // Advance normal dialogue or scold result
  if ((patrolState === 'dialogue' || patrolState === 'scold_result') && (k === ' ' || k === 'e' || k === 'enter')) {
    if (patrolState === 'dialogue') finishKingPatrol(false);
    else finishKingPatrol(scoldWasGrounded);
    return;
  }

  // Manual trigger [K]
  if (k === 'k' && patrolState === 'idle') {
    startKingPatrol();
    return;
  }

  // [E] Toggle hiding in shadows
  if (k === 'e' && !['dialogue', 'scolding', 'scold_result'].includes(patrolState)) {
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
  const lockedInDialogue = ['dialogue', 'scolding', 'scold_result'].includes(patrolState);

  if (!lockedInDialogue) {
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

    // Moving breaks stealth!
    if (pMoving && isHiding) {
      isHiding = false;
      princess.classList.remove('hidden-in-shadows');
    }
  }

  // Harder stealth rule: While King is checking the room, you MUST be hidden in shadows!
  if (patrolState === 'checking' && currentArea === 'room' && !isHiding) {
    triggerCaughtScolding();
  }

  // Vertical bounds
  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  // Hide prompt during patrol
  if (patrolState === 'approaching' || patrolState === 'checking') {
    hidePrompt.classList.remove('hidden');
    hidePrompt.textContent = isHiding
      ? 'Hidden in the shadows — DO NOT MOVE!'
      : '⚠️ Press [E] to HIDE before he looks in!';
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
