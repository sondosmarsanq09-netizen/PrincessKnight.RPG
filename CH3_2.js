function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
  }
}

function initSharedMusic() {
  if (window.GameAudio) {
    window.GameAudio.start('683268__migfus20__relaxing-chiptune-music.mp3', 0.14);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  removeOverlay();
  initSharedMusic();
});
setTimeout(removeOverlay, 50);
window.addEventListener('keydown', initSharedMusic, { passive: true });
window.addEventListener('pointerdown', initSharedMusic, { passive: true });

const princess = document.getElementById('princess');
const princessEmote = document.getElementById('princess-emote');
const worldLayer = document.getElementById('world-layer');
const ambientMotes = document.getElementById('ambient-motes');
const kingSightlineStrip = document.getElementById('king-sightline-strip');
const kingSightlineBeam = document.getElementById('king-sightline-beam');
const librarySpotsWrap = document.getElementById('library-spots');
const caughtFlash = document.getElementById('caught-flash');
const chapterFadeOut = document.getElementById('chapter-fade-out');
const locationBanner = document.getElementById('location-banner');
const noiseBarFill = document.getElementById('noise-bar-fill');
const susBadge = document.getElementById('sus-badge');
const panicStatus = document.getElementById('panic-status');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');
const actionPrompt = document.getElementById('action-prompt');
const panicPrompt = document.getElementById('panic-prompt');
const panicPromptText = document.getElementById('panic-prompt-text');
const panicBarFill = document.getElementById('panic-bar-fill');
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const torchSweep = document.getElementById('torch-sweep');
const guardShadowWrap = document.getElementById('guard-shadow-wrap');
const guardSilhouette = document.getElementById('guard-silhouette');

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

// Render a taller, closed-face armored knight silhouette with arms & sword
if (guardSilhouette) {
  guardSilhouette.innerHTML = `
    <svg class="knight-svg" viewBox="0 0 220 360" aria-hidden="true">
      <!-- Sweeping knight cape -->
      <path d="M62 104 L156 104 L186 346 L34 346 Z" fill="#07060d" opacity="0.94" />

      <!-- Greatsword on right flank -->
      <rect x="172" y="92" width="10" height="196" rx="2" fill="#090812" />
      <rect x="158" y="284" width="38" height="8" rx="2" fill="#090812" />
      <rect x="173" y="292" width="8" height="28" rx="2" fill="#090812" />

      <!-- Helmet plume -->
      <path d="M108 26 C126 6, 158 4, 170 24 C150 26, 132 32, 116 40 Z" fill="#07060d" />

      <!-- Closed knight helm (solid faceplate, no mouth gap) -->
      <path d="M78 36 C78 18, 140 18, 140 36 L146 78 L132 102 L86 102 L72 78 Z" fill="#07060d" />

      <!-- Narrow glowing visor slit -->
      <rect x="88" y="52" width="42" height="5" rx="2" fill="#ffb703" opacity="0.82" />

      <!-- Neck & heavy armored torso/greaves -->
      <rect x="96" y="96" width="26" height="14" fill="#07060d" />
      <path d="M64 110 L154 110 L142 208 L152 346 L114 346 L109 234 L104 346 L66 346 L76 208 Z" fill="#07060d" />

      <!-- Shoulder pauldrons -->
      <path d="M40 112 C56 96, 80 100, 84 126 L70 152 L38 140 Z" fill="#07060d" />
      <path d="M178 112 C162 96, 138 100, 134 126 L148 152 L180 140 Z" fill="#07060d" />

      <!-- Left arm & gauntlet (angled slightly forward) -->
      <path d="M44 138 L66 144 L48 228 L26 222 Z" fill="#07060d" />
      <path d="M26 222 L48 228 L38 256 L20 250 Z" fill="#07060d" />

      <!-- Right arm & gauntlet (down by sword hilt) -->
      <path d="M152 144 L174 138 L186 226 L164 230 Z" fill="#07060d" />
      <path d="M164 230 L186 226 L184 256 L164 256 Z" fill="#07060d" />
    </svg>
  `;
}

// Add numeric % readout next to the noise bar
const noiseMeterWrap = document.getElementById('noise-meter-wrap');
const noiseValueLabel = document.createElement('span');
noiseValueLabel.id = 'noise-value-label';
noiseValueLabel.textContent = '0%';
if (noiseMeterWrap) noiseMeterWrap.appendChild(noiseValueLabel);

// Spawn drifting moonlit dust motes
function spawnAmbientMotes() {
  if (!ambientMotes) return;
  ambientMotes.innerHTML = '';
  for (let i = 0; i < 22; i++) {
    const mote = document.createElement('div');
    mote.className = 'moon-mote';
    const size = 2 + Math.random() * 4;
    mote.style.width = `${size}px`;
    mote.style.height = `${size}px`;
    mote.style.left = `${Math.random() * 100}%`;
    mote.style.top = `${15 + Math.random() * 75}%`;
    mote.style.animationDuration = `${6 + Math.random() * 7}s`;
    mote.style.animationDelay = `${-Math.random() * 8}s`;
    ambientMotes.appendChild(mote);
  }
}
spawnAmbientMotes();

