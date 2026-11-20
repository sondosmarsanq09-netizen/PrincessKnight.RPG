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
const arrowRight = document.getElementById('arrow-right');
const taskMarkersWrap = document.getElementById('task-markers');
const actionPrompt = document.getElementById('action-prompt');
const panicPrompt = document.getElementById('panic-prompt');

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
const normalSpeed = 6;
const panicSpeed = 2.8;
let currentArea = 'room'; // 'room' <-> 'balcony'
let isHiding = false;
let noiseLevel = 0;

// Escalation & Panic States
let isKingSus = false;
let isPanicking = false;
let breathsNeeded = 0;

// Dialogue Queue for Princess Monologue
let monologueQueue = [];
let isMonologueActive = false;
let patrolsUnlocked = false;
let initialGraceTimer = null;

// Patrol & Task State
let patrolState = 'idle'; // 'idle' | 'approaching' | 'checking' | 'dialogue' | 'scolding' | 'scold_result'
let patrolTimers = [];
let patrolCount = 0;
let pendingOutcome = null; // 'sus_panic' | 'reset_tasks' | 'normal'
let activeTask = null;
let timingAnimId = null;

const ANSWER_TIME_LIMIT = 8.0;
let answerCountdownInterval = null;
let answerTimeLeft = ANSWER_TIME_LIMIT;

// 3 Bedroom Tasks + 1 Multi-Round Hard Balcony Task (No escape rope)
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
    id: 'balcony_check',
    area: 'balcony',
    label: '🌙 Night-Air Signal Check (HARD)',
    xPct: 0.72,
    y: 560,
    done: false,
    hard: true
  }
];

function resetAllTasks() {
  tasks.forEach((t) => {
    t.done = false;
  });
  renderTaskMarkers();
  updateObjectiveHUD();
}

function getVisibleTasks() {
  const incomplete = tasks.filter((t) => !t.done);
  return incomplete.slice(0, 2);
}

const normalRoyalLines = [
  '"Knights, search every room down the hall! I will check the Princess\'s wing myself."',
  '"Keep watch by the courtyard till dawn. No one sneaks past tonight."',
  '"Hmm... thought I heard something rattle in here. Better stay sharp."'
];

const susRoyalLines = [
  '"Something feels off about the Princess tonight... way too sus. Keep an eye on her wing."',
  '"She claims she\'s sleeping, yet she\'s up at all hours... I don\'t buy it for a second."',
  '"Guards, stay alert! The Princess is acting suspiciously quiet in there."'
];

