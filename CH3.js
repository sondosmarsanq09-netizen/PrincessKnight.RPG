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
const gameBody = document.getElementById('game-body');
const caughtFlash = document.getElementById('caught-flash');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const noiseBarFill = document.getElementById('noise-bar-fill');
const arrowRight = document.getElementById('arrow-right');
const taskMarkersWrap = document.getElementById('task-markers');
const actionPrompt = document.getElementById('action-prompt');

// Princess Monologue Box (Ch.2 Sc.3 style)
const pDialogueBox = document.getElementById('princess-dialogue-box');
const pSpeaker = document.getElementById('p-speaker');
const pDialogueText = document.getElementById('p-dialogue-text');

// King Presence & Dialogue UI
const patrolAlert = document.getElementById('patrol-alert');
const patrolText = document.getElementById('patrol-text');
const torchSweep = document.getElementById('torch-sweep');
const kingShadowWrap = document.getElementById('king-shadow-wrap');
const royalDialogueCard = document.getElementById('royal-dialogue-card');
const royalSpeaker = document.getElementById('royal-speaker');
const royalLine = document.getElementById('royal-line');
const dialogueChoices = document.getElementById('dialogue-choices');
const cardFooter = document.getElementById('card-footer');

// Answer Timer UI
const answerTimerWrap = document.getElementById('answer-timer-wrap');
const answerTimerLabel = document.getElementById('answer-timer-label');
const answerTimerFill = document.getElementById('answer-timer-fill');

// Task Modal UI
const taskModal = document.getElementById('task-modal');
const taskTitle = document.getElementById('task-title');
const taskInstructions = document.getElementById('task-instructions');
const taskBody = document.getElementById('task-body');
const closeTaskBtn = document.getElementById('close-task-btn');

// Princess Coordinates & State
let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room'; // 'room' <-> 'balcony'
let isHiding = false;
let noiseLevel = 0;

// Dialogue Queue for Princess Monologue
let monologueQueue = [];
let isMonologueActive = false;
let patrolsUnlocked = false;
let initialGraceTimer = null;

// Patrol & Task State
let patrolState = 'idle'; // 'idle' | 'approaching' | 'checking' | 'dialogue' | 'scolding' | 'scold_result'
let patrolTimers = [];
let patrolCount = 0;
let scoldWasGrounded = false;
let activeTask = null;
let timingAnimId = null;

const ANSWER_TIME_LIMIT = 8.0;
let answerCountdownInterval = null;
let answerTimeLeft = ANSWER_TIME_LIMIT;

// Tasks spaced further apart; only up to 2 appear at once (order matters for clean pacing)
const tasks = [
  {
    id: 'pack',
    area: 'room',
    label: '🎒 Pack Escape Bag',
    xPct: 0.18,
    y: 545,
    done: false,
    hard: false
  },
  {
    id: 'note',
    area: 'room',
    label: '🪶 Write Alibi Note',
    xPct: 0.50,
    y: 515,
    done: false,
    hard: false
  },
  {
    id: 'decoy',
    area: 'room',
    label: '🛏️ Fake Bed Decoy',
    xPct: 0.84,
    y: 555,
    done: false,
    hard: false
  },
  {
    id: 'rope',
    area: 'balcony',
    label: '🪢 Tie Escape Rope (HARD)',
    xPct: 0.72,
    y: 560,
    done: false,
    hard: true
  }
];

function getVisibleTasks() {
  // Show at most 2 incomplete tasks at a time so the room stays uncrowded
  const incomplete = tasks.filter((t) => !t.done);
  return incomplete.slice(0, 2);
}

const royalLines = [
  '"Knights, search every room down the hall! I will check the Princess\'s wing myself."',
  '"Keep watch by the courtyard till dawn. No one sneaks past tonight."',
  '"Hmm... thought I heard something rattle in here. Better stay sharp."'
];

const caughtEncounter = {
  scold: '"Why are you still awake?! Go to bed right now!"',
  choices: [
    {
      text: '1. "I woke up for some warm tea."',
      safe: true,
      reply: '"Fine. Drink it and get to sleep."'
    },
    {
      text: '2. "I came to shut the window."',
      safe: true,
      reply: '"Leave that to the guards. Go to bed."'
    },
    {
      text: '3. "Just walking around for fun."',
      safe: false,
      reply: '"You\'re up to something! Guards—search her room and go through her stuff!"'
    }
  ]
};

