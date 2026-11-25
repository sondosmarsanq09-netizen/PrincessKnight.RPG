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
const caughtFlash = document.getElementById('caught-flash');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const noiseBarFill = document.getElementById('noise-bar-fill');
const susBadge = document.getElementById('sus-badge');
const panicStatus = document.getElementById('panic-status');
const hallWaitHud = document.getElementById('hall-wait-hud');
const hallWaitSec = document.getElementById('hall-wait-sec');
const arrowRight = document.getElementById('arrow-right');
const taskMarkersWrap = document.getElementById('task-markers');
const actionPrompt = document.getElementById('action-prompt');
const panicPrompt = document.getElementById('panic-prompt');
const panicPromptText = document.getElementById('panic-prompt-text');
const panicBarFill = document.getElementById('panic-bar-fill');
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const torchSweep = document.getElementById('torch-sweep');
const kingShadowWrap = document.getElementById('king-shadow-wrap');

// Princess / Knight Dialogue Box
const pDialogueBox = document.getElementById('princess-dialogue-box');
const pSpeaker = document.getElementById('p-speaker');
const pDialogueText = document.getElementById('p-dialogue-text');

// King's Special Gold / Angry Red Dialogue Card
const royalDialogueCard = document.getElementById('royal-dialogue-card');
const royalSpeaker = document.getElementById('royal-speaker');
const royalLine = document.getElementById('royal-line');
const dialogueChoices = document.getElementById('dialogue-choices');
const cardFooter = document.getElementById('card-footer');

// Answer Timer UI
const answerTimerWrap = document.getElementById('answer-timer-wrap');
const answerTimerLabel = document.getElementById('answer-timer-label');
const answerTimerFill = document.getElementById('answer-timer-fill');

// Escape Map Modal
const escapeMapModal = document.getElementById('escape-map-modal');
const closeMapBtn = document.getElementById('close-map-btn');

// Prep Modal UI
const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskInstructions = document.getElementById('task-instructions');
const taskBody = document.getElementById('task-body');
const closeTaskBtn = document.getElementById('close-task-btn');

// Princess Coordinates & State
let pX = 400;
let pY = 570;
const baseSpeed = 6;
let currentArea = 'room'; // 'room' <-> 'balcony'
let isHiding = false;
let noiseLevel = 0;

// Caught / Suspicion / Panic States (Blur ONLY happens while isPanicking after getting caught)
let caughtCount = 0;
let isKingSus = false;
let isPanicking = false;
let breathsNeeded = 0;
const PANIC_PASSOUT_LIMIT = 8.5;
let panicTimeLeft = PANIC_PASSOUT_LIMIT;
let panicCountdownInterval = null;

// Balcony Patrol State
let balconyThreatActive = false;
let balconyCalledOutThisPatrol = false;

// End-of-Prep Hallway Wait & Map State
let allTasksFinished = false;
let hallWaitActive = false;
let hallWaitLeft = 12.0;
let hallWaitInterval = null;

// Dialogue Queue
let monologueQueue = [];
let isMonologueActive = false;
let patrolsUnlocked = false;
let initialGraceTimer = null;

// Patrol & Prep State
let patrolState = 'idle'; // 'idle' | 'approaching' | 'checking' | 'dialogue' | 'scolding' | 'scold_result'
let patrolTimers = [];
let patrolCount = 0;
let pendingOutcome = null; // 'sus_panic' | 'reset_tasks' | 'normal' | 'dismiss_guards'
let activeTask = null;
let caughtTriggeredThisCheck = false;
let activeMiniGameTimer = null;

const ANSWER_TIME_LIMIT = 8.0;
let answerCountdownInterval = null;
let answerTimeLeft = ANSWER_TIME_LIMIT;

const tasks = [
  {
    id: 'pack',
    area: 'room',
    label: '🎒 Pack Bag',
    xPct: 0.22,
    y: 545,
    done: false,
    hard: false
  },
  {
    id: 'love_letter',
    area: 'room',
    label: '💌 Write Love Letter',
    xPct: 0.44,
    y: 540,
    done: false,
    hard: false
  },
  {
    id: 'decoy',
    area: 'room',
    label: '🛏️ Bed Decoy',
    xPct: 0.72,
    y: 555,
    done: false,
    hard: false
  },
  {
    id: 'star_click',
    area: 'balcony',
    label: '✦ Catch Stars',
    xPct: 0.34,
    y: 560,
    done: false,
    hard: true
  },
  {
    id: 'star_spell',
    area: 'balcony',
    label: '✨ Name the Stars',
    xPct: 0.58,
    y: 565,
    done: false,
    hard: true
  }
];

function getCurrentMovementSpeed() {
  if (!isPanicking) return baseSpeed;
  const slowdown = Math.min(4.5, 2.6 + (caughtCount - 1) * 0.85);
  return Math.max(1.3, baseSpeed - slowdown);
}