const caughtEncounter = {
  scold: '"Why are you still awake?! Go to bed right now!"',
  choices: [
    {
      text: '1. "I woke up for some warm tea."',
      safe: true,
      reply: '"Fine. Drink it and get to sleep... though I\'m keeping an eye on you."'
    },
    {
      text: '2. "Forgive me, Father—a nightmare woke me up."',
      safe: true,
      reply: '"A nightmare, huh...? Fine, rest now. Something about this feels off, though."'
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

// --- PANIC ATTACK & BREATHING SYSTEM ---
function startPanicAttack() {
  isPanicking = true;
  breathsNeeded = 3;
  worldLayer.classList.add('panic-blur');
  panicPrompt.classList.remove('hidden');
  panicPrompt.textContent = `😮‍💨 Gasping for air! Press [B] to breathe steadily (${breathsNeeded} left)`;
  showEmote('💦', 2500);
}

function performSteadyBreath() {
  if (!isPanicking) return;
  breathsNeeded--;
  if (breathsNeeded <= 0) {
    isPanicking = false;
    breathsNeeded = 0;
    worldLayer.classList.remove('panic-blur');
    panicPrompt.classList.add('hidden');
    showEmote('✨', 2000);
    queueMonologue([
      {
        text: 'In... and out... okay, I can breathe again. Don\'t pass out now, stay strong!',
        emote: '...'
      }
    ]);
  } else {
    panicPrompt.textContent = `😮‍💨 Inhale... exhale... Press [B] again (${breathsNeeded} left)`;
  }
}

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
  worldLayer.classList.remove('footstep-rumble');
  void worldLayer.offsetWidth;
  worldLayer.classList.add('footstep-rumble');
  playFootstepSound();
}

// --- NOISE SYSTEM ---
function addNoise(amount, reasonText) {
  const mult = isKingSus ? 1.35 : 1.0;
  noiseLevel = Math.min(100, noiseLevel + amount * mult);
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
  } else if (task.id === 'balcony_check') {
    // HARD MULTI-ROUND BALCONY TASK (3 rounds, faster speed, narrow window)
    const totalRounds = 3;
    let round = 1;
    let needlePos = 0;
    let dir = 1;
    const zoneStart = 44;
    const zoneWidth = 12;

    taskTitle.textContent = '🌙 Balcony Task (HARD): Night-Air Alignment';
    taskInstructions.textContent = 'Complete all 3 rounds! Lock the marker inside the narrow green zone each round.';

    taskBody.innerHTML = `
      <div style="margin-bottom:8px;font-size:13px;color:#ffd166;" id="round-progress">Round: 1 / ${totalRounds}</div>
      <div class="timing-bar">
        <div class="timing-zone" style="left:${zoneStart}%;width:${zoneWidth}%;"></div>
        <div class="timing-needle" id="timing-needle" style="left:0%;"></div>
      </div>
      <button class="timing-action-btn" id="lock-knot-btn">⚡ ALIGN SIGNAL [SPACE]</button>
    `;

    const needleEl = document.getElementById('timing-needle');
    const progEl = document.getElementById('round-progress');
    const lockBtn = document.getElementById('lock-knot-btn');

    function animateNeedle() {
      const roundSpeed = 2.1 + round * 0.65 + (isKingSus ? 0.45 : 0);
      needlePos += dir * roundSpeed;
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
        if (round < totalRounds) {
          round++;
          progEl.textContent = `Round: ${round} / ${totalRounds} — Faster now!`;
        } else {
          completeTask(task);
        }
      } else {
        // Missed round resets round progress & adds noise
        round = 1;
        progEl.textContent = `Round: 1 / ${totalRounds} — Slipped! Try again!`;
        addNoise(45, '"What was that sound out by the balcony?! Knights, check every room—I\'m checking on her!"');
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
  playCaughtSting();
  caughtFlash.classList.add('active');
  setTimeout(() => caughtFlash.classList.remove('active'), 550);

  patrolState = 'scold_result';
  pendingOutcome = 'reset_tasks';
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = '"Too slow! You\'re up to something! Guards—search her room and go through her stuff!"';
  cardFooter.classList.remove('hidden');
  cardFooter.textContent = '[Space / E / Click] Out of time (Tasks resetting)...';
}

function startKingPatrol(customCallout = null) {
  if (patrolState !== 'idle') return;
  clearPatrolTimers();
  closeTaskModal();

  patrolState = 'approaching';
  patrolAlert.classList.remove('hidden', 'danger');
  patrolText.textContent = isKingSus
    ? 'Suspicious King approaching fast...'
    : 'Footsteps & lantern approaching...';
  torchSweep.classList.add('active');
  showEmote('!', 2000);

  const stepGap = isKingSus ? 430 : 550;
  triggerFootstepPulse();
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 2));
  patrolTimers.push(setTimeout(triggerFootstepPulse, stepGap * 3));

  const checkDelay = stepGap * 3 + 300;
  patrolTimers.push(setTimeout(() => {
    patrolState = 'checking';
    patrolAlert.classList.add('danger');
    patrolText.textContent = currentArea === 'balcony'
      ? 'King checking room — you\'re safe on the balcony!'
      : 'Press [E] to HIDE!';
    kingShadowWrap.classList.remove('hidden');
    requestAnimationFrame(() => {
      kingShadowWrap.classList.add('visible');
    });
  }, checkDelay));

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('looking-in');
  }, checkDelay + 450));

  patrolTimers.push(setTimeout(() => {
    kingShadowWrap.classList.add('deep-scan');
    if (currentArea === 'room') {
      patrolText.textContent = 'He\'s looking in... STAY HIDDEN!';
    }
  }, checkDelay + 1600));

  patrolTimers.push(setTimeout(() => {
    patrolState = 'dialogue';
    pendingOutcome = 'normal';
    patrolAlert.classList.remove('danger');
    stopAnswerTimer();

    const pool = isKingSus ? susRoyalLines : normalRoyalLines;
    const line = customCallout || pool[patrolCount % pool.length];
    patrolCount++;

    royalDialogueCard.classList.remove('hidden', 'scolding');
    royalDialogueCard.classList.add('royal-gold');
    royalSpeaker.textContent = isKingSus ? '👑 KING (SUSPICIOUS)' : '👑 KING';
    royalLine.textContent = line;
    dialogueChoices.classList.add('hidden');
    cardFooter.classList.remove('hidden');
    cardFooter.textContent = '[Space / E / Click] Continue';
  }, checkDelay + 3100));
}

