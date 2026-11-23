function removeFadeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeFadeOverlay);
setTimeout(removeFadeOverlay, 60);

// Optional carryover from Chapter 3 Scene 2
let ch4Carryover = {};
try {
  const raw = sessionStorage.getItem('ch4_carryover');
  if (raw) ch4Carryover = JSON.parse(raw) || {};
} catch (e) {}

const gameBody = document.getElementById('game-body');
const knight = document.getElementById('knight');
const knightBouquet = document.getElementById('knight-bouquet');
const princess = document.getElementById('princess');
const knightEmote = document.getElementById('knight-emotion');
const princessEmote = document.getElementById('princess-emotion');
const locationBanner = document.getElementById('location-banner');
const audioToggle = document.getElementById('audio-toggle');
const objectiveText = document.getElementById('objective');
const flowersLayer = document.getElementById('flowers-layer');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');
const edgeArrowLeft = document.getElementById('edge-arrow-left');
const edgeArrowRight = document.getElementById('edge-arrow-right');

const bouquetHud = document.getElementById('bouquet-hud');
const bouquetTitle = document.getElementById('bouquet-title');
const bouquetVisual = document.getElementById('bouquet-visual');
const bouquetFlowersList = document.getElementById('bouquet-flowers-list');

const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const dialogueChoices = document.getElementById('dialogue-choices');
const dialogueHint = document.getElementById('dialogue-hint');

// =========================================================
// SOUNDTRACKS & SOUND EFFECTS ENGINE (WEB AUDIO API)
// =========================================================
const SoundEngine = (() => {
  let ctx = null;
  let muted = false;
  let bgmTimer = null;
  let stepIndex = 0;
  let currentTrack = 'dawn'; // 'dawn' | 'romance'

  const DAWN_MELODY = [
    523.25, 659.25, 783.99, 659.25, // C5, E5, G5, E5
    587.33, 698.46, 880.00, 698.46, // D5, F5, A5, F5
    493.88, 587.33, 783.99, 587.33, // B4, D5, G5, D5
    523.25, 659.25, 783.99, 1046.50 // C5, E5, G5, C6
  ];

  const ROMANCE_MELODY = [
    659.25, 783.99, 987.77, 880.00, // E5, G5, B5, A5
    783.99, 659.25, 587.33, 659.25, // G5, E5, D5, E5
    523.25, 659.25, 783.99, 659.25, // C5, E5, G5, E5
    493.88, 587.33, 783.99, 987.77  // B4, D5, G5, B5
  ];

  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        ctx = new AudioCtx();
      }
    }
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function playTone(freq, duration = 0.25, type = 'sine', gainPeak = 0.06, delay = 0, slideTo = null) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const now = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(gainPeak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  function tickBgm() {
    if (muted || !ctx || ctx.state !== 'running') return;
    const seq = currentTrack === 'romance' ? ROMANCE_MELODY : DAWN_MELODY;
    const note = seq[stepIndex % seq.length];
    const wave = currentTrack === 'romance' ? 'sine' : 'triangle';
    const vol = currentTrack === 'romance' ? 0.032 : 0.024;
    playTone(note, 0.55, wave, vol, 0);
    stepIndex++;
  }

  function startBgmLoop() {
    if (bgmTimer) return;
    bgmTimer = setInterval(tickBgm, 560);
  }

  function setTrack(trackName) {
    if (currentTrack !== trackName) {
      currentTrack = trackName;
      stepIndex = 0;
    }
    ensureContext();
    startBgmLoop();
  }

  function unlock() {
    ensureContext();
    startBgmLoop();
  }

  function toggleMute() {
    muted = !muted;
    if (!muted) {
      ensureContext();
      startBgmLoop();
      playUiTick();
    }
    return muted;
  }

  function isMuted() {
    return muted;
  }

  // --- Sound Effects ---
  let lastStepAt = 0;
  function playFootstep() {
    if (muted) return;
    const nowMs = performance.now();
    if (nowMs - lastStepAt < 250) return;
    lastStepAt = nowMs;

    const pitch = 115 + Math.random() * 25;
    playTone(pitch, 0.065, 'triangle', 0.035, 0, pitch * 0.65);
  }

  function playUiTick() {
    playTone(620, 0.06, 'sine', 0.04, 0, 760);
  }

  function playChoiceChime() {
    playTone(587.33, 0.12, 'triangle', 0.055, 0);
    playTone(880.00, 0.18, 'sine', 0.05, 0.07);
  }

  function playFlowerPick() {
    playTone(523.25, 0.14, 'triangle', 0.07, 0);
    playTone(659.25, 0.14, 'triangle', 0.07, 0.07);
    playTone(783.99, 0.22, 'sine', 0.075, 0.14);
  }

  function playBouquetComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((n, i) => {
      playTone(n, 0.28, 'triangle', 0.075, i * 0.09);
    });
  }

  function playBlockedThud() {
    playTone(190, 0.14, 'sawtooth', 0.04, 0, 125);
  }

  function playPrincessCall() {
    playTone(783.99, 0.14, 'sine', 0.06, 0);
    playTone(987.77, 0.22, 'sine', 0.065, 0.11);
  }

  function playEndingCadence() {
    const chord = [523.25, 659.25, 783.99, 987.77, 1318.51];
    chord.forEach((n, i) => {
      playTone(n, 0.75, 'sine', 0.055, i * 0.14);
    });
  }

  return {
    unlock,
    setTrack,
    toggleMute,
    isMuted,
    playFootstep,
    playUiTick,
    playChoiceChime,
    playFlowerPick,
    playBouquetComplete,
    playBlockedThud,
    playPrincessCall,
    playEndingCadence
  };
})();