function resetAllTasks() {
  tasks.forEach((t) => {
    t.done = false;
  });
  allTasksFinished = false;
  hallWaitActive = false;
  clearInterval(hallWaitInterval);
  hallWaitHud.classList.add('hidden');
  renderTaskMarkers();
  updateObjectiveHUD();
}

function getIncompleteTasks() {
  return tasks.filter((t) => !t.done);
}

const normalRoyalLines = [
  '"Keep strict watch along the eastern corridor until daybreak. Let no one slip past."',
  '"See that every post is manned. The castle stands under royal order tonight."',
  '"Silence in the royal wing. Patrol the outer gallery and report any disturbance."'
];

const susRoyalLines = [
  '"My daughter\'s behavior tonight does not sit right with me. Keep a close watch on her chambers."',
  '"I will not be fooled by hurried excuses. Watch every entrance near the Princess\'s wing."',
  '"Something in the royal quarters is amiss. Redouble your vigilance until dawn."'
];

const caughtEncounter = {
  scold: '"Why are you still awake?! Go to bed right now!"',
  hint: 'Hint: Pick an answer that sounds natural and won\'t make him suspect you\'re sneaking around.',
  choices: [
    {
      text: '1. "I woke up for some warm tea."',
      safe: true,
      reply: '"Fine. Drink it and get to sleep... though I\'m keeping a close eye on you."'
    },
    {
      text: '2. "Forgive me, Father—a nightmare woke me up."',
      safe: true,
      reply: '"A nightmare, huh...? Very well, rest now. Yet I shall remain watchful."'
    },
    {
      text: '3. "Just walking around for fun."',
      safe: false,
      reply: '"You\'re up to something! Guards—search her room and go through her stuff!"'
    }
  ]
};

// --- WEB AUDIO SOUND EFFECTS (MATCHING SCENE 2) ---
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playSoftStepSound() {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(105, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.08);
    gain.gain.setValueAtTime(0.04, now);
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

// --- PULSE-AND-FADEOUT EMOTES (NO BOX, NO HEART, NO WATER) ---
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

function beginGraceCountdownOnce() {
  if (patrolsUnlocked || initialGraceTimer) return;
  initialGraceTimer = setTimeout(() => {
    patrolsUnlocked = true;
    if (patrolState === 'idle' && !allTasksFinished) {
      startKingPatrol();
    }
  }, 12000);
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

// --- ESCAPE MAP MODAL ---
function openEscapeMap() {
  escapeMapModal.classList.remove('hidden');
}

function closeEscapeMap() {
  escapeMapModal.classList.add('hidden');
}

closeMapBtn.addEventListener('click', closeEscapeMap);

// --- SCENE 1 -> SCENE 2 TRANSITION ---
function transitionToScene2() {
  if (window.GameAudio) window.GameAudio.prepareSceneTransition();
  try {
    sessionStorage.setItem(
      'ch3_s2_carryover',
      JSON.stringify({
        pX: typeof pX === 'number' ? pX : 400,
        pY: typeof pY === 'number' ? pY : 570,
        currentArea: typeof currentArea === 'string' ? currentArea : 'room',
        caughtCount: typeof caughtCount === 'number' ? caughtCount : 0,
        isKingSus: Boolean(isKingSus)
      })
    );
  } catch (e) {}

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.add('active');
    overlay.style.pointerEvents = 'all';
    overlay.style.opacity = '1';
    setTimeout(() => {
      window.location.href = 'CH3_2.html';
    }, 350);
  } else {
    window.location.href = 'CH3_2.html';
  }
}

// --- PANIC ATTACK & BREATHING TIMER (Post-Catch Only) ---
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
  closeTaskModal();
  currentArea = 'room';
  balconyThreatActive = false;
  balconyCalledOutThisPatrol = false;
  worldLayer.style.backgroundImage = "url('NightimePrincessRoom.png')";
  locationBanner.textContent = "📍 Princess's Chambers";
  pX = window.innerWidth - 260;
  pY = 560;
  isHiding = false;
  princess.classList.remove('hidden-in-shadows');
  renderTaskMarkers();

  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 600);

  queueMonologue([
    {
      text: 'Ugh... I couldn\'t get enough air in time... I think I blacked out for a second.',
      emote: '...'
    },
    {
      text: 'Okay, I\'m back up. Take it slow and don\'t lose it again.',
      emote: '!'
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
        text: 'Okay... in and out. My head\'s finally clearing up.',
        emote: '...'
      }
    ]);
  } else {
    panicPromptText.textContent = `💔 DANGER: Still panicking! Press [B] to calm her down (${breathsNeeded} left)`;
  }
}