// --- EMOTES & PRINCESS MONOLOGUE ---
let emoteTimeout = null;
function showEmote(symbol, duration = 2200) {
  if (!princessEmote) return;
  princessEmote.textContent = symbol;
  princessEmote.classList.remove('hidden');
  clearTimeout(emoteTimeout);
  emoteTimeout = setTimeout(() => {
    princessEmote.classList.add('hidden');
  }, duration);
}

function beginGraceCountdownOnce() {
  if (patrolsUnlocked || initialGraceTimer) return;
  // 30-second grace window before King patrols start
  initialGraceTimer = setTimeout(() => {
    patrolsUnlocked = true;
    if (patrolState === 'idle') {
      startKingPatrol();
    }
  }, 30000);
}

function queueMonologue(lines, onFinish = null) {
  monologueQueue = [...lines];
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
  pSpeaker.textContent = '💭 PRINCESS';
  pDialogueText.textContent = item.text;
  if (item.emote) showEmote(item.emote, 2400);
  pDialogueBox.classList.remove('hidden');
}

pDialogueBox.addEventListener('click', advanceMonologue);

// --- WEB AUDIO SOUND EFFECTS ---
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

// --- NOISE SYSTEM (More noise = more danger!) ---
function addNoise(amount, reasonText) {
  noiseLevel = Math.min(100, noiseLevel + amount);
  noiseBarFill.style.width = noiseLevel + '%';
  showEmote('💦', 1600);

  if (noiseLevel >= 100 && patrolState === 'idle') {
    noiseLevel = 0;
    noiseBarFill.style.width = '0%';
    patrolsUnlocked = true;
    closeTaskModal();
    startKingPatrol(
      reasonText || '"I heard something! Knights, check every room—I\'ll inspect the Princess\'s wing myself!"'
    );
  }
}

function updateObjectiveHUD() {
  const doneCount = tasks.filter((t) => t.done).length;
  if (doneCount < tasks.length) {
    objectiveText.textContent = `Tasks: ${doneCount}/${tasks.length} Done • Quiet & fast!`;
  } else {
    objectiveText.textContent = `All 4/4 tasks ready! Head to the Balcony edge to meet him!`;
  }
}

function renderTaskMarkers() {
  taskMarkersWrap.innerHTML = '';
  const visible = getVisibleTasks();
  visible.forEach((t) => {
    if (t.area !== currentArea) return;
    const el = document.createElement('div');
    el.className = 'task-hotspot' + (t.hard ? ' hard' : '');
    el.style.left = Math.round(window.innerWidth * t.xPct) + 'px';
    el.style.top = (t.y - 75) + 'px';
    el.textContent = t.label;
    taskMarkersWrap.appendChild(el);
  });
}

function getNearbyTask() {
  const visible = getVisibleTasks();
  return visible.find((t) => {
    if (t.area !== currentArea || t.done) return false;
    const tx = window.innerWidth * t.xPct;
    return Math.abs(pX - tx) < 110 && Math.abs(pY - t.y) < 90;
  });
}

