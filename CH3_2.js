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
const princessEmote = document.getElementById('princess-emote');
const worldLayer = document.getElementById('world-layer');
const caughtFlash = document.getElementById('caught-flash');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const noiseBarFill = document.getElementById('noise-bar-fill');
const susBadge = document.getElementById('sus-badge');
const panicStatus = document.getElementById('panic-status');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
const obstacleMarkersWrap = document.getElementById('obstacle-markers');
const actionPrompt = document.getElementById('action-prompt');
const panicPrompt = document.getElementById('panic-prompt');
const panicPromptText = document.getElementById('panic-prompt-text');
const panicBarFill = document.getElementById('panic-bar-fill');
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const torchSweep = document.getElementById('torch-sweep');
const guardShadowWrap = document.getElementById('guard-shadow-wrap');

const pDialogueBox = document.getElementById('princess-dialogue-box');
const pSpeaker = document.getElementById('p-speaker');
const pDialogueText = document.getElementById('p-dialogue-text');

const royalDialogueCard = document.getElementById('royal-dialogue-card');
const royalSpeaker = document.getElementById('royal-speaker');
const royalLine = document.getElementById('royal-line');
const dialogueChoices = document.getElementById('dialogue-choices');
const cardFooter = document.getElementById('card-footer');

const wingMapModal = document.getElementById('wing-map-modal');
const closeMapBtn = document.getElementById('close-map-btn');
const mapCurrentStatus = document.getElementById('map-current-status');

const escapeCompleteModal = document.getElementById('escape-complete-modal');
const escapeSummaryText = document.getElementById('escape-summary-text');
const replayScene2Btn = document.getElementById('replay-scene2-btn');

const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskInstructions = document.getElementById('task-instructions');
const taskBody = document.getElementById('task-body');
const closeTaskBtn = document.getElementById('close-task-btn');

// Carryover from Scene 1 (starts in room at the same spot she finished Scene 1)
let carryover = {};
try {
  const raw = sessionStorage.getItem('ch3_s2_carryover');
  if (raw) carryover = JSON.parse(raw) || {};
} catch (e) {}

const startX = Number.isFinite(carryover.pX) ? carryover.pX : 400;
const startY = Number.isFinite(carryover.pY) ? carryover.pY : 570;

let pX = startX;
let pY = startY;
const baseSpeed = 6;
let currentArea = 'room'; // 'room' <-> 'hallway' (left) or 'balcony' (right)
let isHiding = false;
let noiseLevel = 0;
let escapedToLeftChambers = false;

let caughtCount = Number.isFinite(carryover.caughtCount) ? carryover.caughtCount : 0;
let isKingSus = Boolean(carryover.isKingSus);
let isPanicking = false;
let breathsNeeded = 0;
const PANIC_PASSOUT_LIMIT = 8.5;
let panicTimeLeft = PANIC_PASSOUT_LIMIT;
let panicCountdownInterval = null;

let monologueQueue = [];
let isMonologueActive = false;
let patrolState = 'idle'; // 'idle' | 'approaching' | 'checking' | 'dialogue' | 'scolding' | 'scold_result'
let patrolTimers = [];
let patrolCount = 0;
let pendingOutcome = null;
let activeObstacle = null;
let caughtTriggeredThisCheck = false;
let activeMiniGameTimer = null;

const obstacles = [
  {
    id: 'creaky_boards',
    area: 'hallway',
    label: '🪵 Creaky Floorboards',
    xPct: 0.72,
    y: 550,
    cleared: false
  },
  {
    id: 'tea_cart',
    area: 'hallway',
    label: '🛎️ Silver Tea Cart',
    xPct: 0.48,
    y: 565,
    cleared: false
  },
  {
    id: 'moon_vases',
    area: 'hallway',
    label: '🏺 Moonlit Vases',
    xPct: 0.25,
    y: 545,
    cleared: false
  }
];

const guardNormalLines = [
  '"Keep your lantern low along the west corridor. No one is meant to be out past midnight."',
  '"All quiet near the royal chambers—stay sharp until dawn."',
  '"Check every shadow by the tall windows and report anything unusual."'
];

const guardSusLines = [
  '"His Majesty ordered extra eyes on the Princess\'s wing tonight. Watch every move!"',
  '"Stay alert—if anyone slips out of the chambers, sound the alarm immediately."',
  '"Keep your voice down and watch the corridor ends closely."'
];