// --- NOISE SYSTEM ---
function addNoise(amount, reasonText) {
  if (allTasksFinished) return;
  const mult = isKingSus ? 1.35 : 1.0;
  noiseLevel = Math.min(100, noiseLevel + amount * mult);
  noiseBarFill.style.width = noiseLevel + '%';
  showEmote('!', 1400);

  if (noiseLevel >= 100 && patrolState === 'idle') {
    noiseLevel = 0;
    noiseBarFill.style.width = '0%';
    patrolsUnlocked = true;
    closeTaskModal();
    startKingPatrol(
      reasonText || '"A sound came from the Princess\'s wing. Knights, sweep the halls—I shall inspect her chamber myself."'
    );
  }
}

function updateObjectiveHUD() {
  const doneCount = tasks.filter((t) => t.done).length;
  if (allTasksFinished) {
    objectiveText.textContent = 'Getting Ready Done! Wait for the halls to clear';
  } else {
    objectiveText.textContent = `Getting Ready: ${doneCount}/${tasks.length} Done • Stay quiet!`;
  }
}

function getTaskScreenX(task) {
  return Math.max(120, Math.min(window.innerWidth - 160, Math.round(window.innerWidth * task.xPct)));
}

function renderTaskMarkers() {
  taskMarkersWrap.innerHTML = '';
  if (allTasksFinished) return;
  const incomplete = getIncompleteTasks();
  incomplete.forEach((t) => {
    if (t.area !== currentArea) return;
    const el = document.createElement('div');
    el.className = 'task-hotspot' + (t.hard ? ' hard' : '');
    const safeX = getTaskScreenX(t);
    const safeY = Math.max(160, Math.min(window.innerHeight - 150, t.y - 75));
    el.style.left = safeX + 'px';
    el.style.top = safeY + 'px';
    el.textContent = t.label;
    taskMarkersWrap.appendChild(el);
  });
}

function getNearbyTask() {
  if (allTasksFinished) return null;
  const incomplete = getIncompleteTasks();
  return incomplete.find((t) => {
    if (t.area !== currentArea || t.done) return false;
    const tx = getTaskScreenX(t);
    return Math.abs(pX - tx) < 170 && Math.abs(pY - t.y) < 150;
  });
}

function setHidingState(nextHidden) {
  isHiding = Boolean(nextHidden);
  princess.classList.toggle('hidden-in-shadows', isHiding);
}

// --- KNIGHT CALLOUT ONLY ON THE MOMENT PRINCESS WALKS INTO BALCONY (ONCE PER PATROL) ---
function triggerBalconyEntryCalloutOnce() {
  if (currentArea !== 'balcony' || balconyCalledOutThisPatrol) return;
  if (!['approaching', 'checking'].includes(patrolState)) return;

  balconyCalledOutThisPatrol = true;
  balconyThreatActive = true;
  caughtTriggeredThisCheck = false;
  closeTaskModal();

  clearPatrolTimers();

  patrolState = 'checking';
  patrolAlert.classList.remove('hidden');
  patrolAlert.classList.add('danger');
  patrolText.textContent = 'Knights spotted you stepping onto the balcony — press [E] to hide!';
  showEmote('!', 1600);

  queueMonologue(
    [
      {
        speaker: 'KNIGHTS',
        text: 'YOUR MAJESTY!! WE SEE SHADOWS AND HEAR RUSTLING OUT ON THE BALCONY RIGHT NOW!!',
        emote: '!'
      },
      {
        speaker: 'PRINCESS',
        text: 'They called me out the second I stepped out here! Press [E] to hide right now!',
        emote: '...'
      }
    ],
    () => {
      if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
      kingShadowWrap.classList.remove('hidden');
      requestAnimationFrame(() => {
        kingShadowWrap.classList.add('visible', 'looking-in', 'deep-scan');
      });
      patrolText.textContent = 'Checking balcony — press [E] to hide!';

      patrolTimers.push(
        setTimeout(() => {
          if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
          if (!isHiding) {
            caughtTriggeredThisCheck = true;
            triggerCaughtScolding();
            return;
          }
          presentKingPatrolDialogue();
        }, 2200)
      );
    }
  );
}

function presentKingPatrolDialogue(customCallout = null) {
  if (patrolState === 'dialogue' || patrolState === 'scolding' || patrolState === 'scold_result') return;
  patrolState = 'dialogue';
  pendingOutcome = 'normal';
  patrolAlert.classList.remove('danger');
  stopAnswerTimer();

  kingShadowWrap.classList.remove('hidden');
  requestAnimationFrame(() => {
    kingShadowWrap.classList.add('visible', 'looking-in');
  });

  const pool = isKingSus ? susRoyalLines : normalRoyalLines;
  const line = customCallout || pool[patrolCount % pool.length];
  patrolCount++;

  royalDialogueCard.classList.remove('hidden', 'scolding');
  royalDialogueCard.classList.add('royal-gold');
  royalSpeaker.textContent = isKingSus ? '👑 KING (WATCHFUL)' : '👑 KING';
  royalLine.textContent = line;
  dialogueChoices.classList.add('hidden');
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = '[Space / E / Click] Continue';
}

