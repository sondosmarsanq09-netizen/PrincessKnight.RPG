function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  removeOverlay();
  if (window.GameAudio) {
    isMuted = window.GameAudio.isMuted();
    syncAudioToggleLabel();
    window.GameAudio.start('683268__migfus20__relaxing-chiptune-music.mp3', 0.14);
  }
});
window.addEventListener('load', removeOverlay);
setTimeout(removeOverlay, 50);
setTimeout(removeOverlay, 400);

const gameBody = document.getElementById('game-body');
const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowRight = document.getElementById('arrow-right');
const taskMarker = document.getElementById('task-marker');
const interactionPrompt = document.getElementById('interaction-prompt');
const actionPopup = document.getElementById('action-popup');
const audioToggleBtn = document.getElementById('audio-toggle');

// --- CH3 STYLE WEB AUDIO SFX ---
let audioCtx = null;
let isMuted = false;
let stepToggle = false;
let runStrideStartMs = null;
let lastStepStamp = -1;

const STRIDE_CYCLE_MS = 850;
const STEP_PHASES = [0.22, 0.72];

function getAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function unlockAudio() {
  const ctx = getAudioCtx();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  if (window.GameAudio) {
    window.GameAudio.start('683268__migfus20__relaxing-chiptune-music.mp3', 0.14);
  }
}

function syncAudioToggleLabel() {
  if (!audioToggleBtn) return;
  audioToggleBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
}

function playSoftStepSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    stepToggle = !stepToggle;

    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    const baseFreq = stepToggle ? 140 : 155;
    thudOsc.frequency.setValueAtTime(baseFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(52, now + 0.085);

    thudGain.gain.setValueAtTime(0.001, now);
    thudGain.gain.linearRampToValueAtTime(0.105, now + 0.008);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.095);

    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(stepToggle ? 400 : 450, now);
    tapOsc.frequency.exponentialRampToValueAtTime(195, now + 0.045);
    tapGain.gain.setValueAtTime(0.001, now);
    tapGain.gain.linearRampToValueAtTime(0.038, now + 0.005);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start(now);
    tapOsc.stop(now + 0.055);
  } catch (e) {}
}

function playSilverClinkSound(loud = false) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [loud ? 1180 : 1420, loud ? 890 : 1780].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.05);
      gain.gain.setValueAtTime(loud ? 0.12 : 0.07, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.23);
    });
  } catch (e) {}
}

function playPorcelainChimeSound(loud = false) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(loud ? 520 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(loud ? 180 : 660, now + 0.28);
    gain.gain.setValueAtTime(loud ? 0.14 : 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);
  } catch (e) {}
}

function playSuccessChime() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.1, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.33);
    });
  } catch (e) {}
}

function playBreathSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.35);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.37);
  } catch (e) {}
}

function playCaughtSting() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
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

function updateStrideFootsteps(isMoving, nowMs) {
  if (!isMoving) {
    runStrideStartMs = null;
    lastStepStamp = -1;
    return;
  }
  if (runStrideStartMs === null) {
    runStrideStartMs = nowMs;
    lastStepStamp = -1;
  }
  const elapsed = nowMs - runStrideStartMs;
  const cycle = Math.floor(elapsed / STRIDE_CYCLE_MS);
  const phase = (elapsed % STRIDE_CYCLE_MS) / STRIDE_CYCLE_MS;

  STEP_PHASES.forEach((targetPhase, idx) => {
    const stamp = cycle * 10 + idx;
    if (phase >= targetPhase && stamp > lastStepStamp) {
      lastStepStamp = stamp;
      playSoftStepSound();
    }
  });
}

if (audioToggleBtn) {
  syncAudioToggleLabel();
  audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAudio();
    isMuted = !isMuted;
    if (window.GameAudio) window.GameAudio.setMuted(isMuted);
    syncAudioToggleLabel();
  });
}

let kX = 400;
let kY = 560;
const speed = 6;
let currentArea = 'hall';

let pX = window.innerWidth + 120;
let pY = 560;
let princessActive = false;
let princessWalkingToRightSpot = false;
let princessReadyToTalk = false;
let princessWalkingAway = false;
let princessTurnedBack = false;

let inDialogue = false;
let sceneComplete = false;
let isFadingOut = false;

let sceneStage = 0;
let canInteract = false;
let popupTimeout = null;

const knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

const princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

const thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

const dialogueBox = document.getElementById('dialogue-box');
const dialogueSpeaker = document.getElementById('dialogue-speaker');
const dialogueText = document.getElementById('dialogue-text');
const dialogueChoices = document.getElementById('dialogue-choices');
const dialogueHint = document.getElementById('dialogue-hint');

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

let knightEmoteTimer = null;
let princessEmoteTimer = null;

function positionEmotesNow() {
  if (knight && knightEmote) {
    const clampedKX = Math.max(30, Math.min(window.innerWidth - 30, kX + 60));
    knightEmote.style.left = clampedKX + 'px';
    knightEmote.style.top = (kY - 165) + 'px';
  }
  if (princess && princessEmote) {
    const clampedPX = Math.max(30, Math.min(window.innerWidth - 30, pX + 48));
    princessEmote.style.left = clampedPX + 'px';
    princessEmote.style.top = (pY - 125) + 'px';
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

function showActionFeedback(message, targetX = kX + 60, targetY = kY - 185) {
  if (!actionPopup) return;
  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = targetX + 'px';
  actionPopup.style.top = targetY + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

function fadeOutEndOfChapter(nextUrl = 'CH3.html') {
  if (isFadingOut) return;
  isFadingOut = true;

  playSuccessChime();
  if (window.GameAudio) window.GameAudio.prepareSceneTransition();
  if (interactionPrompt) interactionPrompt.classList.add('hidden');
  if (taskMarker) taskMarker.classList.add('hidden');
  if (thoughtBox) thoughtBox.classList.add('hidden');
  if (dialogueBox) dialogueBox.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.style.pointerEvents = 'auto';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        overlay.classList.add('active');
      });
    });

    if (nextUrl) {
      setTimeout(() => {
        window.location.href = nextUrl;
      }, 1500);
    }
  } else if (nextUrl) {
    window.location.href = nextUrl;
  }
}

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
  if (taskMarker) taskMarker.classList.add('hidden');
  renderNode();
}

function renderNode() {
  const node = currentNodes[nodeIndex];
  if (!node) {
    closeDialogue();
    return;
  }

  if (dialogueBox) dialogueBox.classList.remove('hidden');

  const speakerLower = (node.speaker || '').toLowerCase();
  const isPrincess = speakerLower.includes('princess');
  if (dialogueSpeaker) {
    dialogueSpeaker.className = 'dialogue-speaker';
    if (isPrincess) {
      dialogueSpeaker.classList.add('princess-speak');
      dialogueSpeaker.textContent = 'Princess';
    } else {
      dialogueSpeaker.textContent = 'Knight';
    }
  }

  if (thoughtBox) {
    if (node.thought && isPrincess) {
      thoughtBox.textContent = node.thought;
      thoughtBox.classList.remove('hidden');
    } else {
      thoughtBox.classList.add('hidden');
    }
  }

  if (dialogueText) dialogueText.textContent = node.text;

  if (node.knightEmote !== undefined) {
    triggerEmote('knight', node.knightEmote, node.knightEmoteDuration || 0);
  }
  if (node.princessEmote !== undefined) {
    triggerEmote('princess', node.princessEmote, node.princessEmoteDuration || 0);
  }

  if (princessActive && princess && knight && !princessWalkingAway) {
    if (pX < kX) {
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
      princess.classList.add('facing-right');
      princess.classList.remove('facing-left');
    } else {
      knight.classList.add('facing-right');
      knight.classList.remove('facing-left');
      princess.classList.add('facing-left');
      princess.classList.remove('facing-right');
    }
  }

  if (dialogueChoices) dialogueChoices.innerHTML = '';

  if (node.choices && node.choices.length > 0 && dialogueChoices) {
    waitingForChoice = true;
    dialogueChoices.classList.remove('hidden');
    navControls.style.display = 'none';
    if (dialogueHint) dialogueHint.textContent = "Choose a response (click or press [1] / [2] / [3])";

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
    if (dialogueChoices) dialogueChoices.classList.add('hidden');
    navControls.style.display = 'flex';
    prevArrow.disabled = nodeIndex === 0;
    if (dialogueHint) dialogueHint.textContent = "Press [E] / [Space] or > to continue";
  }
}