// --- AMONG US STYLE MINI-TASKS ---
function openTaskModal(task) {
  if (patrolState !== 'idle' || isMonologueActive) return;
  activeTask = task;
  taskModal.classList.remove('hidden');
  taskBody.innerHTML = '';

  if (task.id === 'pack') {
    taskTitle.textContent = '🎒 Task 1: Pack Escape Satchel';
    taskInstructions.textContent = 'Drag all 3 items into your bag quietly!';
    let packed = 0;
    taskBody.innerHTML = `
      <div class="pack-arena">
        <div class="pack-items">
          <div class="drag-item" draggable="true" data-item="cloak">🧥 Dark Travel Cloak</div>
          <div class="drag-item" draggable="true" data-item="lantern">🏮 Hooded Lantern</div>
          <div class="drag-item" draggable="true" data-item="letter">💌 Knight's Map & Note</div>
        </div>
        <div class="satchel-dropzone" id="satchel-zone">
          <div>🎒 Drop items here</div>
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
        addNoise(12);
        countEl.textContent = `${packed} / 3 Packed`;
        if (packed >= 3) completeTask(task);
      }
    });
  } else if (task.id === 'decoy') {
    taskTitle.textContent = '🛏️ Task 2: Make Bed Decoy';
    taskInstructions.textContent = 'Arrange all 3 pillows under the blanket so it looks like you\'re sleeping!';
    let placed = 0;
    taskBody.innerHTML = `
      <div class="decoy-grid">
        <button class="pillow-btn" data-idx="1">🛏️ Fluff Pillow</button>
        <button class="pillow-btn" data-idx="2">🧸 Bolster Cushion</button>
        <button class="pillow-btn" data-idx="3">🛌 Blanket Tuck</button>
      </div>
    `;
    taskBody.querySelectorAll('.pillow-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('placed')) return;
        btn.classList.add('placed');
        btn.textContent = '✔ Ready';
        placed++;
        addNoise(10);
        if (placed >= 3) completeTask(task);
      });
    });
  } else if (task.id === 'note') {
    taskTitle.textContent = '🪶 Task 3: Write Alibi Note';
    taskInstructions.textContent = 'Click the seals in order (1 → 2 → 3 → 4) without spilling ink!';
    let nextStep = 1;
    taskBody.innerHTML = `
      <div class="rune-row">
        <button class="rune-btn" data-step="3">3. Sign Name</button>
        <button class="rune-btn" data-step="1">1. Dip Quill</button>
        <button class="rune-btn" data-step="4">4. Wax Seal</button>
        <button class="rune-btn" data-step="2">2. Write Excuse</button>
      </div>
    `;
    taskBody.querySelectorAll('.rune-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step, 10);
        if (step === nextStep) {
          btn.classList.add('done');
          nextStep++;
          addNoise(8);
          if (nextStep > 4) completeTask(task);
        } else {
          addNoise(45, '"Clatter?! Knights, search every chamber—I\'m checking the Princess\'s room myself!"');
        }
      });
    });
  } else if (task.id === 'rope') {
    taskTitle.textContent = '🪢 Balcony Task (HARD): Secure Silk Escape Rope';
    taskInstructions.textContent = 'Exposed outside! Lock the knot 3 times inside the green zone!';
    let hits = 0;
    let needlePos = 0;
    let dir = 1;
    const zoneStart = 42;
    const zoneWidth = 16;

    taskBody.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:#ffd166;" id="rope-progress">Knots Locked: 0 / 3</div>
      <div class="timing-bar">
        <div class="timing-zone" style="left:${zoneStart}%;width:${zoneWidth}%;"></div>
        <div class="timing-needle" id="timing-needle" style="left:0%;"></div>
      </div>
      <button class="timing-action-btn" id="lock-knot-btn">⚡ LOCK KNOT NOW [SPACE]</button>
    `;

    const needleEl = document.getElementById('timing-needle');
    const progEl = document.getElementById('rope-progress');
    const lockBtn = document.getElementById('lock-knot-btn');

    function animateNeedle() {
      needlePos += dir * 2.15;
      if (needlePos >= 98) {
        needlePos = 98;
        dir = -1;
      } else if (needlePos <= 0) {
        needlePos = 0;
        dir = 1;
      }
      if (needleEl) needleEl.style.left = needlePos + '%';
      timingAnimId = requestAnimationFrame(animateNeedle);
    }
    timingAnimId = requestAnimationFrame(animateNeedle);

    lockBtn.addEventListener('click', () => {
      if (needlePos >= zoneStart && needlePos <= zoneStart + zoneWidth) {
        hits++;
        progEl.textContent = `Knots Locked: ${hits} / 3`;
        if (hits >= 3) {
          completeTask(task);
        }
      } else {
        addNoise(50, '"What was that noise by the balcony?! Guards, search every room—I\'m checking on her!"');
      }
    });
  }
}

function closeTaskModal() {
  activeTask = null;
  if (timingAnimId) {
    cancelAnimationFrame(timingAnimId);
    timingAnimId = null;
  }
  taskModal.classList.add('hidden');
}

closeTaskBtn.addEventListener('click', closeTaskModal);