// --- HALLWAY WAIT & ESCAPE MAP AFTER ALL PREP IS DONE ---
function startHallwayWaitAndMap() {
  allTasksFinished = true;
  renderTaskMarkers();
  updateObjectiveHUD();
  clearPatrolTimers();

  patrolState = 'dialogue';
  pendingOutcome = 'dismiss_guards';
  royalDialogueCard.classList.remove('hidden', 'scolding');
  royalDialogueCard.classList.add('royal-gold');
  royalSpeaker.textContent = '👑 KING';
  royalLine.textContent = '"All seems quiet and everyone is asleep. You may stand down and return to your quarters for the night."';
  dialogueChoices.classList.add('hidden');
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = '[Space / E / Click] Continue';
}

function beginHallClearTimer() {
  hallWaitActive = true;
  hallWaitLeft = 12.0;
  hallWaitHud.classList.remove('hidden');
  hallWaitSec.textContent = `${hallWaitLeft.toFixed(1)}s`;
  openEscapeMap();

  clearInterval(hallWaitInterval);
  hallWaitInterval = setInterval(() => {
    hallWaitLeft -= 0.1;
    if (hallWaitLeft <= 0) {
      hallWaitLeft = 0;
      clearInterval(hallWaitInterval);
      hallWaitActive = false;
      hallWaitSec.textContent = '0.0s';
      hallWaitHud.classList.add('hidden');
      closeEscapeMap();
      queueMonologue(
        [
          {
            text: 'Okay, the halls look empty now. I\'ve got the route down—time to slip into the hallway.',
            emote: '✦'
          }
        ],
        transitionToScene2
      );
      return;
    }
    hallWaitSec.textContent = `${hallWaitLeft.toFixed(1)}s`;
  }, 100);
}

// --- PREP MINI-GAMES ---
function clearMiniGameTimer() {
  if (activeMiniGameTimer) {
    clearInterval(activeMiniGameTimer);
    activeMiniGameTimer = null;
  }
}