function selectChoice(choice) {
  if (!waitingForChoice) return;
  waitingForChoice = false;
  if (dialogueChoices) dialogueChoices.classList.add('hidden');
  playPorcelainChimeSound(false);

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
  nodeIndex++;
  if (nodeIndex >= currentNodes.length) {
    closeDialogue();
  } else {
    renderNode();
  }
}

function rewindDialogue() {
  if (!inDialogue || waitingForChoice || nodeIndex <= 0) return;
  nodeIndex--;
  renderNode();
}

prevArrow.addEventListener('click', rewindDialogue);
nextArrow.addEventListener('click', advanceDialogue);

function closeDialogue() {
  if (dialogueBox) dialogueBox.classList.add('hidden');
  if (thoughtBox) thoughtBox.classList.add('hidden');
  if (dialogueChoices) {
    dialogueChoices.innerHTML = '';
    dialogueChoices.classList.add('hidden');
  }
  inDialogue = false;
  waitingForChoice = false;

  const cb = onDialogueFinish;
  onDialogueFinish = null;
  if (cb) cb();
}

const openingFootstepsNodes = [
  {
    speaker: "Knight",
    text: "“Footsteps beyond the hall... yet no watchman is assigned to the garden at this hour. I had best see who walks there.”",
    knightEmote: "👀"
  }
];

const gardenEncounterNodes = [
  {
    speaker: "Princess",
    text: "“How swift of you to answer the call. Tell me, Knight—do you patrol the garden by duty, or did your steps quicken hoping it was I who awaited?”",
    thought: "(Knight's Internal) She stands there like she commands the very wind. Why does my chest tighten every time she turns that gaze on me?",
    princessEmote: "😏",
    knightEmote: "😳"
  },
  {
    speaker: "Knight",
    text: "“Your Highness—forgive me. I heard movement and came at once to ensure no harm had befallen the garden.”",
    knightEmote: "😅",
    princessEmote: "✨"
  },
  {
    speaker: "Princess",
    text: "“Spare me the rehearsed caution. I grow weary of seeing you only as a shadow behind iron. Tonight, you will escort me—a proper outing, away from courtly eyes.”",
    thought: "(Knight's Internal) A... an outing? With me? My wits have deserted me entirely.",
    princessEmote: "😘",
    knightEmote: "😮",
    choices: [
      {
        label: "1. (Flustered & devoted) \"An outing... with me? Your Highness, I—yes. Name the hour, and I shall be there.\"",
        knightEmote: "😳",
        princessEmote: "🥰",
        followUp: [
          {
            speaker: "Princess",
            text: "“Bold words for a man whose pulse I can practically hear through his breastplate. Do not dare keep me waiting.”",
            thought: "(Knight's Internal) She caught me off guard again. At this rate, my armor won't hide a thing.",
            princessEmote: "🔥",
            knightEmote: "💓"
          }
        ]
      },
      {
        label: "2. (Trying to sound composed, failing) \"If it is your wish, Your Highness... I accept the charge. Strictly as your guard, of course.\"",
        knightEmote: "💦",
        princessEmote: "😊",
        followUp: [
          {
            speaker: "Princess",
            text: "“'Strictly as my guard'? How terribly convincing—especially with color rising to your ears. Play whatever role you like tonight.”",
            thought: "(Knight's Internal) She sees right through me. Every ounce of my composure just vanished.",
            princessEmote: "💖",
            knightEmote: "😳"
          }
        ]
      },
      {
        label: "3. (Quietly intense) \"You have no idea how long I have wished to hear you ask that, Your Highness.\"",
        knightEmote: "💘",
        princessEmote: "😍",
        followUp: [
          {
            speaker: "Princess",
            text: "“Careful, Knight... speak with that much conviction and I may hold you to far more than a simple walk tonight.”",
            thought: "(Knight's Internal) Her eyes held mine a second too long. My heart is hammering against my ribs.",
            princessEmote: "✨",
            knightEmote: "❤️"
          }
        ]
      }
    ]
  },
  {
    speaker: "Knight",
    text: "“Listen closely, Your Highness. Slip away late tonight—no guards are posted in the chambers or the library at that hour, so your path will be clear.”",
    knightEmote: "🎯",
    princessEmote: "😉"
  },
  {
    speaker: "Knight",
    text: "“Yet tread lightly near the royal wing: the King will be in his chambers then. The guards withdraw solely to grant him privacy—one careless sound could undo us both.”",
    knightEmote: "🤫",
    princessEmote: "😏"
  },
  {
    speaker: "Princess",
    text: "“No guards in the chambers or the library, and the King keeping his privacy... then the path is already half-won. I shall slip past unseen.”",
    thought: "(Knight's Internal) She speaks of treasonous night walks like a royal decree. I am completely in over my head.",
    princessEmote: "💘",
    knightEmote: "💓"
  }
];