function triggerCaughtScolding() {
  clearPatrolTimers();
  closeTaskModal();
  patrolState = 'scolding';
  pendingOutcome = null;
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
  dialogueChoices.classList.add('hidden');
  royalLine.textContent = choice.reply;
  cardFooter.classList.remove('hidden');

  if (choice.safe) {
    isKingSus = true;
    susBadge.classList.remove('hidden');
    pendingOutcome = 'sus_panic';
    cardFooter.textContent = '[Space / E / Click] He bought it... for now';
  } else {
    pendingOutcome = 'reset_tasks';
    cardFooter.textContent = '[Space / E / Click] Guards searching your stuff...';
  }
}

function finishKingPatrol() {
  const outcome = pendingOutcome || 'normal';
  pendingOutcome = null;

  clearPatrolTimers();
  stopAnswerTimer();
  royalDialogueCard.classList.add('hidden');
  royalDialogueCard.classList.remove('scolding', 'royal-gold');
  dialogueChoices.classList.add('hidden');
  kingShadowWrap.classList.remove('visible', 'looking-in', 'deep-scan');
  torchSweep.classList.remove('active');
  patrolAlert.classList.add('hidden', 'danger');

  if (outcome === 'reset_tasks') {
    currentArea = 'room';
    worldLayer.style.backgroundImage = "url('NightimePrincessRoom.png')";
    locationBanner.textContent = "📍 Princess's Chambers";
    pX = window.innerWidth - 260;
    pY = 560;
    isHiding = false;
    princess.classList.remove('hidden-in-shadows');
    resetAllTasks();
    queueMonologue([
      {
        text: 'Ughhh no!! The guards went through everything and ruined my setup! I have to redo all my tasks from scratch...',
        emote: '💦'
      }
    ]);
  } else if (outcome === 'sus_panic') {
    startPanicAttack();
    queueMonologue([
      {
        text: 'He believed me... barely. Now he\'s suspicious of me—I can hear him muttering outside about how weird I\'m acting.',
        emote: '💦'
      },
      {
        text: 'I wish I just had freedom... I wish Father could actually see the good in me instead of locking me up like a prisoner.',
        emote: '...'
      }
    ]);
  } else if (isKingSus) {
    queueMonologue([
      {
        text: 'Ugh, he\'s still talking out there like I\'m some kind of suspect... I just want to breathe freely for once.',
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
  const intervalMs = isKingSus ? 12000 : 18000;
  patrolTimers.push(setTimeout(() => {
    if (patrolState === 'idle') {
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

  // [B] to steady breathing during panic attack
  if (k === 'b' && isPanicking) {
    performSteadyBreath();
    return;
  }

  if (k === 'escape' && activeTask) {
    closeTaskModal();
    return;
  }

  if (activeTask && activeTask.id === 'balcony_check' && k === ' ') {
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
    finishKingPatrol();
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
    if (currentArea === 'room') {
      isHiding = !isHiding;
      princess.classList.toggle('hidden-in-shadows', isHiding);
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
function gameLoop() {
  let pMoving = false;
  const activeSpeed = isPanicking ? panicSpeed : normalSpeed;
  const locked =
    isMonologueActive ||
    Boolean(activeTask) ||
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
      isHiding = false;
      princess.classList.remove('hidden-in-shadows');
    }
  }

  // Balcony is safe from getting caught! Only unhidden in the room triggers getting caught.
  if (patrolState === 'checking' && !isHiding && currentArea === 'room') {
    triggerCaughtScolding();
  }

  if (pY < 480) pY = 480;
  if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

  const nearTask = getNearbyTask();
  if (currentArea === 'balcony' && (patrolState === 'approaching' || patrolState === 'checking')) {
    actionPrompt.classList.remove('hidden');
    actionPrompt.textContent = '🌙 Safe on the Balcony while King checks!';
  } else if (patrolState === 'approaching' || patrolState === 'checking') {
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
      isHiding = false;
      princess.classList.remove('hidden-in-shadows');
      worldLayer.style.backgroundImage = "url('NightimeBalcony.png')";
      locationBanner.textContent = "📍 Royal Balcony (Safe Zone)";
      pX = Math.round(window.innerWidth * 0.18);
      pY = Math.max(pY, 540);
      renderTaskMarkers();
      showEmote('...', 1800);
    }
  } else if (currentArea === 'balcony') {
    if (arrowRight) arrowRight.style.display = 'none';

    if (pX <= Math.round(window.innerWidth * 0.12)) {
      currentArea = 'room';
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

// Start Chapter 3 with excited-yet-nervous internal speech & rule setup
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
      text: 'At least out on the balcony I\'m out of sight when he checks—though the night-air task out there takes 3 rounds!',
      emote: '💦'
    }
  ],
  beginGraceCountdownOnce
);

gameLoop();