const caughtEncounter = {
  scold: '"Halt! What are you doing out here making noise at this hour?!"',
  hint: 'Hint: Keep your story calm so you do not give away your escape.',
  choices: [
    {
      text: '1. "I could not sleep and stepped out for a moment."',
      safe: true,
      reply: '"See that you head back inside before His Majesty hears of you wandering."'
    },
    {
      text: '2. "The candles flickered—I was checking the room."',
      safe: true,
      reply: '"A guard will relight them. Keep your voice down and stay out of trouble."'
    },
    {
      text: '3. "I am sneaking out past the wing!"',
      safe: false,
      reply: '"INTRUDER IN THE CORRIDOR! Seize her and check the hall!"'
    }
  ]
};

if (isKingSus) {
  susBadge.classList.remove('hidden');
}

function getCurrentMovementSpeed() {
  if (!isPanicking) return baseSpeed;
  const slowdown = Math.min(4.5, 2.6 + (caughtCount - 1) * 0.85);
  return Math.max(1.3, baseSpeed - slowdown);
}

// --- EMOTES & DIALOGUE ---
let emoteTimeout = null;
function showEmote(symbol = '!', duration = 1600) {
  if (!princessEmote) return;
  const allowed = ['!', '...', '✦', '?'];
  const cleanSymbol = allowed.includes(symbol) ? symbol : '!';
  princessEmote.classList.add('hidden');
  void princessEmote.offsetWidth;
  princessEmote.textContent = cleanSymbol;
  princessEmote.classList.remove('hidden');
  clearTimeout(emoteTimeout);
  emoteTimeout = setTimeout(() => {
    princessEmote.classList.add('hidden');
  }, duration);
}

function queueMonologue(lines, onFinish = null, speakerLabel = 'PRINCESS') {
  monologueQueue = lines.map((item) => ({ ...item, speaker: item.speaker || speakerLabel }));
  pDialogueBox._onFinish = onFinish;
  advanceMonologue();
}

function advanceMonologue() {
  if (monologueQueue.length === 0) {
    isMonologueActive = false;
    pDialogueBox.classList.add('hidden');
    const cb = pDialogueBox._onFinish;
    pDialogueBox._onFinish = null;
    if (typeof cb === 'function') cb();
    return;
  }
  isMonologueActive = true;
  const item = monologueQueue.shift();
  pSpeaker.textContent = item.speaker;
  pDialogueText.textContent = item.text;
  if (item.emote) showEmote(item.emote, 1600);
  pDialogueBox.classList.remove('hidden');
}

pDialogueBox.addEventListener('click', advanceMonologue);

// --- [M] MAP MODAL WITH BACKGROUND BLUR ---
function updateMapHighlight() {
  document.querySelectorAll('.map-node').forEach((node) => {
    node.classList.toggle('active-zone', node.dataset.zone === currentArea);
  });
  const areaNames = {
    room: "Princess's Chambers (Walk left into Escape Hallway; Balcony is right)",
    hallway: 'Escape Hallway (Left of room — stay quiet past obstacles & head left to Left Chambers)',
    balcony: 'Royal Balcony (Right of room — no safety if spotted)'
  };
  if (mapCurrentStatus) {
    mapCurrentStatus.innerHTML =
      `<div>• Current Zone: ${areaNames[currentArea] || currentArea} • Noise: ${Math.round(noiseLevel)}%</div>` +
      `<div>• Keep noise low—if it hits 100%, guards will come check on you.</div>`;
  }
}

function openWingMap() {
  if (escapedToLeftChambers) return;
  closeObstacleModal();
  updateMapHighlight();
  wingMapModal.classList.remove('hidden');
  worldLayer.classList.add('map-blurred');
}

function closeWingMap() {
  wingMapModal.classList.add('hidden');
  worldLayer.classList.remove('map-blurred');
}

function toggleWingMap() {
  if (wingMapModal.classList.contains('hidden')) {
    openWingMap();
  } else {
    closeWingMap();
  }
}

closeMapBtn.addEventListener('click', closeWingMap);