function syncAudioButton() {
  if (!audioToggle) return;
  const muted = SoundEngine.isMuted();
  audioToggle.textContent = muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
  audioToggle.classList.toggle('muted', muted);
}

if (audioToggle) {
  audioToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    SoundEngine.toggleMute();
    syncAudioButton();
  });
}

window.addEventListener('pointerdown', () => SoundEngine.unlock(), { passive: true });

// Lower-right < and > buttons inside dialogue-box
const navControls = document.createElement('div');
navControls.className = 'nav-controls';
const prevArrow = document.createElement('button');
prevArrow.type = 'button';
prevArrow.className = 'nav-arrow';
prevArrow.title = 'Previous Line';
prevArrow.textContent = '<';
const nextArrow = document.createElement('button');
nextArrow.type = 'button';
nextArrow.className = 'nav-arrow';
nextArrow.title = 'Next Line';
nextArrow.textContent = '>';
navControls.appendChild(prevArrow);
navControls.appendChild(nextArrow);
if (dialogueBox) dialogueBox.appendChild(navControls);

function getGroundBaselineY() {
  return Math.max(360, Math.round(window.innerHeight * 0.84));
}

function getMinWalkY() {
  return Math.max(320, getGroundBaselineY() - 52);
}

function getMaxWalkY() {
  return Math.min(window.innerHeight - 24, getGroundBaselineY() + 22);
}

let currentArea = 'flower_quest';

// Controlled Knight state (spawns in Meadow Clearing on the grass in the middle)
let kX = Math.round(window.innerWidth * 0.5) - 60;
let kY = getGroundBaselineY();
const speed = 6;
let inDialogue = false;
let storyEnded = false;

// Princess Spot state: walk in, Princess calls Knight over, then press [E] near her to talk
let princessCalledKnight = false;
let dateTalkFinished = false;
let canTalkToPrincess = false;
let popupTimeout = null;

// Princess state in PrincessTree.png (right side of the tree trunk, facing right)
let pX = Math.round(window.innerWidth * 0.34);
let pY = getGroundBaselineY();
let princessActive = false;

// Flowers Princess adores
const BOUQUET_GOAL = 5;
const FLOWER_TYPES = [
  { name: 'Hibiscus', icon: '🌺' },
  { name: 'Rose', icon: '🌹' },
  { name: 'Tulip', icon: '🌷' },
  { name: 'Azalea', icon: '🌸' },
  { name: 'Blossom', icon: '🌼' }
];

let collectedFlowers = [];
let activeFlowers = []; // { id, area, type, xRatio, yRatio, x, y, el }
let flowerIdCounter = 1;

function isBouquetComplete() {
  return collectedFlowers.length >= BOUQUET_GOAL;
}