const princessTurnBackKissNodes = [
  {
    speaker: "Princess",
    text: "“Do not miss me too sorely before tonight, Sir Knight.”",
    thought: "(Knight's Internal) She turned back... and left a kiss right there! My head is spinning!",
    princessEmote: "💋",
    princessEmoteDuration: 300,
    knightEmote: "😳",
    knightEmoteDuration: 300
  }
];

const knightAfterDeparturePanicNodes = [
  {
    speaker: "Knight",
    text: "“Good heavens... by the oath of my blade, she kissed me! A royal kiss—right in the garden—and now she expects me to spirit her past the King's chambers tonight!”",
    knightEmote: "😱"
  },
  {
    speaker: "Knight",
    text: "“My helm feels far too warm for sanity! No watch in the library or chambers, the King in his rooms... if we are discovered, my head will roll before dawn!”",
    knightEmote: "😰"
  }
];

function enterRoyalGardenFromLeft() {
  currentArea = 'garden';
  sceneStage = 1;

  if (arrowRight) arrowRight.style.display = 'none';
  if (gameBody) gameBody.style.backgroundImage = "url('RoyalGarden.png')";
  if (locationBanner) locationBanner.textContent = "📍 Royal Garden";

  kX = 70;
  kY = 560;
  if (knight) {
    knight.classList.add('facing-right');
    knight.classList.remove('facing-left');
  }

  princessActive = true;
  princessWalkingToRightSpot = true;
  princessReadyToTalk = false;
  princessWalkingAway = false;
  princessTurnedBack = false;
  pX = window.innerWidth + 60;
  pY = 560;
  if (princess) {
    princess.classList.remove('hidden');
    princess.classList.add('facing-left');
    princess.classList.remove('facing-right');
  }

  if (objectiveText) {
    objectiveText.textContent = "Objective: Someone stepped into the right side of the garden...";
  }
}

function triggerEncounterDialogue() {
  sceneStage = 2;
  princessReadyToTalk = false;
  canInteract = false;
  playBreathSound();
  if (taskMarker) taskMarker.classList.add('hidden');
  if (interactionPrompt) interactionPrompt.classList.add('hidden');

  startDialogue(gardenEncounterNodes, () => {
    sceneStage = 3;
    princessWalkingAway = true;
    princessTurnedBack = false;
    if (princess) {
      princess.classList.remove('facing-left');
      princess.classList.add('facing-right');
    }
    if (objectiveText) {
      objectiveText.textContent = "Objective: Watch the Princess take her leave...";
    }
  });
}

if (gameBody) gameBody.style.backgroundImage = "url('PolishDragon.png')";
if (locationBanner) locationBanner.textContent = "📍 Dragon's Hall";
if (objectiveText) objectiveText.textContent = "Objective: Footsteps outside—walk right to check who is in the Royal Garden.";

setTimeout(() => {
  startDialogue(openingFootstepsNodes);
}, 300);

const keys = {};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (inDialogue) {
    if (waitingForChoice && dialogueChoices) {
      const btns = dialogueChoices.querySelectorAll('.choice-btn');
      if (k === '1' && btns[0]) btns[0].click();
      if (k === '2' && btns[1]) btns[1].click();
      if (k === '3' && btns[2]) btns[2].click();
    } else if (k === 'e' || k === ' ') {
      advanceDialogue();
    }
    return;
  }

  if (k === 'e' && canInteract && !isFadingOut) {
    if (currentArea === 'garden' && sceneStage === 1 && princessReadyToTalk) {
      triggerEncounterDialogue();
    }
  }
});