// --- PANIC & BREATHING ---
function stopPanicTimer() {
  if (panicCountdownInterval) {
    clearInterval(panicCountdownInterval);
    panicCountdownInterval = null;
  }
}

function triggerPostCatchPanic() {
  stopPanicTimer();
  isPanicking = true;
  breathsNeeded = Math.min(5, 2 + caughtCount);
  panicTimeLeft = PANIC_PASSOUT_LIMIT;

  worldLayer.classList.add('panic-blur');
  panicStatus.classList.remove('hidden');
  panicStatus.textContent = '💔 DANGER: Princess is having a panic attack — calm her down [B]!';
  panicPrompt.classList.remove('hidden');
  panicPromptText.textContent = `💔 DANGER: Panic attack! Calm her down with [B] (${breathsNeeded} breaths left) before she passes out!`;
  panicBarFill.style.width = '100%';
  showEmote('!', 1600);

  const tickMs = 80;
  panicCountdownInterval = setInterval(() => {
    if (!isPanicking) {
      stopPanicTimer();
      return;
    }
    panicTimeLeft -= tickMs / 1000;
    if (panicTimeLeft <= 0) {
      panicTimeLeft = 0;
      panicBarFill.style.width = '0%';
      stopPanicTimer();
      handlePanicPassOut();
      return;
    }
    panicBarFill.style.width = Math.max(0, (panicTimeLeft / PANIC_PASSOUT_LIMIT) * 100) + '%';
  }, tickMs);
}

function clearPanicState() {
  isPanicking = false;
  breathsNeeded = 0;
  stopPanicTimer();
  worldLayer.classList.remove('panic-blur');
  panicPrompt.classList.add('hidden');
  panicStatus.classList.add('hidden');
}

function handlePanicPassOut() {
  clearPanicState();
  closeObstacleModal();
  setArea('room', startX, startY);
  setHidingState(false);

  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 600);

  queueMonologue([
    {
      text: "Ugh... I couldn't catch my breath for a second... stay steady and keep quiet.",
      emote: '...'
    }
  ]);
}

function performSteadyBreath() {
  if (!isPanicking) return;
  breathsNeeded--;
  panicTimeLeft = Math.min(PANIC_PASSOUT_LIMIT, panicTimeLeft + 1.1);

  if (breathsNeeded <= 0) {
    clearPanicState();
    showEmote('✦', 1600);
    queueMonologue([
      {
        text: "Okay... slow breaths. My head's finally clearing up.",
        emote: '...'
      }
    ]);
  } else {
    panicPromptText.textContent = `💔 DANGER: Still panicking! Press [B] to calm her down (${breathsNeeded} left)`;
  }
}

// --- AUDIO & NOISE ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playFootstepSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;

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
  } catch (e) {}
}

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
  worldLayer.classList.remove('footstep-rumble');
  void worldLayer.offsetWidth;
  worldLayer.classList.add('footstep-rumble');
  playFootstepSound();
}

function addNoise(amount, reasonText) {
  if (escapedToLeftChambers) return;
  const mult = isKingSus ? 1.35 : 1.0;
  noiseLevel = Math.min(100, noiseLevel + amount * mult);
  noiseBarFill.style.width = noiseLevel + '%';
  showEmote('!', 1400);

  if (noiseLevel >= 100 && patrolState === 'idle') {
    noiseLevel = 0;
    noiseBarFill.style.width = '0%';
    closeObstacleModal();
    startGuardCheck(
      reasonText || '"Too much noise! Guards, go check on the Princess\'s wing right now!"'
    );
  }
}

function resetHallwayObstacles() {
  obstacles.forEach((o) => {
    o.cleared = false;
  });
  renderObstacleMarkers();
}

// --- AREA TRANSITIONS ---
function setArea(nextArea, nextX, nextY) {
  currentArea = nextArea;
  if (typeof nextX === 'number') pX = nextX;
  if (typeof nextY === 'number') pY = nextY;

  if (currentArea === 'room') {
    worldLayer.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
  } else if (currentArea === 'hallway') {
    worldLayer.style.backgroundImage = "url('EscapeHallway.jpg')";
    locationBanner.textContent = '📍 Escape Hallway';
  } else if (currentArea === 'balcony') {
    worldLayer.style.backgroundImage = "url('NightimeBalcony.png')";
    locationBanner.textContent = '📍 Royal Balcony';
  }

  renderObstacleMarkers();
  updateMapHighlight();
}