// --- CLUSTERED BOUQUET IN KNIGHT'S HAND ---
function syncKnightHandBouquet() {
  if (!knightBouquet) return;
  if (collectedFlowers.length === 0) {
    knightBouquet.classList.add('hidden');
    knightBouquet.innerHTML = '';
    return;
  }

  knightBouquet.classList.remove('hidden');
  const slots = ['b1', 'b2', 'b3', 'b4', 'b5'];
  const bloomsHtml = collectedFlowers
    .slice(0, 5)
    .map((f, idx) => `<span class="bouquet-bloom ${slots[idx]}">${f.icon}</span>`)
    .join('');
  const ribbonHtml = isBouquetComplete()
    ? '<span class="bouquet-bloom bouquet-ribbon">🎀</span>'
    : '';

  knightBouquet.innerHTML = `<div class="bouquet-cluster-wrap">${bloomsHtml}${ribbonHtml}</div>`;
}

// --- OVERHEAD EMOTES & CALLOUT POPUP ---
let knightEmoteTimer = null;
let princessEmoteTimer = null;

function positionEmotesNow() {
  if (knight && knightEmote) {
    const clampedKX = Math.max(30, Math.min(window.innerWidth - 30, kX + 60));
    knightEmote.style.left = clampedKX + 'px';
    knightEmote.style.top = (kY - 155) + 'px';
  }
  if (princess && princessEmote) {
    const clampedPX = Math.max(30, Math.min(window.innerWidth - 30, pX + 48));
    princessEmote.style.left = clampedPX + 'px';
    princessEmote.style.top = (pY - 120) + 'px';
  }
}

function triggerEmote(target, symbol, extraDurationMs = 0) {
  const el = target === 'knight' ? knightEmote : princessEmote;
  if (!el) return;

  if (!symbol) {
    el.classList.add('hidden');
    return;
  }

  const totalMs = 1800 + extraDurationMs;
  const animName = extraDurationMs > 0 ? 'emote-pulse-fade-lingering' : 'emote-pulse-fade';

  positionEmotesNow();
  el.textContent = symbol;
  el.classList.remove('hidden');
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = `${animName} ${totalMs}ms ease-out forwards`;

  if (target === 'knight') {
    clearTimeout(knightEmoteTimer);
    knightEmoteTimer = setTimeout(() => el.classList.add('hidden'), totalMs);
  } else {
    clearTimeout(princessEmoteTimer);
    princessEmoteTimer = setTimeout(() => el.classList.add('hidden'), totalMs);
  }
}

function showCalloutPopup(message, targetX, targetY) {
  if (!actionPopup) return;
  actionPopup.textContent = message;
  actionPopup.style.left = targetX + 'px';
  actionPopup.style.top = targetY + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  void actionPopup.offsetWidth;
  actionPopup.style.animation = 'float-above 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

// --- EDGE ARROWS ---
function updateEdgeArrows() {
  if (!edgeArrowLeft || !edgeArrowRight) return;

  if (currentArea === 'flower_quest') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = isBouquetComplete()
      ? '◀ Princess Spot'
      : '◀ Princess Spot (Gift Needed)';
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Woodland Path ▶';
  } else if (currentArea === 'woodland_path') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = '◀ Meadow Clearing';
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Sunlit Grove ▶';
  } else if (currentArea === 'sunlit_grove') {
    edgeArrowLeft.classList.remove('hidden');
    edgeArrowLeft.textContent = '◀ Woodland Path';
    edgeArrowRight.classList.add('hidden');
  } else if (currentArea === 'princess_spot') {
    edgeArrowLeft.classList.add('hidden');
    edgeArrowRight.classList.remove('hidden');
    edgeArrowRight.textContent = 'Meadow Clearing ▶';
  }
}

// --- BOUQUET UI & GROUND FLOWERS ---
function updateBouquetUI() {
  const count = collectedFlowers.length;
  const done = isBouquetComplete();

  if (bouquetTitle) {
    bouquetTitle.textContent = done
      ? `Full Bouquet (${count}/${BOUQUET_GOAL})!`
      : `Bouquet: ${count} / ${BOUQUET_GOAL}`;
  }

  if (bouquetVisual) {
    if (count === 0) {
      bouquetVisual.textContent = '🎀';
    } else if (done) {
      bouquetVisual.textContent = `💐 ${collectedFlowers.map((f) => f.icon).join('')}`;
    } else {
      bouquetVisual.textContent = collectedFlowers.map((f) => f.icon).join('');
    }
  }

  if (bouquetFlowersList) {
    bouquetFlowersList.innerHTML = '';
    collectedFlowers.forEach((f) => {
      const chip = document.createElement('span');
      chip.className = 'collected-chip';
      chip.textContent = `${f.icon} ${f.name}`;
      bouquetFlowersList.appendChild(chip);
    });
  }

  if (bouquetHud) {
    bouquetHud.classList.toggle('completed', done);
  }

  syncKnightHandBouquet();

  if (objectiveText && !dateTalkFinished) {
    if (done) {
      objectiveText.textContent =
        'Objective: Bouquet gathered—walk left to the Princess Spot and walk up to her.';
    } else {
      objectiveText.textContent = `Objective: Gather a bouquet of blossoms she adores (${count}/${BOUQUET_GOAL}).`;
    }
  }
}