function completeTask(task) {
  task.done = true;
  closeTaskModal();
  renderTaskMarkers();
  updateObjectiveHUD();
  showEmote('✨', 2200);

  const remaining = tasks.filter((t) => !t.done).length;
  if (remaining > 0) {
    queueMonologue([
      {
        text: `Okay, done with that one! ${remaining} left—keep moving quiet and steady!`,
        emote: '✨'
      }
    ]);
  } else {
    queueMonologue([
      {
        text: 'Aaaah everything is ready!! Okay, don\'t panic—he\'s waiting for me out there!',
        emote: '♥'
      }
    ]);
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
  answerTimeLeft = ANSWER_TIME_LIMIT;
  answerTimerWrap.classList.remove('hidden');
  answerTimerLabel.textContent = `⏱ ${answerTimeLeft.toFixed(1)}s`;
  answerTimerFill.style.width = '100%';

  const tickMs = 80;
  answerCountdownInterval = setInterval(() => {
    answerTimeLeft -= tickMs / 1000;
    if (answerTimeLeft <= 0) {
      answerTimeLeft = 0;
      stopAnswerTimer();
      handleAnswerTimeout();
      return;
    }
    answerTimerLabel.textContent = `⏱ ${answerTimeLeft.toFixed(1)}s`;
    answerTimerLabel.classList.toggle('urgent', answerTimeLeft <= 2.5);
    answerTimerFill.style.width = Math.max(0, (answerTimeLeft / ANSWER_TIME_LIMIT) * 100) + '%';
  }, tickMs);
}

function handleAnswerTimeout() {
  if (patrolState !== 'scolding') return;
  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 550);

  patrolState = 'scold_result';
  scoldWasGrounded = true;
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = '"Too slow! You\'re up to something! Guards—search her room and go through her stuff!"';
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = '[Space / E / Click] Out of time...';
}

function startKingPatrol(customCallout = null) {
  if (patrolState !== 'idle') return;
  clearPatrolTimers();
  closeTaskModal();

  patrolState = 'approaching';
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent = customCallout
    ? 'King heard you! Guards sweeping rooms—he\'s coming here!'
    : 'Footsteps & lantern approaching...';
  torchSweep.classList.add('active');
  showEmote('!', 2000);

  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, 550));
  patrolTimers.push(setTimeout(triggerFootstepPulse, 1100));
  patrolTimers.push(setTimeout(triggerFootstepPulse, 1650));

  patrolTimers.push(setTimeout(() => {
    patrolState = 'checking';
    patrolAlert.classList.add('danger');
    patrolText.textContent = 'Press [E] to HIDE!';
    kingShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      kingShadowWrap.classList.add('visible');
    });
  }, 1950));

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('looking-in');
  }, 2400));

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('deep-scan');
    patrolText.textContent = 'He\'s looking in... STAY HIDDEN!';
  }, 3600));

  patrolTimers.push(setTimeout(() => {
    patrolState = 'dialogue';
    patrolAlert.classList.remove('danger');
    stopAnswerTimer();
    const line = customCallout || royalLines[patrolCount % royalLines.length];
    patrolCount++;
    royalDialogueCard.classList.remove('hidden', 'scolding');
    royalDialogueCard.classList.add('royal-gold');
    royalSpeaker.textContent = '👑 KING';
    royalLine.textContent = line;
    dialogueChoices.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    cardFooter.textContent = '[Space / E / Click] Continue';
  }, 5100));
}

function triggerCaughtScolding() {
  clearPatrolTimers();
  closeTaskModal();
  patrolState = 'scolding';
  scoldWasGrounded = false;
  showEmote('💦', 2500);

  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 650);

  kingShadowWrap.classList.add('visible', 'looking-in', 'deep-scan');
  patrolAlert.classList.add('danger');
  patrolText.textContent = 'CAUGHT! Pick an answer fast!';

  royalDialogueCard.classList.remove('hidden', 'royal-gold');
  royalDialogueCard.classList.add('scolding');
  royalSpeaker.textContent = '👑 FURIOUS KING';
  royalLine.textContent = caughtEncounter.scold;
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
  scoldWasGrounded = !choice.safe;
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = choice.reply;
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = choice.safe
    ? '[Space / E / Click] Safe!'
    : '[Space / E / Click] Guards searching your stuff...';
}