// Floating noise ripple text over the Princess
let lastNoisePopAt = 0;
function spawnNoisePop(text, loud = false) {
  if (!worldLayer || !princess) return;
  const now = performance.now();
  if (!loud && now - lastNoisePopAt < 520) return;
  lastNoisePopAt = now;

  const pop = document.createElement('div');
  pop.className = 'noise-pop' + (loud ? ' loud' : '');
  pop.textContent = text;
  pop.style.left = `${pX + 48}px`;
  pop.style.top = `${pY - 125}px`;
  worldLayer.appendChild(pop);
  setTimeout(() => pop.remove(), 980);
}

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
let currentArea = 'room'; // 'room' | 'hallway' | 'balcony' | 'chambers' | 'library'
let isHiding = false;
let noiseLevel = 0;
let libraryExitTriggered = false;
let libraryReadyToExit = false;
let libraryIntroShown = false;
let triggeredObstacleIdsThisPass = new Set();

// King's floor sightline sweep state inside Chambers
let sightlinePosPct = 10;
let sightlineDir = 1;
let lastSightlineHitAt = 0;

let caughtCount = Number.isFinite(carryover.caughtCount) ? carryover.caughtCount : 0;
let isKingSus = Boolean(carryover.isKingSus);
let isPanicking = false;
let breathsNeeded = 0;
const PANIC_PASSOUT_LIMIT = 8.5;
let panicTimeLeft = PANIC_PASSOUT_LIMIT;
let panicCountdownInterval = null;

let monologueQueue = [];
let isMonologueActive = false;
let patrolState = 'idle';
let patrolTimers = [];
let patrolCount = 0;
let pendingOutcome = null;
let activeObstacle = null;
let caughtTriggeredThisCheck = false;
let activeMiniGameTimer = null;

// Simple, no-challenge Library interactions (distraction + finding something)
const librarySpots = [
  {
    id: 'tip_candles',
    label: '🕯️ Knock Candle Stand (Distraction)',
    xPct: 0.52,
    y: 555,
    done: false,
    kind: 'distraction',
    noiseAdded: 24,
    line: "Tipped that candle stand over on the far side of the shelves... if anyone's listening, it'll pull their attention away from the left exit.",
    emote: '✦'
  },
  {
    id: 'find_pass',
    label: '📜 Grab Night Pass & Key',
    xPct: 0.30,
    y: 560,
    done: false,
    kind: 'find',
    noiseAdded: 6,
    line: "Aha—a brass side-gate key and a scribbled night-watch note tucked between two thick tomes. Score.",
    emote: '✦'
  }
];

const obstacles = [
  {
    id: 'creaky_boards',
    area: 'hallway',
    name: 'loose floorboards',
    xPct: 0.72,
    y: 555,
    cleared: false
  },
  {
    id: 'tea_cart',
    area: 'hallway',
    name: 'silver tea tray',
    xPct: 0.48,
    y: 565,
    cleared: false
  },
  {
    id: 'moon_vases',
    area: 'hallway',
    name: 'tall porcelain vases',
    xPct: 0.25,
    y: 550,
    cleared: false
  },
  {
    id: 'hearth_embers',
    area: 'chambers',
    name: 'popping hearth embers',
    xPct: 0.72,
    y: 560,
    cleared: false
  },
  {
    id: 'chamber_cipher',
    area: 'chambers',
    name: 'iron latch lock',
    xPct: 0.48,
    y: 555,
    cleared: false
  },
  {
    id: 'watch_railing',
    area: 'chambers',
    name: 'creaking timber planks',
    xPct: 0.26,
    y: 565,
    cleared: false
  }
];

const guardNormalLines = [
  '"All is peaceful outside Her Highness\'s wing. Keep your steps light and watch the west gallery."',
  '"His Majesty expects the royal corridor quiet until morning. Stay sharp."',
  '"Nothing amiss near the Princess\'s chambers—continue the night watch."'
];

const guardSusLines = [
  '"His Majesty ordered extra watch outside Her Highness\'s wing tonight. Keep eyes on every doorway."',
  '"Stay close to the royal wing—the King wants Her Highness kept safely inside tonight."',
  '"Hold your lantern steady and watch both ends of the corridor."'
];

const kingOverwatchLines = [
  '"My eyes are on the chamber floor tonight. A single reckless step will give you away."',
  '"The watch stands close and the floorboards carry far. Keep to the shadows."'
];

const caughtEncounter = {
  scold: '"Your Highness?! Forgive me—what brings you out here at this hour? His Majesty ordered a strict watch tonight."',
  hint: 'Keep your tone calm and royal so they have no reason to press further.',
  choices: [
    {
      text: '1. "I could not sleep—I only stepped out for a breath of night air."',
      safe: true,
      reply: '"Of course, Your Highness. Pray head back before His Majesty wakes and worries."'
    },
    {
      text: '2. "A draft stirred the wing—I came to see what rattled out here."',
      safe: true,
      reply: '"Leave the wing to us, Princess. We will check it at once—please be careful."'
    },
    {
      text: '3. "Do not mind me—I am slipping past the royal wing tonight."',
      safe: false,
      reply: '"Forgive me, Your Highness, I am bound by orders! Guards—secure the wing at once!"'
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

// --- WEB AUDIO SOUND EFFECTS ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSoftStepSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const baseFreq = currentArea === 'hallway' ? 135 : currentArea === 'library' ? 120 : 105;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    gain.gain.setValueAtTime(currentArea === 'hallway' || currentArea === 'library' ? 0.065 : 0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {}
}

function playKnightFootstepSound() {
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

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(620, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(340, now + 0.14);
    gain2.gain.setValueAtTime(0.05, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.15);
  } catch (e) {}
}

function playWoodCreakSound(loud = false) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(loud ? 160 : 210, now);
    osc.frequency.linearRampToValueAtTime(loud ? 95 : 175, now + 0.22);
    gain.gain.setValueAtTime(loud ? 0.14 : 0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playSilverClinkSound(loud = false) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [loud ? 1180 : 1420, loud ? 890 : 1780].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(loud ? 0.11 : 0.05, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.23);
    });
  } catch (e) {}
}