function pickFlowerTypeForBouquet() {
  const needed = FLOWER_TYPES.filter(
    (ft) => !collectedFlowers.some((cf) => cf.name === ft.name)
  );
  const pool = needed.length > 0 ? needed : FLOWER_TYPES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function layoutFlowerPosition(flowerObj) {
  flowerObj.x = Math.round(window.innerWidth * flowerObj.xRatio);
  const minY = getMinWalkY();
  const maxY = getMaxWalkY();
  flowerObj.y = Math.round(minY + flowerObj.yRatio * (maxY - minY));
  if (flowerObj.el) {
    flowerObj.el.style.left = flowerObj.x + 'px';
    flowerObj.el.style.top = flowerObj.y + 'px';
  }
}

function spawnFlowerInArea(area, customXRatio = null, customYRatio = null) {
  if (!flowersLayer || isBouquetComplete()) return null;

  const existingInArea = activeFlowers.filter((f) => f.area === area).length;
  if (existingInArea >= 2) return null;

  const type = pickFlowerTypeForBouquet();
  const xRatio =
    typeof customXRatio === 'number'
      ? customXRatio
      : 0.22 + Math.random() * 0.56;
  const yRatio =
    typeof customYRatio === 'number'
      ? customYRatio
      : 0.25 + Math.random() * 0.65;

  const el = document.createElement('div');
  el.className = 'ground-flower';
  el.style.display = area === currentArea ? 'flex' : 'none';
  el.innerHTML = `
    <span class="flower-icon">${type.icon}</span>
    <span class="flower-tag">${type.name}</span>
  `;

  flowersLayer.appendChild(el);

  const flowerObj = {
    id: flowerIdCounter++,
    area,
    type,
    xRatio,
    yRatio,
    x: 0,
    y: 0,
    el
  };
  layoutFlowerPosition(flowerObj);
  activeFlowers.push(flowerObj);
  return flowerObj;
}

function syncFlowersVisibility() {
  activeFlowers.forEach((f) => {
    layoutFlowerPosition(f);
    if (!f.el) return;
    f.el.style.display = f.area === currentArea && !isBouquetComplete() ? 'flex' : 'none';
  });

  if (!isBouquetComplete() && currentArea !== 'princess_spot') {
    const inCurrent = activeFlowers.filter((f) => f.area === currentArea).length;
    if (inCurrent < 2) {
      spawnFlowerInArea(currentArea);
    }
  }
}

function clearRemainingFlowers() {
  activeFlowers.forEach((f) => {
    if (f.el && f.el.parentNode) f.el.parentNode.removeChild(f.el);
  });
  activeFlowers = [];
}

function getNearbyFlower() {
  if (isBouquetComplete() || currentArea === 'princess_spot') return null;
  let closest = null;
  let bestDist = 115;

  activeFlowers.forEach((f) => {
    if (f.area !== currentArea) return;
    const dist = Math.hypot(kX + 60 - f.x, kY + 12 - f.y);
    if (dist < bestDist) {
      bestDist = dist;
      closest = f;
    }
  });

  return closest;
}

function collectFlower(flower) {
  if (!flower || isBouquetComplete()) return;

  const idx = activeFlowers.findIndex((f) => f.id === flower.id);
  if (idx !== -1) {
    activeFlowers.splice(idx, 1);
  }
  if (flower.el && flower.el.parentNode) {
    flower.el.parentNode.removeChild(flower.el);
  }

  collectedFlowers.push(flower.type);
  updateBouquetUI();
  triggerEmote('knight', flower.type.icon);

  if (isBouquetComplete()) {
    SoundEngine.playBouquetComplete();
    clearRemainingFlowers();
    startDialogue([
      {
        speaker: 'Knight',
        text: `“A ${flower.type.name} to complete the bouquet... hibiscus, roses, tulips, and azaleas gathered in the golden morning light.”`,
        knightEmote: '💐'
      },
      {
        speaker: 'Knight',
        text: '“She awaits beside the great tree to the left. I shall carry this bouquet over to her.”',
        knightEmote: '✨'
      }
    ]);
  } else {
    SoundEngine.playFlowerPick();
    spawnFlowerInArea(currentArea);
    startDialogue([
      {
        speaker: 'Knight',
        text: `“I have gathered a ${flower.type.name} (${collectedFlowers.length}/${BOUQUET_GOAL}). I will hold it carefully for her.”`,
        knightEmote: flower.type.icon
      }
    ]);
  }
}

// --- AREA SWITCHING ---
function syncPrincessTreePosition() {
  pX = Math.round(window.innerWidth * 0.34);
  pY = getGroundBaselineY();
  if (princess && princessActive) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.remove('hidden');
    princess.classList.add('facing-right');
    princess.classList.remove('facing-left');
    princess.classList.remove('running');
  }
}