function openTaskModal(task) {
  if (patrolState !== 'idle' || isMonologueActive || allTasksFinished) return;
  clearMiniGameTimer();
  activeTask = task;
  taskModal.classList.remove('hidden');
  taskBody.innerHTML = '';

  if (task.id === 'pack') {
    taskTitle.textContent = '🎒 Pack Bag';
    taskInstructions.textContent = 'Drag or click all 3 things into your bag quietly.';
    let packed = 0;
    taskBody.innerHTML = `
      <div class="pack-arena">
        <div class="pack-items">
          <div class="drag-item" draggable="true" data-item="cloak">🧥 Dark Travel Cloak</div>
          <div class="drag-item" draggable="true" data-item="lantern">🏮 Hooded Lantern</div>
          <div class="drag-item" draggable="true" data-item="letter">💌 Old Love Letter</div>
        </div>
        <div class="satchel-dropzone" id="satchel-zone">
          <div>🎒 Drop here</div>
          <div id="pack-count">0 / 3 Packed</div>
        </div>
      </div>
    `;
    const zone = document.getElementById('satchel-zone');
    const countEl = document.getElementById('pack-count');
    taskBody.querySelectorAll('.drag-item').forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.dataset.item);
      });
      item.addEventListener('click', () => {
        if (item.classList.contains('packed')) return;
        item.classList.add('packed');
        packed++;
        playSilverClinkSound(false);
        addNoise(14);
        countEl.textContent = `${packed} / 3 Packed`;
        if (packed >= 3) completeTask(task);
      });
    });
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('over');
      const id = e.dataTransfer.getData('text/plain');
      const el = taskBody.querySelector(`[data-item="${id}"]`);
      if (el && !el.classList.contains('packed')) {
        el.classList.add('packed');
        packed++;
        playSilverClinkSound(false);
        addNoise(12);
        countEl.textContent = `${packed} / 3 Packed`;
        if (packed >= 3) completeTask(task);
      }
    });
  } else if (task.id === 'love_letter') {
    taskTitle.textContent = '💌 Write Love Letter';
    taskInstructions.textContent = 'Write the letter in order (1 → 2 → 3 → 4) without smudging ink.';
    let nextStep = 1;
    taskBody.innerHTML = `
      <div class="rune-row">
        <button class="rune-btn" data-step="3">3. Verse of Devotion</button>
        <button class="rune-btn" data-step="1">1. ✦ Unfold Parchment</button>
        <button class="rune-btn" data-step="4">4. 💌 Fold &amp; Seal</button>
        <button class="rune-btn" data-step="2">2. Dip Nib in Ink</button>
      </div>
    `;
    taskBody.querySelectorAll('.rune-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        if (step === nextStep) {
          btn.classList.add('done');
          nextStep++;
          playSoftStepSound();
          addNoise(8);
          if (nextStep > 4) completeTask(task);
        } else {
          playWoodCreakSound(true);
          addNoise(45, '"Ink spilled?! Knights, search every chamber—I shall check the Princess\'s room myself."');
        }
      });
    });
  } else if (task.id === 'decoy') {
    taskTitle.textContent = '🛏️ Bed Decoy';
    taskInstructions.textContent = 'Tuck the pillows and blanket so the bed looks occupied.';
    let placed = 0;
    taskBody.innerHTML = `
      <div class="decoy-grid">
        <button class="pillow-btn" data-idx="1">🛏️ Fluff Pillow</button>
        <button class="pillow-btn" data-idx="2">🧸 Bolster Cushion</button>
        <button class="pillow-btn" data-idx="3">✦ Blanket Tuck</button>
      </div>
    `;
    taskBody.querySelectorAll('.pillow-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('placed')) return;
        btn.classList.add('placed');
        btn.textContent = '✔ Ready';
        placed++;
        playWoodCreakSound(false);
        addNoise(10);
        if (placed >= 3) completeTask(task);
      });
    });
  } else if (task.id === 'star_click') {
    const goal = 10;
    let caughtStars = 0;
    let timeLeft = 9.5;
    taskTitle.textContent = '✦ Balcony: Catch Stars';
    taskInstructions.textContent = `Catch ${goal} stars before time runs out!`;
    taskBody.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;color:#ffd166;">
        <span id="star-counter">Stars Caught: 0 / ${goal}</span>
        <span id="star-timer" style="color:#ff8fa3;">⏱ ${timeLeft.toFixed(1)}s</span>
      </div>
      <div class="star-click-arena" id="star-arena"></div>
    `;
    const arena = document.getElementById('star-arena');
    const counterEl = document.getElementById('star-counter');
    const timerEl = document.getElementById('star-timer');

    activeMiniGameTimer = setInterval(() => {
      timeLeft -= 0.1;
      if (!timerEl) return;
      if (timeLeft <= 0) {
        caughtStars = 0;
        timeLeft = 9.5;
        counterEl.textContent = `Time's up! Try again: 0 / ${goal}`;
        playPorcelainChimeSound(true);
        addNoise(15);
        spawnStar();
      }
      timerEl.textContent = `⏱ ${Math.max(0, timeLeft).toFixed(1)}s`;
    }, 100);

    function spawnStar() {
      if (!activeTask || activeTask.id !== 'star_click' || caughtStars >= goal) return;
      arena.innerHTML = '';
      const btn = document.createElement('button');
      btn.className = 'star-target-btn';
      btn.textContent = '✦ STAR';
      btn.style.left = (12 + Math.random() * 76) + '%';
      btn.style.top = (15 + Math.random() * 70) + '%';
      btn.addEventListener('click', () => {
        caughtStars++;
        playPorcelainChimeSound(false);
        addNoise(8);
        counterEl.textContent = `Stars Caught: ${caughtStars} / ${goal}`;
        if (caughtStars >= goal) {
          clearMiniGameTimer();
          completeTask(task);
        } else {
          spawnStar();
        }
      });
      arena.appendChild(btn);
    }
    spawnStar();
  } else if (task.id === 'star_spell') {
    const targetWord = 'ECLIPSE';
    const letters = ['C', 'E', 'P', 'L', 'S', 'I', 'E', 'A', 'R', 'O'];
    let typed = '';
    let timeLeft = 10.5;

    taskTitle.textContent = '✨ Balcony: Name the Stars';
    taskInstructions.textContent = 'Spell the word in order before the timer runs out!';
    taskBody.innerHTML = `
      <div style="text-align:right;margin-bottom:6px;font-size:13px;color:#ff8fa3;" id="spell-timer">⏱ ${timeLeft.toFixed(1)}s</div>
      <div class="spell-target-word">SPELL: ${targetWord} &nbsp;|&nbsp; <span id="typed-preview">_______</span></div>
      <div class="star-letter-grid" id="letter-grid"></div>
    `;
    const grid = document.getElementById('letter-grid');
    const preview = document.getElementById('typed-preview');
    const timerEl = document.getElementById('spell-timer');

    function resetSpellRound(msgPrefix = '') {
      typed = '';
      timeLeft = 10.5;
      preview.textContent = '_______';
      grid.querySelectorAll('.star-letter-btn').forEach((b) => b.classList.remove('picked'));
      if (timerEl) timerEl.textContent = `${msgPrefix}⏱ ${timeLeft.toFixed(1)}s`;
    }

    activeMiniGameTimer = setInterval(() => {
      timeLeft -= 0.1;
      if (!timerEl) return;
      if (timeLeft <= 0) {
        playPorcelainChimeSound(true);
        addNoise(16);
        resetSpellRound('Reset! ');
        return;
      }
      timerEl.textContent = `⏱ ${timeLeft.toFixed(1)}s`;
    }, 100);

    letters.forEach((ch) => {
      const btn = document.createElement('button');
      btn.className = 'star-letter-btn';
      btn.textContent = ch;
      btn.addEventListener('click', () => {
        const expected = targetWord[typed.length];
        if (ch === expected) {
          typed += ch;
          btn.classList.add('picked');
          preview.textContent = typed.padEnd(targetWord.length, '_');
          playPorcelainChimeSound(false);
          addNoise(7);
          if (typed === targetWord) {
            clearMiniGameTimer();
            completeTask(task);
          }
        } else {
          playPorcelainChimeSound(true);
          addNoise(22);
          resetSpellRound('Wrong star! ');
        }
      });
      grid.appendChild(btn);
    });
  }
}