function getObstacleScreenX(obs) {
  return Math.max(130, Math.min(window.innerWidth - 160, Math.round(window.innerWidth * obs.xPct)));
}

function renderObstacleMarkers() {
  obstacleMarkersWrap.innerHTML = '';
  if (escapedToLeftChambers) return;
  obstacles.forEach((obs) => {
    if (obs.area !== currentArea) return;
    const el = document.createElement('div');
    el.className = 'task-hotspot' + (obs.cleared ? ' cleared' : '');
    const safeX = getObstacleScreenX(obs);
    const safeY = Math.max(160, Math.min(window.innerHeight - 150, obs.y - 75));
    el.style.left = safeX + 'px';
    el.style.top = safeY + 'px';
    el.textContent = obs.cleared ? `${obs.label} ✔` : obs.label;
    obstacleMarkersWrap.appendChild(el);
  });
}

function getNearbyObstacle() {
  if (escapedToLeftChambers) return null;
  return obstacles.find((obs) => {
    if (obs.area !== currentArea || obs.cleared) return false;
    const ox = getObstacleScreenX(obs);
    return Math.abs(pX - ox) < 170 && Math.abs(pY - obs.y) < 150;
  });
}

function setHidingState(nextHidden) {
  isHiding = Boolean(nextHidden);
  princess.classList.toggle('hidden-in-shadows', isHiding);
}

// --- HALLWAY OBSTACLE CHALLENGES ---
function clearMiniGameTimer() {
  if (activeMiniGameTimer) {
    clearInterval(activeMiniGameTimer);
    activeMiniGameTimer = null;
  }
}

function closeObstacleModal() {
  clearMiniGameTimer();
  activeObstacle = null;
  taskModal.classList.add('hidden');
}

closeTaskBtn.addEventListener('click', closeObstacleModal);

function completeObstacle(obs) {
  clearMiniGameTimer();
  obs.cleared = true;
  closeObstacleModal();
  renderObstacleMarkers();
  showEmote('✦', 1600);
  queueMonologue([
    {
      text: `${obs.label.replace(/^[^\s]+\s/, '')} cleared quietly. Keep heading left toward the chambers.`,
      emote: '...'
    }
  ]);
}

function openObstacleModal(obs) {
  if (patrolState !== 'idle' || isMonologueActive || escapedToLeftChambers) return;
  clearMiniGameTimer();
  activeObstacle = obs;
  taskModal.classList.remove('hidden');
  taskBody.innerHTML = '';

  if (obs.id === 'creaky_boards') {
    taskTitle.textContent = '🪵 Creaky Floorboards';
    taskInstructions.textContent = 'Step across the floorboards in sequence (1 → 2 → 3) without a loud creak.';
    let step = 1;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" data-n="2">2. Center Plank</button>
        <button class="stealth-btn" data-n="1">1. Edge Beam</button>
        <button class="stealth-btn" data-n="3">3. Stone Trim</button>
      </div>
    `;
    taskBody.querySelectorAll('.stealth-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.n, 10);
        if (n === step) {
          btn.classList.add('done');
          step++;
          addNoise(12);
          if (step > 3) completeObstacle(obs);
        } else {
          addNoise(48, '"CREAK!! Someone stepped heavily on the floorboards! Guards, check the hall!"');
        }
      });
    });
  } else if (obs.id === 'tea_cart') {
    taskTitle.textContent = '🛎️ Silver Tea Cart';
    taskInstructions.textContent = 'Steady the teacups when the marker is inside the green zone!';
    let steadied = 0;
    let pos = 10;
    let dir = 1;
    taskBody.innerHTML = `
      <div class="balance-track">
        <div class="balance-sweet-spot"></div>
        <div class="balance-marker" id="cart-marker"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="cart-progress">Steady Count: 0 / 2</span>
        <button class="stealth-btn" id="steady-cart-btn" type="button">Steady Tray</button>
      </div>
    `;
    const marker = document.getElementById('cart-marker');
    const progressEl = document.getElementById('cart-progress');
    const steadyBtn = document.getElementById('steady-cart-btn');

    activeMiniGameTimer = setInterval(() => {
      pos += dir * 3.6;
      if (pos >= 92) { pos = 92; dir = -1; }
      if (pos <= 2) { pos = 2; dir = 1; }
      if (marker) marker.style.left = pos + '%';
    }, 35);

    steadyBtn.addEventListener('click', () => {
      if (pos >= 34 && pos <= 66) {
        steadied++;
        addNoise(10);
        if (progressEl) progressEl.textContent = `Steady Count: ${steadied} / 2`;
        if (steadied >= 2) completeObstacle(obs);
      } else {
        addNoise(42, '"Clink-clatter!! Silverware rattled in the corridor! Guards, check on her!"');
      }
    });
  } else if (obs.id === 'moon_vases') {
    taskTitle.textContent = '🏺 Moonlit Vases';
    taskInstructions.textContent = 'Slip past the vases carefully—click the quietest path twice.';
    let quietMoves = 0;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" id="vase-quiet-btn" type="button">🌙 Hug the Wall</button>
        <button class="stealth-btn" id="vase-rush-btn" type="button">⚡ Dash Past</button>
      </div>
      <div id="vase-status" style="margin-top:10px;font-size:12px;color:#ffd166;">Quiet Steps: 0 / 2</div>
    `;
    const quietBtn = document.getElementById('vase-quiet-btn');
    const rushBtn = document.getElementById('vase-rush-btn');
    const statusEl = document.getElementById('vase-status');

    quietBtn.addEventListener('click', () => {
      quietMoves++;
      addNoise(12);
      if (statusEl) statusEl.textContent = `Quiet Steps: ${quietMoves} / 2`;
      if (quietMoves >= 2) completeObstacle(obs);
    });

    rushBtn.addEventListener('click', () => {
      addNoise(52, '"Crash!! A vase nearly toppled by the moonlit arch! Guards, check right now!"');
    });
  }
}