function setArea(nextArea, nextX, nextY) {
  currentArea = nextArea;
  if (typeof nextX === 'number') kX = nextX;
  if (typeof nextY === 'number') kY = nextY;

  if (currentArea === 'flower_quest') {
    if (gameBody) gameBody.style.backgroundImage = "url('FlowerQuest.png')";
    if (locationBanner) locationBanner.textContent = '📍 Meadow Clearing';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
    SoundEngine.setTrack('dawn');
  } else if (currentArea === 'woodland_path') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower1.png')";
    if (locationBanner) locationBanner.textContent = '📍 Woodland Path';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
    SoundEngine.setTrack('dawn');
  } else if (currentArea === 'sunlit_grove') {
    if (gameBody) gameBody.style.backgroundImage = "url('LookingFlower2.png')";
    if (locationBanner) locationBanner.textContent = '📍 Sunlit Grove';
    princessActive = false;
    if (princess) princess.classList.add('hidden');
    SoundEngine.setTrack('dawn');
  } else if (currentArea === 'princess_spot') {
    if (gameBody) gameBody.style.backgroundImage = "url('PrincessTree.png')";
    if (locationBanner) locationBanner.textContent = '📍 Princess Spot';
    princessActive = true;
    syncPrincessTreePosition();
    SoundEngine.setTrack('romance');

    // Let the player walk up while the Princess calls the Knight over
    if (!princessCalledKnight) {
      princessCalledKnight = true;
      if (objectiveText) {
        objectiveText.textContent = 'Objective: Walk over to the Princess and speak with her [E].';
      }
      setTimeout(() => {
        if (currentArea === 'princess_spot' && princessActive) {
          SoundEngine.playPrincessCall();
          triggerEmote('princess', '💕');
          triggerEmote('knight', '❗');
          showCalloutPopup('Sir Knight! Over here!', pX + 48, pY - 150);
        }
      }, 220);
    }
  }

  syncFlowersVisibility();
  updateEdgeArrows();
}

// --- CHAT DIALOGUE ENGINE (CHAPTER 2 SCENE 3 STYLE) ---
let currentNodes = [];
let nodeIndex = 0;
let waitingForChoice = false;
let onDialogueFinish = null;

function startDialogue(nodes, onFinish = null) {
  inDialogue = true;
  currentNodes = nodes;
  nodeIndex = 0;
  onDialogueFinish = onFinish;
  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  renderNode();
}

function renderNode() {
  const node = currentNodes[nodeIndex];
  if (!node) {
    closeDialogue();
    return;
  }

  if (typeof node.onShow === 'function') {
    node.onShow();
  }

  dialogueBox.classList.remove('hidden');

  const speakerLower = (node.speaker || '').toLowerCase();
  const isPrincess = speakerLower.includes('princess');
  dialogueSpeaker.className = 'dialogue-speaker';
  if (isPrincess) {
    dialogueSpeaker.classList.add('princess-speak');
    dialogueSpeaker.textContent = 'Princess';
  } else {
    dialogueSpeaker.textContent = 'Knight';
  }

  dialogueText.textContent = node.text;

  if (node.knightEmote !== undefined) {
    triggerEmote('knight', node.knightEmote, node.knightEmoteDuration || 0);
  }
  if (node.princessEmote !== undefined) {
    triggerEmote('princess', node.princessEmote, node.princessEmoteDuration || 0);
  }

  if (princessActive && princess) {
    princess.classList.add('facing-right');
    princess.classList.remove('facing-left');
    if (pX < kX) {
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    } else {
      knight.classList.add('facing-right');
      knight.classList.remove('facing-left');
    }
  }

  dialogueChoices.innerHTML = '';

  if (node.choices && node.choices.length > 0) {
    waitingForChoice = true;
    dialogueChoices.classList.remove('hidden');
    navControls.style.display = 'none';
    dialogueHint.textContent = 'Choose a response (click or press [1] / [2] / [3])';

    node.choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.textContent = choice.label;
      btn.addEventListener('click', () => selectChoice(choice));
      dialogueChoices.appendChild(btn);
    });
  } else {
    waitingForChoice = false;
    dialogueChoices.classList.add('hidden');
    navControls.style.display = 'flex';
    prevArrow.disabled = nodeIndex === 0;
    dialogueHint.textContent = 'Press [E] / [Space] or > to continue';
  }
}