window.addEventListener('pointerdown', unlockAudio, { passive: true });

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop(nowMs = performance.now()) {
  let kMoving = false;
  let pMoving = false;

  if (!inDialogue && !isFadingOut) {
    if (keys['w'] || keys['arrowup']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
      kY += speed;
      kMoving = true;
    }

    const minWalkY = currentArea === 'garden' ? 465 : 440;
    const maxWalkY = Math.min(window.innerHeight - 55, 620);
    if (kY < minWalkY) kY = minWalkY;
    if (kY > maxWalkY) kY = maxWalkY;

    if (keys['a'] || keys['arrowleft']) {
      kX -= speed;
      kMoving = true;
      if (knight) {
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');
      }
    }
    if (keys['d'] || keys['arrowright']) {
      kX += speed;
      kMoving = true;
      if (knight) {
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
      }
    }

    updateStrideFootsteps(kMoving || pMoving, nowMs);

    if (currentArea === 'hall') {
      if (arrowRight) {
        arrowRight.style.display = 'flex';
        if (kX > window.innerWidth - 280) {
          arrowRight.classList.add('highlight');
        } else {
          arrowRight.classList.remove('highlight');
        }
      }

      if (kX >= window.innerWidth - 130) {
        enterRoyalGardenFromLeft();
      }
    } else if (currentArea === 'garden') {
      if (arrowRight) arrowRight.style.display = 'none';
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }

    if (currentArea === 'garden' && princessActive && princessWalkingToRightSpot) {
      const rightGardenStopX = Math.max(520, window.innerWidth * 0.72);

      if (pX > rightGardenStopX) {
        pX -= 4.5;
        pMoving = true;
        if (princess) {
          princess.classList.add('facing-left');
          princess.classList.remove('facing-right');
        }
      } else {
        pX = rightGardenStopX;
        princessWalkingToRightSpot = false;
        princessReadyToTalk = true;
        pMoving = false;

        playSilverClinkSound(false);
        triggerEmote('princess', '💕');
        triggerEmote('knight', '❗');
        showActionFeedback("Sir Knight! Over here!", pX + 48, pY - 155);
        if (objectiveText) objectiveText.textContent = "Objective: Talk to the Princess.";
      }
    }

    canInteract = false;
    if (taskMarker) taskMarker.classList.add('hidden');
    if (interactionPrompt) interactionPrompt.classList.add('hidden');

    if (currentArea === 'garden' && sceneStage === 1 && princessReadyToTalk && princess) {
      if (kX <= pX) {
        princess.classList.add('facing-left');
        princess.classList.remove('facing-right');
      } else {
        princess.classList.add('facing-right');
        princess.classList.remove('facing-left');
      }

      if (taskMarker) {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = (pX + 35) + 'px';
        taskMarker.style.top = (pY - 150) + 'px';
      }

      if (Math.hypot(kX - pX, kY - pY) < 190) {
        canInteract = true;
        if (interactionPrompt) {
          interactionPrompt.textContent = "Press [E] to Talk to Princess";
          interactionPrompt.classList.remove('hidden');
        }
      }
    }

    if (currentArea === 'garden' && princessActive && princessWalkingAway && princess) {
      if (!princessTurnedBack) {
        princess.classList.remove('facing-left');
        princess.classList.add('facing-right');
        pX += 4.2;
        pMoving = true;

        if (pX >= window.innerWidth * 0.75) {
          princessTurnedBack = true;
          princessWalkingAway = false;
          pMoving = false;
          princess.classList.remove('facing-right');
          princess.classList.add('facing-left');
          playSilverClinkSound(false);
          startDialogue(princessTurnBackKissNodes, () => {
            princess.classList.remove('facing-left');
            princess.classList.add('facing-right');
            princessWalkingAway = true;
          });
        }
      } else {
        princess.classList.remove('facing-left');
        princess.classList.add('facing-right');
        pX += 4.2;
        pMoving = true;

        if (pX > window.innerWidth + 120) {
          princessActive = false;
          princessWalkingAway = false;
          princess.classList.add('hidden');
          sceneComplete = true;
          if (objectiveText) {
            objectiveText.textContent = "✅ Chapter 2 Complete — A midnight plan is set...";
          }

          playCaughtSting();
          startDialogue(knightAfterDeparturePanicNodes, () => {
            fadeOutEndOfChapter('CH3.html');
          });
        }
      }
    }
  } else {
    updateStrideFootsteps(false, nowMs);
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';
    knight.classList.toggle('running', kMoving);
  }

  if (princess && princessActive) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
    princess.classList.toggle('running', pMoving);
  }

  positionEmotesNow();
  requestAnimationFrame(gameLoop);
}

gameLoop();