function closeTaskModal() {
  clearMiniGameTimer();
  activeTask = null;
  taskModal.classList.add('hidden');
}

closeTaskBtn.addEventListener('click', closeTaskModal);

function completeTask(task) {
  clearMiniGameTimer();
  task.done = true;
  closeTaskModal();
  playSuccessChime();
  renderTaskMarkers();
  updateObjectiveHUD();
  showEmote('✦', 1600);

  const remaining = tasks.filter((t) => !t.done).length;
  if (remaining > 0) {
    queueMonologue([
      {
        text: `Good, that part's done. ${remaining} more to finish getting ready.`,
        emote: '...'
      }
    ]);
  } else {
    startHallwayWaitAndMap();
  }
}

// --- KING PATROL & SCOLDING SYSTEM ---
function clearPatrolTimers() {
  patrolTimers.forEach((id) => clearTimeout(id));
  patrolTimers = [];
}

function stopAnswerTimer() {
  if (answerCountdownInterval) {
    clearInterval(answerCountdownInterval);
    answerCountdownInterval = null;
  }
  answerTimerWrap.classList.add('hidden');
  answerTimerLabel.classList.remove('urgent');
}

function startAnswerTimer() {
  stopAnswerTimer();
  answerTimeLeft = isKingSus ? 6.5 : ANSWER_TIME_LIMIT;
  answerTimerWrap.classList.remove('hidden');
  answerTimerLabel.textContent = `⏱ ${answerTimeLeft.toFixed(1)}s`;
  answerTimerFill.style.width = '100%';

  const tickMs = 80;
  const totalStart = answerTimeLeft;
  answerCountdownInterval = setInterval(() => {
    answerTimeLeft -= tickMs / 1000;
    if (answerTimeLeft <= 0) {
      answerTimeLeft = 0;
      stopAnswerTimer();
      handleAnswerTimeout();
      return;
    }
    answerTimerLabel.textContent = `⏱ ${answerTimeLeft.toFixed(1)}s`;
    answerTimerLabel.classList.toggle('urgent', answerTimeLeft <= 2.2);
    answerTimerFill.style.width = Math.max(0, (answerTimeLeft / totalStart) * 100) + '%';
  }, tickMs);
}

function handleAnswerTimeout() {
  if (patrolState !== 'scolding') return;
  caughtCount++;
  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 550);

  patrolState = 'scold_result';
  pendingOutcome = 'reset_tasks';
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = '"Too slow! You\'re up to something! Guards—search her room and go through her stuff!"';
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = '[Space / E / Click] Continue';
}

function startKingPatrol(customCallout = null, forceBalconyCheck = false) {
  if (patrolState !== 'idle' || allTasksFinished) return;
  clearPatrolTimers();
  closeTaskModal();

  caughtTriggeredThisCheck = false;
  balconyCalledOutThisPatrol = false;
  balconyThreatActive = false;

  patrolState = 'approaching';
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent = isKingSus
    ? 'Father is approaching fast — press [E] to hide!'
    : 'Footsteps & lantern approaching — press [E] to hide!';
  torchSweep.classList.add('active');
  showEmote('!', 1600);

  const stepGap = isKingSus ? 430 : 550;
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 2));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 3));

  const checkDelay = stepGap * 3 + 300;
  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'approaching') return;
    patrolState = 'checking';

    kingShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      kingShadowWrap.classList.add('visible');
    });

    patrolAlert.classList.add('danger');
    patrolText.textContent = 'Hide before he sees you! [E]';
  }, checkDelay));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking') return;
    kingShadowWrap.classList.add('looking-in');
  }, checkDelay + 450));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;

    kingShadowWrap.classList.add('deep-scan');
    if (!isHiding) {
      caughtTriggeredThisCheck = true;
      triggerCaughtScolding();
      return;
    }
    patrolText.textContent = 'He\'s looking into the room — stay still!';
  }, checkDelay + 1150));

  patrolTimers.push(setTimeout(() => {
    if (patrolState !== 'checking' || caughtTriggeredThisCheck) return;
    presentKingPatrolDialogue(customCallout);
  }, checkDelay + 2800));
}