function selectChoice(choice) {
  if (!waitingForChoice) return;
  waitingForChoice = false;
  dialogueChoices.classList.add('hidden');
  SoundEngine.playChoiceChime();

  if (choice.knightEmote !== undefined) {
    triggerEmote('knight', choice.knightEmote, choice.knightEmoteDuration || 0);
  }
  if (choice.princessEmote !== undefined) {
    triggerEmote('princess', choice.princessEmote, choice.princessEmoteDuration || 0);
  }

  if (choice.followUp && choice.followUp.length > 0) {
    currentNodes.splice(nodeIndex + 1, 0, ...choice.followUp);
  }
  nodeIndex++;
  renderNode();
}

function advanceDialogue() {
  if (!inDialogue || waitingForChoice) return;
  SoundEngine.playUiTick();
  nodeIndex++;
  if (nodeIndex >= currentNodes.length) {
    closeDialogue();
  } else {
    renderNode();
  }
}

function rewindDialogue() {
  if (!inDialogue || waitingForChoice || nodeIndex <= 0) return;
  SoundEngine.playUiTick();
  nodeIndex--;
  renderNode();
}

prevArrow.addEventListener('click', rewindDialogue);
nextArrow.addEventListener('click', advanceDialogue);

function closeDialogue() {
  dialogueBox.classList.add('hidden');
  dialogueChoices.innerHTML = '';
  dialogueChoices.classList.add('hidden');
  inDialogue = false;
  waitingForChoice = false;

  const cb = onDialogueFinish;
  onDialogueFinish = null;
  if (typeof cb === 'function') cb();
}

function blockPrincessSpotEntry() {
  kX = 85;
  knight.classList.remove('facing-left');
  knight.classList.add('facing-right');
  SoundEngine.playBlockedThud();
  triggerEmote('knight', '💐');

  startDialogue([
    {
      speaker: 'Knight',
      text: '“I cannot walk to her empty-handed on such a morning. I should gather a full bouquet of flowers she loves—hibiscus, roses, tulips, azaleas—before going to her.”',
      knightEmote: '🌷'
    }
  ]);
}