function playPorcelainChimeSound(loud = false) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(loud ? 520 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(loud ? 180 : 660, now + 0.28);
    gain.gain.setValueAtTime(loud ? 0.14 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  } catch (e) {}
}

function playSuccessChime() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.08, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.33);
    });
  } catch (e) {}
}

function playBreathSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
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
  playKnightFootstepSound();
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
    room: 'My Chambers (West door leads to the corridor; balcony is east)',
    hallway: 'West Corridor (Watch your step in the dark toward the side chambers)',
    balcony: 'Balcony (Exposed to the open night—no cover out here)',
    chambers: 'Side Chambers (King\'s watch strip, hazards & puzzles toward the library)',
    library: 'Library (Make a distraction & grab what you need, then head left to exit)'
  };
  if (mapCurrentStatus) {
    mapCurrentStatus.innerHTML =
      `<div>• Where I am: ${areaNames[currentArea] || currentArea} • Noise: ${Math.round(noiseLevel)}%</div>` +
      `<div>• Walking makes noise—if it hits 100%, a guard comes to check. Press [E] to interact or hide.</div>`;
  }
}

function openWingMap() {
  if (libraryExitTriggered) return;
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
      text: "Ugh... my chest felt tight for a second. Breathe slow, keep quiet, and try again.",
      emote: '...'
    }
  ]);
}

function performSteadyBreath() {
  if (!isPanicking) return;
  playBreathSound();
  breathsNeeded--;
  panicTimeLeft = Math.min(PANIC_PASSOUT_LIMIT, panicTimeLeft + 1.1);

  if (breathsNeeded <= 0) {
    clearPanicState();
    showEmote('✦', 1600);
    queueMonologue([
      {
        text: "In and out... alright. My hands are steady enough now.",
        emote: '...'
      }
    ]);
  } else {
    panicPromptText.textContent = `💔 DANGER: Still panicking! Press [B] to calm her down (${breathsNeeded} left)`;
  }
}

// --- NOISE METER ---
function syncNoiseUI() {
  const clamped = Math.max(0, Math.min(100, noiseLevel));
  noiseBarFill.style.width = clamped + '%';
  noiseValueLabel.textContent = Math.round(clamped) + '%';
}

function addNoise(amount, reasonText, rippleText = null) {
  if (libraryExitTriggered) return;
  const mult = (isKingSus ? 1.35 : 1.0) * (1 + caughtCount * 0.15);
  noiseLevel = Math.min(100, noiseLevel + amount * mult);
  syncNoiseUI();

  if (rippleText) {
    spawnNoisePop(rippleText, amount >= 20);
  }
  if (amount >= 10) showEmote('!', 1200);

  if (noiseLevel >= 100 && patrolState === 'idle') {
    noiseLevel = 65;
    syncNoiseUI();
    closeObstacleModal();
    startGuardCheck(
      reasonText ||
        (currentArea === 'library'
          ? '"Footsteps echoed inside the library! Guard, go check who is in there!"'
          : '"A sound carried through the wing—check if Her Highness is there!"')
    );
  }
}

setInterval(() => {
  if (libraryExitTriggered || patrolState !== 'idle') return;
  if (noiseLevel > 0) {
    noiseLevel = Math.max(0, noiseLevel - 1.4);
    syncNoiseUI();
  }
}, 250);

function resetObstaclesInArea(targetArea) {
  obstacles.forEach((o) => {
    if (o.area === targetArea) o.cleared = false;
  });
  triggeredObstacleIdsThisPass.clear();
}

function resetLibrarySpots() {
  librarySpots.forEach((s) => {
    s.done = false;
  });
  libraryReadyToExit = false;
  renderLibrarySpots();
}

function getLibrarySpotX(spot) {
  return Math.max(150, Math.min(window.innerWidth - 180, Math.round(window.innerWidth * spot.xPct)));
}

function renderLibrarySpots() {
  if (!librarySpotsWrap) return;
  const inLib = currentArea === 'library';
  librarySpotsWrap.classList.toggle('hidden', !inLib);
  if (!inLib) return;

  librarySpotsWrap.innerHTML = '';
  librarySpots.forEach((spot) => {
    const el = document.createElement('div');
    el.className = 'library-spot-badge' + (spot.done ? ' done' : '');
    const sx = getLibrarySpotX(spot);
    const sy = Math.max(180, Math.min(window.innerHeight - 160, spot.y - 75));
    el.style.left = sx + 'px';
    el.style.top = sy + 'px';
    el.textContent = spot.done ? `✔ ${spot.label}` : spot.label;
    librarySpotsWrap.appendChild(el);
  });
}