function triggerCaughtScolding() {
  clearPatrolTimers();
  closeTaskModal();
  caughtCount++;
  patrolState = 'scolding';
  pendingOutcome = null;
  showEmote('!', 1600);

  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 650);

  kingShadowWrap.classList.remove('hidden');
  kingShadowWrap.classList.add('visible', 'looking-in', 'deep-scan');
  patrolAlert.classList.remove('hidden');
  patrolAlert.classList.add('danger');
  patrolText.textContent = 'CAUGHT! Choose carefully!';

  royalDialogueCard.classList.remove('hidden', 'royal-gold');
  royalDialogueCard.classList.add('scolding');
  royalSpeaker.textContent = '👑 FURIOUS KING';
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
      resolveScoldChoice(choice);
    });
    dialogueChoices.appendChild(btn);
  });

  startAnswerTimer();
}

function resolveScoldChoice(choice) {
  stopAnswerTimer();
  patrolState = 'scold_result';
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = choice.reply;
  cardFooter.classList.remove('hidden');

  if (choice.safe) {
    isKingSus = true;
    susBadge.classList.remove('hidden');
    pendingOutcome = 'sus_panic';
    cardFooter.textContent = '[Space / E / Click] Continue';
  } else {
    pendingOutcome = 'reset_tasks';
    cardFooter.textContent = '[Space / E / Click] Continue';
  }
}

function finishKingPatrol() {
  const outcome = pendingOutcome || 'normal';
  pendingOutcome = null;
  balconyThreatActive = false;
  balconyCalledOutThisPatrol = false;
  caughtTriggeredThisCheck = false;

  clearPatrolTimers();
  stopAnswerTimer();
  royalDialogueCard.classList.add('hidden');
  royalDialogueCard.classList.remove('scolding', 'royal-gold');
  dialogueChoices.classList.add('hidden');
  kingShadowWrap.classList.remove('visible', 'looking-in', 'deep-scan');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden', 'danger');
  setHidingState(false);

  if (outcome === 'dismiss_guards') {
    patrolState = 'idle';
    queueMonologue(
      [
        {
          text: 'Phew, close call... I\'ll wait a bit in here so the halls are clear before I move.',
          emote: '...'
        },
        {
          text: 'Let me check the route he sketched out so I don\'t run straight into Father\'s wing.',
          emote: '✦'
        }
      ],
      beginHallClearTimer
    );
    return;
  }

  if (outcome === 'reset_tasks') {
    currentArea = 'room';
    worldLayer.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
    pX = window.innerWidth - 260;
    pY = 560;
    setHidingState(false);
    resetAllTasks();
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: 'Ugh, no... they went through everything and ruined my prep. I have to start getting ready all over again.',
        emote: '!'
      },
      {
        text: 'Why am I shaking like this... what if he locks me down completely and ruins tonight?',
        emote: '...'
      }
    ]);
  } else if (outcome === 'sus_panic') {
    triggerPostCatchPanic();
    queueMonologue([
      {
        text: 'He bought it... barely. Now he\'s watching me like a hawk—I can hear him ordering tighter eyes on my wing.',
        emote: '!'
      },
      {
        text: 'I just want some freedom for once... why can\'t he see the good in me instead of treating me like a threat?',
        emote: '...'
      }
    ]);
  } else if (isKingSus) {
    queueMonologue([
      {
        text: 'Still on edge out there... I just need to finish getting ready and get out of here.',
        emote: '...'
      }
    ]);
  }

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('hidden');
    patrolState = 'idle';
    if (!allTasksFinished) scheduleNextPatrol();
  }, 650));
}

function scheduleNextPatrol() {
  clearPatrolTimers();
  if (!patrolsUnlocked || allTasksFinished) return;
  const intervalMs = isKingSus ? 10000 : 14000;
  patrolTimers.push(setTimeout(() => {
    if (patrolState === 'idle' && !allTasksFinished) {
      startKingPatrol();
    }
  }, intervalMs));
}

royalDialogueCard.addEventListener('click', () => {
  if (patrolState === 'dialogue' || patrolState === 'scold_result') {
    finishKingPatrol();
  }
});