function showEndingScreen() {
  storyEnded = true;
  SoundEngine.setTrack('romance');
  SoundEngine.playEndingCadence();
  if (edgeArrowLeft) edgeArrowLeft.classList.add('hidden');
  if (edgeArrowRight) edgeArrowRight.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        text-align: center;
        padding: 24px;
        color: #fdf6e2;
        font-family: 'Press Start 2P', monospace;
      ">
        <div style="font-size: clamp(22px, 3.6vw, 40px); letter-spacing: 3px; color: #f7cad0; text-shadow: 0 4px 18px rgba(247, 202, 208, 0.35);">
          ~ The End ~
        </div>
        <div style="max-width: 620px; font-family: monospace; font-size: 16px; line-height: 1.7; color: #f5ebd6; opacity: 0.92;">
          Beneath the golden boughs of the Great Tree, with hibiscus, roses, tulips, and azaleas in hand, their secret morning finally belonged to them alone.
        </div>
        <div style="font-size: 24px; margin-top: 6px;">💐 💕 🌅</div>
      </div>
    `;
    overlay.classList.add('active');
  }
}

const princessDateEncounterNodes = [
  {
    speaker: 'Princess',
    text: '“You truly came with the first light of dawn... and bearing so lovely a bouquet. Hibiscus, roses, tulips, and azaleas—how did you remember every bloom my heart favors?”',
    princessEmote: '🥰',
    knightEmote: '😳'
  },
  {
    speaker: 'Knight',
    text: '“How could I ever forget what brings light to your eyes, Your Highness? Every step through the dew was worth it.”',
    knightEmote: '💐',
    princessEmote: '💕',
    choices: [
      {
        label: '1. (Tender & earnest) "No courtly vow has ever felt half as true as standing beside you at sunrise."',
        knightEmote: '💘',
        princessEmote: '😍',
        followUp: [
          {
            speaker: 'Princess',
            text: '“Careful, Sir Knight... speak so softly in the morning light and I shall forget every lesson in royal composure.”',
            princessEmote: '😘',
            knightEmote: '💓'
          }
        ]
      },
      {
        label: '2. (A little flustered) "I only hoped the ribbon would hold until I reached your tree..."',
        knightEmote: '😅',
        princessEmote: '😊',
        followUp: [
          {
            speaker: 'Princess',
            text: '“It is the dearest gift I have ever held. Every petal still carries the morning chill.”',
            princessEmote: '💖',
            knightEmote: '😳'
          }
        ]
      },
      {
        label: '3. (Quietly devoted) "No castle walls, no midnight curfews—only you, me, and the open sky."',
        knightEmote: '❤️',
        princessEmote: '🥰',
        followUp: [
          {
            speaker: 'Princess',
            text: '“At long last, no borrowed minutes in the dark. Just sunrise, this tree, and you.”',
            princessEmote: '💋',
            princessEmoteDuration: 300,
            knightEmote: '😳',
            knightEmoteDuration: 300
          }
        ]
      }
    ]
  },
  {
    speaker: 'Princess',
    text: '“All night behind those stone walls, I kept listening for footsteps—wondering if morning would ever truly arrive.”',
    princessEmote: '🥺',
    knightEmote: '💗'
  },
  {
    speaker: 'Knight',
    text: '“Here, Your Highness—take the bouquet. Let me stand a little closer so the morning breeze does not chill you.”',
    knightEmote: '💐',
    princessEmote: '💕',
    onShow: () => {
      kX = pX + 102;
      if (knightBouquet) knightBouquet.classList.add('hidden');
    }
  },
  {
    speaker: 'Princess',
    text: '*She cradles the blossoms against her chest, steps in close beside his armor, and rests her head softly against his shoulder as the golden leaves sway above them.*',
    princessEmote: '🥰',
    princessEmoteDuration: 400,
    knightEmote: '💓',
    knightEmoteDuration: 400,
    choices: [
      {
        label: '1. (Hold her hand gently) "I am right here, my Princess. Nowhere else in the realm would I rather be."',
        knightEmote: '❤️',
        princessEmote: '💕',
        followUp: [
          {
            speaker: 'Princess',
            text: '“Then stay right here with me a little longer... before the world wakes and remembers who we are.”',
            princessEmote: '💋',
            princessEmoteDuration: 400,
            knightEmote: '😳',
            knightEmoteDuration: 400
          }
        ]
      },
      {
        label: '2. (Whisper softly) "Even in full plate armor, my heart has never beaten faster than it does right now."',
        knightEmote: '💓',
        princessEmote: '😍',
        followUp: [
          {
            speaker: 'Princess',
            text: '“Then let it beat for us alone this morning, Sir Knight. Today belongs to no crown—only to you and me.”',
            princessEmote: '💖',
            princessEmoteDuration: 400,
            knightEmote: '❤️',
            knightEmoteDuration: 400
          }
        ]
      }
    ]
  },
  {
    speaker: 'Knight',
    text: '“Forever at your side, Your Highness. Happy sunrise.”',
    knightEmote: '💕',
    knightEmoteDuration: 600,
    princessEmote: '💕',
    princessEmoteDuration: 600
  }
];

function startPrincessDateTalk() {
  if (inDialogue || storyEnded) return;
  canTalkToPrincess = false;
  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  dateTalkFinished = true;
  if (objectiveText) {
    objectiveText.textContent = 'Objective: Share your sunrise moment beneath the Great Tree.';
  }
  SoundEngine.playChoiceChime();
  startDialogue(princessDateEncounterNodes, () => {
    setTimeout(showEndingScreen, 650);
  });
}

// --- CONTROLS ---
const keys = {};

window.addEventListener('keydown', (e) => {
  SoundEngine.unlock();
  if (storyEnded) return;
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (inDialogue) {
    if (waitingForChoice) {
      const btns = dialogueChoices.querySelectorAll('.choice-btn');
      if (k === '1' && btns[0]) btns[0].click();
      if (k === '2' && btns[1]) btns[1].click();
      if (k === '3' && btns[2]) btns[2].click();
    } else if (k === 'e' || k === ' ') {
      advanceDialogue();
    }
    return;
  }

  if (k === 'e') {
    if (currentArea === 'princess_spot' && canTalkToPrincess) {
      startPrincessDateTalk();
      return;
    }

    const nearFlower = getNearbyFlower();
    if (nearFlower) {
      collectFlower(nearFlower);
    }
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

window.addEventListener('resize', () => {
  kY = Math.max(getMinWalkY(), Math.min(getMaxWalkY(), kY));
  syncFlowersVisibility();
  if (princessActive) syncPrincessTreePosition();
});

// --- INITIAL SETUP ---
setArea('flower_quest', kX, kY);
syncAudioButton();
updateBouquetUI();
spawnFlowerInArea('flower_quest', 0.72, 0.55);
spawnFlowerInArea('woodland_path', 0.42, 0.65);
spawnFlowerInArea('woodland_path', 0.74, 0.45);
spawnFlowerInArea('sunlit_grove', 0.36, 0.60);
spawnFlowerInArea('sunlit_grove', 0.68, 0.50);

setTimeout(() => {
  startDialogue([
    {
      speaker: 'Knight',
      text: '“Sunrise has broken over the meadow. Before I go to her on the left, I must find a gift—a full bouquet of flowers she likes.”',
      knightEmote: '🌺'
    }
  ]);
}, 120);

function gameLoop() {
  let kMoving = false;

  if (!inDialogue && !storyEnded) {
    if (keys['w'] || keys['arrowup']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      kY += speed;
      kMoving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d'] || keys['arrowright']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    const minY = getMinWalkY();
    const maxY = getMaxWalkY();
    if (kY < minY) kY = minY;
    if (kY > maxY) kY = maxY;

    if (kMoving) {
      SoundEngine.playFootstep();
    }

    // Map transitions:
    // Meadow Clearing (left -> Princess Spot, right -> Woodland Path from left)
    // Woodland Path (left -> Meadow Clearing, right -> Sunlit Grove from left)
    // Sunlit Grove (left -> Woodland Path)
    // Princess Spot (right -> Meadow Clearing)
    if (currentArea === 'flower_quest') {
      if (kX <= 45) {
        if (!isBouquetComplete()) {
          blockPrincessSpotEntry();
        } else {
          SoundEngine.playUiTick();
          setArea('princess_spot', Math.round(window.innerWidth * 0.72), getGroundBaselineY());
          knight.classList.add('facing-left');
          knight.classList.remove('facing-right');
        }
      } else if (kX >= window.innerWidth - 130) {
        SoundEngine.playUiTick();
        setArea('woodland_path', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    } else if (currentArea === 'woodland_path') {
      if (kX <= 45) {
        SoundEngine.playUiTick();
        setArea('flower_quest', window.innerWidth - 170, getGroundBaselineY());
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');
      } else if (kX >= window.innerWidth - 130) {
        SoundEngine.playUiTick();
        setArea('sunlit_grove', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    } else if (currentArea === 'sunlit_grove') {
      if (kX <= 45) {
        SoundEngine.playUiTick();
        setArea('woodland_path', window.innerWidth - 170, getGroundBaselineY());
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');
      }
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    } else if (currentArea === 'princess_spot') {
      if (kX < pX + 95) kX = pX + 95;
      if (kX >= window.innerWidth - 130) {
        SoundEngine.playUiTick();
        setArea('flower_quest', 90, getGroundBaselineY());
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    }
  }

  // Interaction prompts: Talk to Princess or Pick Flower
  canTalkToPrincess = false;
  const nearFlower = getNearbyFlower();

  if (interactionPrompt) {
    if (
      currentArea === 'princess_spot' &&
      princessActive &&
      !inDialogue &&
      !storyEnded &&
      Math.hypot(kX - pX, kY - pY) < 210
    ) {
      canTalkToPrincess = true;
      interactionPrompt.textContent = 'Press [E] to Speak with the Princess';
      interactionPrompt.classList.remove('hidden');
    } else if (nearFlower && !inDialogue && !storyEnded) {
      interactionPrompt.textContent = `Press [E] to Pick ${nearFlower.type.icon} ${nearFlower.type.name}`;
      interactionPrompt.classList.remove('hidden');
    } else {
      interactionPrompt.classList.add('hidden');
    }
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';
    knight.classList.toggle('running', kMoving);
  }

  if (princess && princessActive) {
    syncPrincessTreePosition();
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