function getNearbyLibrarySpot() {
  if (currentArea !== 'library' || libraryExitTriggered) return null;
  return librarySpots.find((spot) => {
    if (spot.done) return false;
    const sx = getLibrarySpotX(spot);
    return Math.abs(pX - sx) < 130 && Math.abs(pY - spot.y) < 120;
  });
}

function checkLibraryMainCharacterMonologue() {
  if (libraryReadyToExit) return;
  const allSpotsDone = librarySpots.every((s) => s.done);
  if (!allSpotsDone) return;

  libraryReadyToExit = true;
  queueMonologue([
    {
      text: "Okay, distraction set, key and note secured... look at me actually pulling this off. If someone told me a week ago I'd be sneaking through the castle library at midnight with a whole plan, I would've laughed.",
      emote: '✦'
    },
    {
      text: "The passage is clear at last—only my footsteps, the early morning light, and the door to the left. Pray my skirts do not catch on the stones.",
      emote: '...'
    },
    {
      text: "Daybreak is already upon the grounds, and at long last I am going to meet him properly—no stolen glances in the corridors, simply the two of us.",
      emote: '✦'
    }
  ]);
}

function interactWithLibrarySpot(spot) {
  if (!spot || spot.done || isMonologueActive || patrolState !== 'idle') return;
  spot.done = true;
  if (spot.kind === 'distraction') {
    playPorcelainChimeSound(false);
    addNoise(spot.noiseAdded, null, 'clatter...');
  } else {
    playSilverClinkSound(false);
    addNoise(spot.noiseAdded, null, 'rustle...');
  }
  showEmote(spot.emote || '✦', 1500);
  renderLibrarySpots();

  queueMonologue(
    [
      {
        text: spot.line,
        emote: spot.emote || '✦'
      }
    ],
    checkLibraryMainCharacterMonologue
  );
}

function syncChambersVisuals() {
  const inChambers = currentArea === 'chambers';
  if (kingSightlineStrip) {
    kingSightlineStrip.classList.toggle('hidden', !inChambers);
  }
  if (guardShadowWrap) {
    guardShadowWrap.classList.toggle('king-overwatch', inChambers);
  }
}

function updateKingSightlineSweep(locked) {
  if (currentArea !== 'chambers' || !kingSightlineBeam) return;
  if (!locked) {
    sightlinePosPct += sightlineDir * 0.72;
    if (sightlinePosPct >= 76) {
      sightlinePosPct = 76;
      sightlineDir = -1;
    } else if (sightlinePosPct <= 0) {
      sightlinePosPct = 0;
      sightlineDir = 1;
    }
  }
  kingSightlineBeam.style.left = sightlinePosPct + '%';

  // Check if Princess is crossing the active watching beam while not hidden
  const stripLeft = window.innerWidth * 0.14;
  const stripWidth = window.innerWidth * 0.72;
  const beamStart = stripLeft + (sightlinePosPct / 100) * stripWidth;
  const beamEnd = beamStart + stripWidth * 0.24;
  const princessCenterX = pX + 48;

  if (
    !locked &&
    !isHiding &&
    patrolState === 'idle' &&
    princessCenterX >= beamStart &&
    princessCenterX <= beamEnd
  ) {
    const now = performance.now();
    if (now - lastSightlineHitAt > 950) {
      lastSightlineHitAt = now;
      playWoodCreakSound(true);
      addNoise(
        26,
        '"The King\'s gaze caught movement across the chamber floor! Knights, inspect the chambers!"',
        'WATCHED!'
      );
    }
  }
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
    locationBanner.textContent = '📍 West Corridor';
  } else if (currentArea === 'balcony') {
    worldLayer.style.backgroundImage = "url('NightimeBalcony.png')";
    locationBanner.textContent = '📍 Balcony';
  } else if (currentArea === 'chambers') {
    worldLayer.style.backgroundImage = "url('Chambers.png')";
    locationBanner.textContent = '📍 Side Chambers (King\'s Watch)';
  } else if (currentArea === 'library') {
    worldLayer.style.backgroundImage = "url('Library.png')";
    locationBanner.textContent = '📍 Castle Library';
  }

  triggeredObstacleIdsThisPass.clear();
  syncChambersVisuals();
  renderLibrarySpots();
  updateMapHighlight();
}

function getObstacleScreenX(obs) {
  return Math.max(130, Math.min(window.innerWidth - 160, Math.round(window.innerWidth * obs.xPct)));
}

function getNearbyObstacle() {
  if (libraryExitTriggered || currentArea === 'library') return null;
  return obstacles.find((obs) => {
    if (obs.area !== currentArea || obs.cleared) return false;
    const ox = getObstacleScreenX(obs);
    return Math.abs(pX - ox) < 115 && Math.abs(pY - obs.y) < 95;
  });
}

function setHidingState(nextHidden) {
  isHiding = Boolean(nextHidden);
  princess.classList.toggle('hidden-in-shadows', isHiding);
}

// --- OBSTACLE & CHAMBER PUZZLE CHALLENGES ---
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

closeTaskBtn.addEventListener('click', () => {
  if (activeObstacle && !activeObstacle.cleared) {
    const skipped = activeObstacle;
    closeObstacleModal();
    playWoodCreakSound(true);
    addNoise(36, '"A sharp sound echoed through the wing! Guards, check right there!"', 'CLATTER!');
    if (patrolState === 'idle') {
      queueMonologue([
        {
          text: `Messy... I rushed past the ${skipped.name} and made way too much noise.`,
          emote: '!'
        }
      ]);
    }
    return;
  }
  closeObstacleModal();
});