// --- INPUT HANDLING ---
const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }

  if (k === 'escape' && !escapeMapModal.classList.contains('hidden')) {
    closeEscapeMap();
    return;
  }

  if (k === 'b' && isPanicking) {
    performSteadyBreath();
    return;
  }

  if (k === 'escape' && activeTask) {
    closeTaskModal();
    return;
  }

  const canHideNow =
    !activeTask &&
    !['dialogue', 'scolding', 'scold_result'].includes(patrolState) &&
    (currentArea === 'room' ||
      (currentArea === 'balcony' &&
        (balconyThreatActive || ['approaching', 'checking'].includes(patrolState))));

  if (k === 'e' && canHideNow) {
    if (currentArea === 'balcony' && ['approaching', 'checking'].includes(patrolState)) {
      setHidingState(!isHiding);
      if (isMonologueActive) advanceMonologue();
      return;
    }

    const nearTask = !isMonologueActive ? getNearbyTask() : null;
    if (!nearTask && ['approaching', 'checking'].includes(patrolState)) {
      setHidingState(!isHiding);
      return;
    }
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
    finishKingPatrol();
    return;
  }

  if (k === 'e' && !activeTask && !isMonologueActive && !['dialogue', 'scolding', 'scold_result'].includes(patrolState)) {
    const nearTask = getNearbyTask();
    if (nearTask && patrolState === 'idle') {
      openTaskModal(nearTask);
      return;
    }

    if (canHideNow) {
      setHidingState(!isHiding);
    }
    return;
  }

  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('resize', renderTaskMarkers);

// --- MAIN LOOP ---
let lastStepSoundAt = 0;

function gameLoop() {
  let pMoving = false;
  const activeSpeed = getCurrentMovementSpeed();
  const locked =
    isMonologueActive ||
    Boolean(activeTask) ||
    !escapeMapModal.classList.contains('hidden') ||
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

    if (pMoving) {
      const now = performance.now();
      if (now - lastStepSoundAt > 260) {
        lastStepSoundAt = now;
        playSoftStepSound();
      }
    }
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  const nearTask = getNearbyTask();
  if (patrolState === 'approaching' || patrolState === 'checking') {
    actionPrompt.classList.remove('hidden');
    if (isHiding) {
      actionPrompt.textContent = 'Hidden in shadows — don\'t move!';
    } else {
      actionPrompt.textContent = 'Hide before they see you! [E]';
    }
  } else if (nearTask && !activeTask && !isMonologueActive) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = `[E] ${nearTask.label}`;
  } else {
    actionPrompt.classList.add('hidden');
  }

  if (currentArea === 'room') {
    if (arrowRight) {
      arrowRight.style.display = 'flex';
      arrowRight.classList.toggle('highlight', pX > window.innerWidth - 280);
    }
    if (pX < 10) pX = 10;

    if (pX >= window.innerWidth - 130) {
      currentArea = 'balcony';
      setHidingState(false);
      worldLayer.style.backgroundImage = "url('NightimeBalcony.png')";
      locationBanner.textContent = "📍 Royal Balcony";
      pX = Math.round(window.innerWidth * 0.22);
      pY = Math.max(pY, 540);
      renderTaskMarkers();
      showEmote('...', 1600);

      if (['approaching', 'checking'].includes(patrolState) && !balconyCalledOutThisPatrol) {
        triggerBalconyEntryCalloutOnce();
      }
    }
  } else if (currentArea === 'balcony') {
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= Math.round(window.innerWidth * 0.12)) {
      balconyThreatActive = false;
      currentArea = 'room';
      setHidingState(false);
      worldLayer.style.backgroundImage = "url('NightimePrincessRoom.png')";
      locationBanner.textContent = "📍 Princess's Chambers";
      pX = window.innerWidth - 170;
      renderTaskMarkers();
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

// Natural opening thoughts calling prep "getting ready"
renderTaskMarkers();
updateObjectiveHUD();
queueMonologue(
  [
    {
      text: 'Okay, deep breath... I\'m actually doing this tonight. Just thinking about seeing him makes my stomach flip.',
      emote: '✦'
    },
    {
      text: 'If Father catches me before I\'m ready, I\'m dead meat. I need to finish getting ready fast and keep quiet.',
      emote: '!'
    },
    {
      text: 'I\'ve got a little time before patrols start checking in. If I make too much noise, Father\'s gonna come straight here.',
      emote: '...'
    },
    {
      text: 'I can slip out onto the balcony to finish getting ready too—though there\'s no safety out there if knights spot me.',
      emote: '!'
    },
    {
      text: 'Alright... let\'s get my things together before anything goes wrong.',
      emote: '...'
    }
  ],
  beginGraceCountdownOnce
);

gameLoop();