// --- GUARD CHECK WHEN NOISE GETS TOO HIGH ---
function clearPatrolTimers() {
  patrolTimers.forEach((id) => clearTimeout(id));
  patrolTimers = [];
}

function startGuardCheck(customCallout = null) {
  if (patrolState !== 'idle' || escapedToLeftChambers) return;
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();

  caughtTriggeredThisCheck = false;
  patrolState = 'approaching';
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent = 'Guards coming to check on the noise — hide with [E]!';
  torchSweep.classList.add('active');
  showEmote('!', 1600);

  const stepGap = isKingSus ? 420 : 520;
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 2));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 3));

  const checkDelay = stepGap * 3 + 280;
  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'approaching') return;
    patrolState = 'checking';

    guardShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      guardShadowWrap.classList.add('visible');
    });

    patrolAlert.classList.add('danger');
    patrolText.textContent = 'Guards checking — hide with [E]!';
  }, checkDelay));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking') return;
    guardShadowWrap.classList.add('looking-in');
  }, checkDelay + 450));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
    guardShadowWrap.classList.add('deep-scan');
    if (!isHiding) {
      caughtTriggeredThisCheck = true;
      triggerCaughtEncounter();
      return;
    }
    patrolText.textContent = 'Hidden in shadows — stay still!';
  }, checkDelay + 1150));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
    patrolState = 'dialogue';
    pendingOutcome = 'normal';
    patrolAlert.classList.remove('danger');

    const pool = isKingSus ? guardSusLines : guardNormalLines;
    const line = customCallout || pool[patrolCount % pool.length];
    patrolCount++;

    royalDialogueCard.classList.remove('hidden', 'scolding');
    royalDialogueCard.classList.add('royal-gold');
    royalSpeaker.textContent = '⚔️ ROYAL GUARD';
    royalLine.textContent = line;
    dialogueChoices.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    cardFooter.textContent = '[Space / E / Click] Continue';
  }, checkDelay + 2600));
}