function completeObstacle(obs) {
  clearMiniGameTimer();
  obs.cleared = true;
  closeObstacleModal();
  playSuccessChime();
  showEmote('✦', 1500);
  queueMonologue([
    {
      text: `Past the ${obs.name}... not a sound.`,
      emote: '...'
    }
  ]);
}

function openObstacleModal(obs) {
  if (patrolState !== 'idle' || isMonologueActive || libraryExitTriggered) return;
  clearMiniGameTimer();
  activeObstacle = obs;
  taskModal.classList.remove('hidden');
  taskBody.innerHTML = '';

  if (obs.id === 'creaky_boards') {
    taskTitle.textContent = 'Underfoot: Loose Floorboards';
    taskInstructions.textContent = 'Set your weight down in order (1 → 2 → 3) so the planks do not groan.';
    let step = 1;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" data-n="2">2. Middle Stone</button>
        <button class="stealth-btn" data-n="1">1. Near Corner</button>
        <button class="stealth-btn" data-n="3">3. Far Flagstone</button>
      </div>
    `;
    taskBody.querySelectorAll('.stealth-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.n, 10);
        if (n === step) {
          btn.classList.add('done');
          playWoodCreakSound(false);
          step++;
          addNoise(14, null, 'soft step...');
          if (step > 3) completeObstacle(obs);
        } else {
          playWoodCreakSound(true);
          addNoise(46, '"CREAK!! Heavy timber groaned in the west corridor! Knights, check there!"', 'CREAK!!');
        }
      });
    });
  } else if (obs.id === 'tea_cart') {
    taskTitle.textContent = 'In the Way: Silver Tea Tray';
    taskInstructions.textContent = 'Steady the silver tray while the marker is inside the green zone!';
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
      pos += dir * 4.2;
      if (pos >= 92) { pos = 92; dir = -1; }
      if (pos <= 2) { pos = 2; dir = 1; }
      if (marker) marker.style.left = pos + '%';
    }, 35);

    steadyBtn.addEventListener('click', () => {
      if (pos >= 34 && pos <= 66) {
        steadied++;
        playSilverClinkSound(false);
        addNoise(12, null, 'tink...');
        if (progressEl) progressEl.textContent = `Steady Count: ${steadied} / 2`;
        if (steadied >= 2) completeObstacle(obs);
      } else {
        playSilverClinkSound(true);
        addNoise(44, '"Clink-clatter!! Silverware rattled near the corridor! Knights, go look!"', 'CLATTER!!');
      }
    });
  } else if (obs.id === 'moon_vases') {
    taskTitle.textContent = 'In the Shadows: Tall Porcelain Vases';
    taskInstructions.textContent = 'Tiptoe past the vases without brushing them—twice.';
    let quietMoves = 0;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" id="vase-quiet-btn" type="button">🌙 Tiptoe Carefully</button>
        <button class="stealth-btn" id="vase-rush-btn" type="button">⚡ Slip Past Quickly</button>
      </div>
      <div id="vase-status" style="margin-top:10px;font-size:12px;color:#ffd166;">Quiet Steps: 0 / 2</div>
    `;
    const quietBtn = document.getElementById('vase-quiet-btn');
    const rushBtn = document.getElementById('vase-rush-btn');
    const statusEl = document.getElementById('vase-status');

    quietBtn.addEventListener('click', () => {
      quietMoves++;
      playPorcelainChimeSound(false);
      addNoise(14, null, 'hush...');
      if (statusEl) statusEl.textContent = `Quiet Steps: ${quietMoves} / 2`;
      if (quietMoves >= 2) completeObstacle(obs);
    });

    rushBtn.addEventListener('click', () => {
      playPorcelainChimeSound(true);
      addNoise(50, '"Crash!! Porcelain nearly toppled by the arch! Knights, check right now!"', 'CLANG!!');
    });
  } else if (obs.id === 'hearth_embers') {
    taskTitle.textContent = 'By the Hearth: Popping Embers';
    taskInstructions.textContent = 'Steady your footing twice when the marker is inside the green zone so sparks don\'t pop!';
    let steadied = 0;
    let pos = 15;
    let dir = 1;
    taskBody.innerHTML = `
      <div class="balance-track">
        <div class="balance-sweet-spot"></div>
        <div class="balance-marker" id="hearth-marker"></div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span id="hearth-progress">Steady Steps: 0 / 2</span>
        <button class="stealth-btn" id="hearth-steady-btn" type="button">Hold Still</button>
      </div>
    `;
    const marker = document.getElementById('hearth-marker');
    const progressEl = document.getElementById('hearth-progress');
    const steadyBtn = document.getElementById('hearth-steady-btn');

    activeMiniGameTimer = setInterval(() => {
      pos += dir * 5.2;
      if (pos >= 92) { pos = 92; dir = -1; }
      if (pos <= 2) { pos = 2; dir = 1; }
      if (marker) marker.style.left = pos + '%';
    }, 32);

    steadyBtn.addEventListener('click', () => {
      if (pos >= 34 && pos <= 66) {
        steadied++;
        playPorcelainChimeSound(false);
        addNoise(14, null, 'hush...');
        if (progressEl) progressEl.textContent = `Steady Steps: ${steadied} / 2`;
        if (steadied >= 2) completeObstacle(obs);
      } else {
        playWoodCreakSound(true);
        addNoise(48, '"POP-CRACK!! Embers flared by the hearth! Knights, check the chambers!"', 'POP!!');
      }
    });
  } else if (obs.id === 'chamber_cipher') {
    taskTitle.textContent = 'Chamber Puzzle: Iron Latch Sigils';
    taskInstructions.textContent = 'Press the sigils in order (1 → 2 → 3) to unlatch the inner passage quietly.';
    let step = 1;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" data-n="3">3. ♛ Crown</button>
        <button class="stealth-btn" data-n="1">1. ✦ Star</button>
        <button class="stealth-btn" data-n="2">2. 🌙 Moon</button>
      </div>
    `;
    taskBody.querySelectorAll('.stealth-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.n, 10);
        if (n === step) {
          btn.classList.add('done');
          playSilverClinkSound(false);
          step++;
          addNoise(12, null, 'click...');
          if (step > 3) completeObstacle(obs);
        } else {
          playSilverClinkSound(true);
          addNoise(48, '"Iron latch rattled in the chambers! Knights, investigate right now!"', 'RATTLE!!');
        }
      });
    });
  } else if (obs.id === 'watch_railing') {
    taskTitle.textContent = 'Below the Balcony: Creaking Timber Planks';
    taskInstructions.textContent = 'Tiptoe carefully twice before the King\'s watch notices the floor.';
    let quietMoves = 0;
    taskBody.innerHTML = `
      <div class="stealth-step-row">
        <button class="stealth-btn" id="plank-quiet-btn" type="button">✦ Tiptoe Lightly</button>
        <button class="stealth-btn" id="plank-rush-btn" type="button">⚡ Step Heavy</button>
      </div>
      <div id="plank-status" style="margin-top:10px;font-size:12px;color:#ffd166;">Quiet Steps: 0 / 2</div>
    `;
    const quietBtn = document.getElementById('plank-quiet-btn');
    const rushBtn = document.getElementById('plank-rush-btn');
    const statusEl = document.getElementById('plank-status');

    quietBtn.addEventListener('click', () => {
      quietMoves++;
      playWoodCreakSound(false);
      addNoise(14, null, 'soft...');
      if (statusEl) statusEl.textContent = `Quiet Steps: ${quietMoves} / 2`;
      if (quietMoves >= 2) completeObstacle(obs);
    });

    rushBtn.addEventListener('click', () => {
      playWoodCreakSound(true);
      addNoise(52, '"Loud thud on the chamber planks! Knights, check the side chambers!"', 'THUD!!');
    });
  }
}

// --- KNIGHT / KING CHECK WHEN NOISE SPIKES ---
function clearPatrolTimers() {
  patrolTimers.forEach((id) => clearTimeout(id));
  patrolTimers = [];
}

function startGuardCheck(customCallout = null) {
  if (patrolState !== 'idle' || libraryExitTriggered) return;
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();

  caughtTriggeredThisCheck = false;
  patrolState = 'approaching';
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent =
    currentArea === 'chambers'
      ? 'King & guards watching closely — hide in the shadows [E]!'
      : 'Armored footsteps approaching — hide in the shadows [E]!';
  torchSweep.classList.add('active');
  showEmote('!', 1600);

  const stepGap = isKingSus || currentArea === 'chambers' ? 370 : 480;
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 2));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 3));

  const checkDelay = stepGap * 3 + 250;
  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'approaching') return;
    patrolState = 'checking';

    guardShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      guardShadowWrap.classList.add('visible');
    });

    patrolAlert.classList.add('danger');
    patrolText.textContent = 'Watch sweeping closer — stay hidden [E]!';
  }, checkDelay));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking') return;
    guardShadowWrap.classList.add('looking-in');
  }, checkDelay + 420));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
    guardShadowWrap.classList.add('deep-scan');
    if (!isHiding || noiseLevel >= 78) {
      caughtTriggeredThisCheck = true;
      triggerCaughtEncounter(
        !isHiding
          ? caughtEncounter.scold
          : '"Your Highness? I heard silk rustling in the dark—pray let me see who is there."'
      );
      return;
    }
    patrolText.textContent = 'Holding my breath in the dark...';
  }, checkDelay + 1050));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
    patrolState = 'dialogue';
    pendingOutcome = 'normal';
    patrolAlert.classList.remove('danger');

    const pool =
      currentArea === 'chambers'
        ? kingOverwatchLines
        : isKingSus
          ? guardSusLines
          : guardNormalLines;
    const line = customCallout || pool[patrolCount % pool.length];
    patrolCount++;

    royalDialogueCard.classList.remove('hidden', 'scolding');
    royalDialogueCard.classList.add('royal-gold');
    royalSpeaker.textContent = currentArea === 'chambers' ? '👑 KING & WATCH' : '⚔️ ROYAL KNIGHT';
    royalLine.textContent = line;
    dialogueChoices.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    cardFooter.textContent = '[Space / E / Click] Continue';
  }, checkDelay + 2400));
}

function triggerCaughtEncounter(scoldMessage = caughtEncounter.scold) {
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();
  caughtCount++;
  noiseLevel = Math.min(100, noiseLevel + 30);
  syncNoiseUI();
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
  patrolText.textContent = 'SPOTTED! Answer with royal poise!';

  royalDialogueCard.classList.remove('hidden', 'royal-gold');
  royalDialogueCard.classList.add('scolding');
  royalSpeaker.textContent = currentArea === 'chambers' ? '👑 KING & WATCH' : '⚔️ ROYAL KNIGHT';
  royalLine.innerHTML = `${scoldMessage}<div class="scold-hint">${caughtEncounter.hint}</div>`;
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
    pendingOutcome = 'reset_area';
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

  if (outcome === 'reset_area') {
    noiseLevel = 55;
    syncNoiseUI();
    if (currentArea === 'library') {
      setArea('library', Math.round(window.innerWidth * 0.72), 560);
    } else if (currentArea === 'chambers') {
      setArea('chambers', Math.round(window.innerWidth * 0.8), 560);
      resetObstaclesInArea('chambers');
    } else {
      setArea('hallway', Math.round(window.innerWidth * 0.78), 565);
      resetObstaclesInArea('hallway');
    }
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: "That was far too close. I cannot afford another slip like that.",
        emote: '!'
      }
    ]);
  } else if (outcome === 'sus_panic') {
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: "They took my word... barely. My heart is still racing, and the watch is on edge.",
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

// --- ENTER LIBRARY THROUGH RIGHT-SIDE ARCHWAY & EXIT LEFT TO BLACK FADE-OUT ---
function enterLibraryFromChambers() {
  setArea('library', Math.round(window.innerWidth * 0.73), 560);
  setHidingState(false);
  princess.classList.add('facing-left');
  princess.classList.remove('facing-right');
  playSoftStepSound();
  showEmote('✦', 1600);

  if (!libraryIntroShown) {
    libraryIntroShown = true;
    queueMonologue([
      {
        text: "Made it into the library through the right arch... okay, breathe. No crazy obstacle courses here—just keep an eye on my walking noise so I don't bring a guard running.",
        emote: '✦'
      },
      {
        text: "Let me set a quick distraction and grab something useful before I head out the left side.",
        emote: '...'
      }
    ]);
  }
}

function exitLibraryLeftToNextChapter() {
  if (libraryExitTriggered) return;
  libraryExitTriggered = true;
  clearPatrolTimers();
  closeObstacleModal();
  closeWingMap();
  clearPanicState();
  playSuccessChime();
  if (window.GameAudio) window.GameAudio.prepareSceneTransition();
  showEmote('✦', 1600);

  try {
    sessionStorage.setItem(
      'ch4_carryover',
      JSON.stringify({
        caughtCount: typeof caughtCount === 'number' ? caughtCount : 0,
        isKingSus: Boolean(isKingSus)
      })
    );
  } catch (e) {}

  if (chapterFadeOut) {
    chapterFadeOut.classList.add('fading');
  }

  setTimeout(() => {
    window.location.href = 'CH4.html';
  }, 1150);
}

replayScene2Btn.addEventListener('click', () => {
  libraryExitTriggered = false;
  libraryIntroShown = false;
  if (chapterFadeOut) {
    chapterFadeOut.classList.remove('fading');
  }
  noiseLevel = 0;
  syncNoiseUI();
  resetObstaclesInArea('hallway');
  resetObstaclesInArea('chambers');
  resetLibrarySpots();
  setArea('room', startX, startY);
  setHidingState(false);
  escapeCompleteModal.classList.add('hidden');
  queueMonologue([
    {
      text: 'Back in my room. Every stone out there gives you away if you rush.',
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

  if (k === 'm' && !libraryExitTriggered) {
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

    const nearLibSpot = getNearbyLibrarySpot();
    if (nearLibSpot && patrolState === 'idle') {
      interactWithLibrarySpot(nearLibSpot);
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

window.addEventListener('resize', renderLibrarySpots);

// --- MAIN LOOP ---
let lastStepSoundAt = 0;

function gameLoop() {
  let pMoving = false;
  const activeSpeed = getCurrentMovementSpeed();
  const locked =
    libraryExitTriggered ||
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
      addNoise(8, null, 'rustle...');
    }

    if (pMoving) {
      const moveNoise =
        currentArea === 'chambers'
          ? 0.52
          : currentArea === 'hallway'
            ? 0.42
            : currentArea === 'library'
              ? 0.48
              : 0.16;
      addNoise(
        moveNoise,
        null,
        currentArea === 'hallway' || currentArea === 'chambers' || currentArea === 'library'
          ? 'tap...'
          : null
      );

      const now = performance.now();
      if (now - lastStepSoundAt > 260) {
        lastStepSoundAt = now;
        playSoftStepSound();
      }
    }
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  updateKingSightlineSweep(locked);

  const nearObs = getNearbyObstacle();
  if (
    nearObs &&
    !locked &&
    patrolState === 'idle' &&
    !triggeredObstacleIdsThisPass.has(nearObs.id)
  ) {
    triggeredObstacleIdsThisPass.add(nearObs.id);
    addNoise(18, null, '?!');
    openObstacleModal(nearObs);
  }

  const nearLibSpot = getNearbyLibrarySpot();

  if (['approaching', 'checking'].includes(patrolState)) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = isHiding
      ? "Hidden in the shadows — don't move!"
      : 'Watch & footsteps nearby! Hide with [E]!';
  } else if (nearLibSpot && !isMonologueActive) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = `[E] ${nearLibSpot.label}`;
  } else if (nearObs && !activeObstacle && !isMonologueActive) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = `Something is right here... [E]`;
  } else {
    actionPrompt.classList.add('hidden');
  }

  if (currentArea === 'room') {
    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = '<span class="arrow-icon">◀</span><span>West Corridor</span>';
      arrowLeft.classList.toggle('highlight', pX < 240);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = '<span>Balcony</span><span class="arrow-icon">▶</span>';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    if (pX <= 45) {
      setArea('hallway', window.innerWidth - 150, Math.max(pY, 550));
      setHidingState(false);
      playSoftStepSound();
      addNoise(10);
      showEmote('!', 1500);
      queueMonologue([
        {
          text: "Quiet out here... for now. One wrong step and the whole wing will hear it.",
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
    const remainingObstacles = obstacles.filter((o) => o.area === 'hallway' && !o.cleared);
    const allCleared = remainingObstacles.length === 0;

    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = allCleared
        ? '<span class="arrow-icon">◀</span><span>Side Chambers</span>'
        : `<span class="arrow-icon">◀</span><span>Side Chambers (${remainingObstacles.length} left)</span>`;
      arrowLeft.classList.toggle('highlight', pX < 240 && allCleared);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = '<span>My Chambers</span><span class="arrow-icon">▶</span>';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    if (pX <= 55) {
      if (allCleared) {
        setArea('chambers', window.innerWidth - 165, Math.max(pY, 555));
        setHidingState(false);
        playSoftStepSound();
        addNoise(12);
        showEmote('!', 1600);
        queueMonologue([
          {
            text: "The side chambers... Father's watch line is sweeping the floor and guards are right here. Move carefully toward the library on the left.",
            emote: '!'
          }
        ]);
      } else {
        pX = 65;
        addNoise(8, null, 'blocked...');
        showEmote('!', 1400);
        if (!isMonologueActive && patrolState === 'idle') {
          queueMonologue([
            {
              text: "I can't slip into the side chambers yet—there are still things in the corridor I haven't gotten past cleanly.",
              emote: '!'
            }
          ]);
        }
      }
    }

    if (pX >= window.innerWidth - 110) {
      setArea('room', 145, Math.max(pY, 550));
      setHidingState(false);
      showEmote('...', 1500);
    }
  } else if (currentArea === 'chambers') {
    const remainingChamberObs = obstacles.filter((o) => o.area === 'chambers' && !o.cleared);
    const allChamberCleared = remainingChamberObs.length === 0;

    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = allChamberCleared
        ? '<span class="arrow-icon">◀</span><span>Library</span>'
        : `<span class="arrow-icon">◀</span><span>Library (${remainingChamberObs.length} left)</span>`;
      arrowLeft.classList.toggle('highlight', pX < 240 && allChamberCleared);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = '<span>West Corridor</span><span class="arrow-icon">▶</span>';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    if (pX <= 55) {
      if (allChamberCleared) {
        enterLibraryFromChambers();
      } else {
        pX = 65;
        addNoise(8, null, 'blocked...');
        showEmote('!', 1400);
        if (!isMonologueActive && patrolState === 'idle') {
          queueMonologue([
            {
              text: "I can't reach the library yet—there are still chamber hazards and locks in my way.",
              emote: '!'
            }
          ]);
        }
      }
    }

    if (pX >= window.innerWidth - 110) {
      setArea('hallway', 145, Math.max(pY, 555));
      setHidingState(false);
      showEmote('...', 1500);
    }
  } else if (currentArea === 'library') {
    const remainingSpots = librarySpots.filter((s) => !s.done).length;

    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML =
        remainingSpots === 0
          ? '<span class="arrow-icon">◀</span><span>Exit to Next Chapter</span>'
          : `<span class="arrow-icon">◀</span><span>Left Exit (${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} left)</span>`;
      arrowLeft.classList.toggle('highlight', pX < 240 && remainingSpots === 0);
    }
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.innerHTML = '<span>Side Chambers</span><span class="arrow-icon">▶</span>';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 260);
    }

    if (pX <= 45) {
      if (remainingSpots === 0 && !isMonologueActive) {
        exitLibraryLeftToNextChapter();
      } else {
        pX = 55;
        if (!isMonologueActive && patrolState === 'idle') {
          queueMonologue([
            {
              text:
                remainingSpots > 0
                  ? "Hold on—I still haven't set my distraction or grabbed what I came for in here."
                  : "Okay, let me finish my thought before stepping out...",
              emote: '...'
            }
          ]);
        }
      }
    }

    if (pX >= window.innerWidth - 110) {
      setArea('chambers', 145, Math.max(pY, 555));
      setHidingState(false);
      showEmote('...', 1500);
    }
  } else if (currentArea === 'balcony') {
    if (arrowLeft) {
      arrowLeft.style.display = 'flex';
      arrowLeft.innerHTML = '<span class="arrow-icon">◀</span><span>My Chambers</span>';
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

// --- IN-CHARACTER OPENING ---
setArea('room', startX, startY);
syncNoiseUI();
updateMapHighlight();
queueMonologue([
  {
    text: "Bag packed, night air cool... most of the castle is already asleep.",
    emote: '✦'
  },
  {
    text: "Just slip through the west door, keep quiet, cross the chambers past Father's watch, and reach the library.",
    emote: '...'
  }
]);

gameLoop();