function finishKingPatrol(wasGrounded = false) {
  clearPatrolTimers();
  stopAnswerTimer();
  royalDialogueCard.classList.add('hidden');
  royalDialogueCard.classList.remove('scolding', 'royal-gold');
  dialogueChoices.classList.add('hidden');
  kingShadowWrap.classList.remove('visible', 'looking-in', 'deep-scan');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden', 'danger');

  if (wasGrounded) {
    currentArea = 'room';
    gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
    pX = window.innerWidth - 260;
    pY = 560;
    isHiding = false;
    princess.classList.remove('hidden-in-shadows');
    renderTaskMarkers();
    queueMonologue([
      {
        text: 'Ughhh my heart is hammering!! Thank goodness they didn\'t tear my bag apart—I have to be way more careful!',
        emote: '💦'
      }
    ]);
  } else {
    queueMonologue([
      {
        text: 'Whew... okay, he didn\'t catch me. Let\'s finish up fast before he comes back around!',
        emote: '...'
      }
    ]);
  }

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('hidden');
    patrolState = 'idle';
    scheduleNextPatrol();
  }, 650));
}

function scheduleNextPatrol() {
  clearPatrolTimers();
  if (!patrolsUnlocked) return;
  patrolTimers.push(setTimeout(() => {
    if (patrolState === 'idle') {
      startKingPatrol();
    }
  }, 18000));
}

royalDialogueCard.addEventListener('click', () => {
  if (patrolState === 'dialogue') {
    finishKingPatrol(false);
  } else if (patrolState === 'scold_result') {
    finishKingPatrol(scoldWasGrounded);
  }
});

// --- INPUT HANDLING ---
const keys = {};

window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }

  if (k === 'escape' && activeTask) {
    closeTaskModal();
    return;
  }

  if (activeTask && activeTask.id === 'rope' && k === ' ') {
    const btn = document.getElementById('lock-knot-btn');
    if (btn) btn.click();
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
    if (patrolState === 'dialogue') finishKingPatrol(false);
    else finishKingPatrol(scoldWasGrounded);
    return;
  }

  if (k === 'k' && patrolState === 'idle' && !activeTask) {
    patrolsUnlocked = true;
    startKingPatrol();
    return;
  }

  if (k === 'e' && !activeTask && !isMonologueActive && !['dialogue', 'scolding', 'scold_result'].includes(patrolState)) {
    const nearTask = getNearbyTask();
    if (nearTask && patrolState === 'idle') {
      openTaskModal(nearTask);
      return;
    }
    isHiding = !isHiding;
    princess.classList.toggle('hidden-in-shadows', isHiding);
    return;
  }

  keys[k] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('resize', renderTaskMarkers);

// --- MAIN LOOP ---
function gameLoop() {
  let pMoving = false;
  const locked =
    isMonologueActive ||
    Boolean(activeTask) ||
    ['dialogue', 'scolding', 'scold_result'].includes(patrolState);

  if (!locked) {
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

  if (patrolState === 'checking' && !isHiding && currentArea === 'room') {
    triggerCaughtScolding();
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  const nearTask = getNearbyTask();
  if (patrolState === 'approaching' || patrolState === 'checking') {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = isHiding
      ? 'Hidden — DO NOT MOVE!'
      : '⚠️ Press [E] to HIDE!';
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
      gameBody.style.backgroundImage = "url('NightimeBalcony.png')";
      locationBanner.textContent = "📍 Royal Balcony (Exposed!)";
      pX = Math.round(window.innerWidth * 0.18);
      pY = Math.max(pY, 540);
      renderTaskMarkers();
      showEmote('!', 1800);
    }
  } else if (currentArea === 'balcony') {
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= Math.round(window.innerWidth * 0.12)) {
      currentArea = 'room';
      gameBody.style.backgroundImage = "url('NightimePrincessRoom.png')";
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

// Start Chapter 3 with excited-yet-nervous internal speech & rule setup!
renderTaskMarkers();
updateObjectiveHUD();
queueMonologue(
  [
    {
      text: 'Okay, deep breath... I\'m actually doing this! I get to see him tonight—my heart is literally racing!',
      emote: '♥'
    },
    {
      text: 'Okay, don\'t get ahead of yourself. If Father catches me sneaking out, I am SO dead... *gulp*.',
      emote: '💦'
    },
    {
      text: 'I have about 30 seconds before his patrol checks start, so I can get some tasks done first—just gotta hurry!',
      emote: '!'
    },
    {
      text: 'The more noise I make, the bigger the danger. If I get too loud, he\'ll hear and come check on me himself.',
      emote: '...'
    },
    {
      text: 'And I have to be super careful on the balcony—it\'s wide open outside with nowhere to hide if he looks!',
      emote: '💦'
    }
  ],
  beginGraceCountdownOnce
);

gameLoop();