function triggerCaughtEncounter() {
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();
  caughtCount++;
  patrolState = 'scolding';
  pendingOutcome = null;
  showEmote('!', 1600);

  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 650);

  guardShadowWrap.classList.remove('hidden');
  guardShadowWrap.classList.add('visible', 'looking-in', 'deep-scan');
  patrolAlert.classList.remove('hidden');
  patrolAlert.classList.add('danger');
  patrolText.textContent = 'SPOTTED! Choose your response carefully!';

  royalDialogueCard.classList.remove('hidden', 'royal-gold');
  royalDialogueCard.classList.add('scolding');
  royalSpeaker.textContent = '⚔️ ROYAL GUARD';
  royalLine.innerHTML = `${caughtEncounter.scold}<div class="scold-hint">${caughtEncounter.hint}</div>`;
  cardFooter.classList.add('hidden');

  dialogueChoices.innerHTML = '';
  dialogueChoices.classList.remove('hidden');

  caughtEncounter.choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      resolveEncounterChoice(choice);
    });
    dialogueChoices.appendChild(btn);
  });
}

function resolveEncounterChoice(choice) {
  patrolState = 'scold_result';
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = choice.reply;
  cardFooter.classList.remove('hidden');

  if (choice.safe) {
    isKingSus = true;
    susBadge.classList.remove('hidden');
    pendingOutcome = 'sus_panic';
  } else {
    pendingOutcome = 'reset_hallway';
  }
}

function finishGuardCheck() {
  const outcome = pendingOutcome || 'normal';
  pendingOutcome = null;
  caughtTriggeredThisCheck = false;

  clearPatrolTimers();
  royalDialogueCard.classList.add('hidden');
  royalDialogueCard.classList.remove('scolding', 'royal-gold');
  dialogueChoices.classList.add('hidden');
  guardShadowWrap.classList.remove('visible', 'looking-in', 'deep-scan');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden', 'danger');
  setHidingState(false);

  if (outcome === 'reset_hallway') {
    setArea('hallway', Math.round(window.innerWidth * 0.78), 565);
    resetHallwayObstacles();
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: 'That was too close... I have to stay calm, watch the noise, and try the hallway again.',
        emote: '!'
      }
    ]);
  } else if (outcome === 'sus_panic') {
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: 'They bought it... barely. Keep quiet and head left toward the chambers.',
        emote: '...'
      }
    ]);
  }

  patrolTimers.push(setTimeout(() => {
    guardShadowWrap.classList.add('hidden');
    patrolState = 'idle';
  }, 600));
}

royalDialogueCard.addEventListener('click', () => {
  if (patrolState === 'dialogue' || patrolState === 'scold_result') {
    finishGuardCheck();
  }
});

// --- LEFT CHAMBERS SAFE COMPLETION ---
function reachLeftChambers() {
  if (escapedToLeftChambers) return;
  escapedToLeftChambers = true;
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();
  clearPanicState();
  showEmote('✦', 1800);

  escapeSummaryText.textContent =
    caughtCount === 0
      ? 'You slipped cleanly through the hallway without being caught and reached the chambers to the left!'
      : `You reached the chambers to the left safely (Caught: ${caughtCount} time${caughtCount === 1 ? '' : 's'}).`;
  escapeCompleteModal.classList.remove('hidden');
}

replayScene2Btn.addEventListener('click', () => {
  escapedToLeftChambers = false;
  noiseLevel = 0;
  noiseBarFill.style.width = '0%';
  resetHallwayObstacles();
  setArea('room', startX, startY);
  setHidingState(false);
  escapeCompleteModal.classList.add('hidden');
  queueMonologue([
    {
      text: 'Back in my room. Walk left into the hallway and reach the left chambers without making too much noise.',
      emote: '...'
    }
  ]);
});

// --- INPUT HANDLING ---
const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }

  if (k === 'm' && !escapedToLeftChambers) {
    toggleWingMap();
    return;
  }

  if (k === 'escape' && !wingMapModal.classList.contains('hidden')) {
    closeWingMap();
    return;
  }

  if (k === 'b' && isPanicking) {
    performSteadyBreath();
    return;
  }

  if (k === 'escape' && activeObstacle) {
    closeObstacleModal();
    return;
  }

  if (isMonologueActive && (k === ' ' || k === 'e' || k === 'enter')) {
    advanceMonologue();
    return;
  }

  if (patrolState === 'scolding' && ['1', '2', '3'].includes(k)) {
    const btns = dialogueChoices.querySelectorAll('.choice-btn');
    const idx = parseInt(k, 10) - 1;
    if (btns[idx]) btns[idx].click();
    return;
  }

  if ((patrolState === 'dialogue' || patrolState === 'scold_result') && (k === ' ' || k === 'e' || k === 'enter')) {
    finishGuardCheck();
    return;
  }

  if (k === 'e' && !activeObstacle && !isMonologueActive && !['dialogue', 'scolding', 'scold_result'].includes(patrolState)) {
    if (['approaching', 'checking'].includes(patrolState)) {
      setHidingState(!isHiding);
      return;
    }

    const nearObs = getNearbyObstacle();
    if (nearObs && patrolState === 'idle') {
      openObstacleModal(nearObs);
      return;
    }

    setHidingState(!isHiding);
    return;
  }

  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('resize', renderObstacleMarkers);

// --- MAIN LOOP ---
function gameLoop() {
  let pMoving = false;
  const activeSpeed = getCurrentMovementSpeed();
  const locked =
    escapedToLeftChambers ||
    isMonologueActive ||
    Boolean(activeObstacle) ||
    !wingMapModal.classList.contains('hidden') ||
    ['dialogue', 'scolding', 'scold_result'].includes(patrolState);

  if (!locked) {
    if (keys['w'] || keys['arrowup']) {
      pY -= activeSpeed;
      pMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      pY += activeSpeed;
      pMoving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
      pX -= activeSpeed;
      pMoving = true;
      princess.classList.add('facing-left');
      princess.classList.remove('facing-right');
    }
    if (keys['d'] || keys['arrowright']) {
      pX += activeSpeed;
      pMoving = true;
      princess.classList.remove('facing-left');
      princess.classList.add('facing-right');
    }

    if (pMoving && isHiding) {
      setHidingState(false);
    }
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  const nearObs = getNearbyObstacle();
  if (['approaching', 'checking'].includes(patrolState)) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = isHiding
      ? "Hidden in shadows — don't move!"
      : 'Guards coming! Hide with [E]!';
  } else if (nearObs && !activeObstacle && !isMonologueActive) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = `[E] ${nearObs.label}`;
  } else {
    actionPrompt.classList.add('hidden');
  }

  if (currentArea === 'room') {
    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = '<span class="arrow-icon">◀</span><span>Escape Hallway</span>';
      arrowLeft.classList.toggle('highlight', pX < 240);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = '<span>Balcony</span><span class="arrow-icon">▶</span>';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    // Walk left out of her room into EscapeHallway.jpg
    if (pX <= 45) {
      setArea('hallway', window.innerWidth - 150, Math.max(pY, 550));
      setHidingState(false);
      showEmote('!', 1500);
      queueMonologue([
        {
          text: "I just walked into the hallway from the right. Don't make too much noise or the guards will come check on me.",
          emote: '!'
        }
      ]);
    }

    if (pX >= window.innerWidth - 130) {
      setArea('balcony', Math.round(window.innerWidth * 0.22), Math.max(pY, 540));
      setHidingState(false);
      showEmote('...', 1500);
    }
  } else if (currentArea === 'hallway') {
    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = '<span class="arrow-icon">◀</span><span>Left Chambers</span>';
      arrowLeft.classList.toggle('highlight', pX < 240);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = "<span>Princess's Room</span><span class=\"arrow-icon\">▶</span>";
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    // Reached chambers to the left of the hallway -> Safe!
    if (pX <= 45) {
      reachLeftChambers();
    }

    if (pX >= window.innerWidth - 110) {
      setArea('room', 145, Math.max(pY, 550));
      setHidingState(false);
      showEmote('...', 1500);
    }
  } else if (currentArea === 'balcony') {
    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = '<span class="arrow-icon">◀</span><span>Princess\'s Room</span>';
      arrowLeft.classList.toggle('highlight', pX < 240);
    }
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= Math.round(window.innerWidth * 0.12)) {
      setArea('room', window.innerWidth - 170, pY);
      setHidingState(false);
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

// --- SCENE 2 OPENING (IN HER ROOM AT SCENE 1'S FINISHING SPOT) ---
setArea('room', startX, startY);
renderObstacleMarkers();
updateMapHighlight();
queueMonologue([
  {
    text: 'Scene 2 starts now... I have to walk out to the hallway myself and slip past the obstacles unseen.',
    emote: '✦'
  },
  {
    text: "Don't make too much noise or the guards will come check on me—press [M] anytime for the map and head left to the chambers.",
    emote: '!'
  }
]);

gameLoop();
