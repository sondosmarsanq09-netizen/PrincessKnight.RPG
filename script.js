window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const objectiveText = document.getElementById('objective');
const audioToggleBtn = document.getElementById('audio-toggle');

let sceneVignette = document.createElement('div');
sceneVignette.id = 'scene-vignette';
document.body.appendChild(sceneVignette);

let locationBanner = document.createElement('div');
locationBanner.id = 'location-banner';
locationBanner.textContent = "📍 Town Square — Alleys";
document.body.appendChild(locationBanner);

let thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

let dialogueBox = document.createElement('div');
dialogueBox.id = 'dialogue-box';
dialogueBox.classList.add('hidden');
dialogueBox.innerHTML = `
  <div id="speaker-name">Knight</div>
  <p id="dialogue-text"></p>
  <button id="prev-arrow" class="nav-arrow" title="Previous Line">◀</button>
  <button id="next-arrow" class="nav-arrow" title="Next Line">▶</button>
`;
document.body.appendChild(dialogueBox);

let speakerNameEl = document.getElementById('speaker-name');
let dialogueTextEl = document.getElementById('dialogue-text');
let prevArrow = document.getElementById('prev-arrow');
let nextArrow = document.getElementById('next-arrow');

let choiceContainer = document.createElement('div');
choiceContainer.id = 'choice-container';
choiceContainer.classList.add('hidden');
document.body.appendChild(choiceContainer);

let blacksmith = document.createElement('div');
blacksmith.id = 'blacksmith';
blacksmith.className = 'blacksmith';
document.body.appendChild(blacksmith);

let knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

let princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

// --- WEB AUDIO SOUND EFFECTS (CH3 PATTERN) ---
let audioCtx = null;
let isMuted = false;
let stepParity = false;
let runStrideStartMs = null;
let lastStepStamp = -1;

// Matches .knight.running animation: 0.7s stride cycle with 2 footfalls per cycle
const KNIGHT_STRIDE_MS = 700;
const STEP_PHASES = [0.22, 0.72];

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
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
}

function syncAudioToggleLabel() {
  if (!audioToggleBtn) return;
  audioToggleBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
}

function playStepSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    stepParity = !stepParity;

    // Armored step thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    const baseFreq = currentScene === 2 ? (stepParity ? 112 : 124) : (stepParity ? 128 : 142);
    thudOsc.frequency.setValueAtTime(baseFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.11);
    thudGain.gain.setValueAtTime(0.14, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.125);

    // Subtle boot/stone transient
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(stepParity ? 480 : 540, now + 0.015);
    tapOsc.frequency.exponentialRampToValueAtTime(220, now + 0.075);
    tapGain.gain.setValueAtTime(0.04, now + 0.015);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start(now + 0.015);
    tapOsc.stop(now + 0.085);
  } catch (e) {}
}

function updateKnightSteps(isMoving, nowMs) {
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
  const cycle = Math.floor(elapsed / KNIGHT_STRIDE_MS);
  const phase = (elapsed % KNIGHT_STRIDE_MS) / KNIGHT_STRIDE_MS;

  STEP_PHASES.forEach((targetPhase, idx) => {
    const stamp = cycle * 10 + idx;
    if (phase >= targetPhase && stamp > lastStepStamp) {
      lastStepStamp = stamp;
      playStepSound();
    }
  });
}

function playItemPickupSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.09, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.27);
    });
  } catch (e) {}
}

function playChoiceSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.09, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.23);
    });
  } catch (e) {}
}

function playAlertSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 246.94].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.08, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.25);
    });
  } catch (e) {}
}

function playSceneTransitionSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

if (audioToggleBtn) {
  syncAudioToggleLabel();
  audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAudio();
    isMuted = !isMuted;
    syncAudioToggleLabel();
  });
}

let kX = 200;
let kY = 400;
let pX = 500;
let pY = 400;

const speed = 6;
let currentScene = 1;
let hasRing = false;
let inDialogue = false;
let dialogueIndex = 0;

const keys = {};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;
});

window.addEventListener('pointerdown', unlockAudio, { passive: true });

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop(nowMs = performance.now()) {
  let kMoving = false;

  if (!inDialogue) {
    if (keys['w']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s']) {
      kY += speed;
      kMoving = true;
    }

    if (kY < 300) kY = 300;
    if (kY > window.innerHeight - 120) kY = window.innerHeight - 120;

    if (keys['a']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    updateKnightSteps(kMoving, nowMs);

    if (currentScene === 1) {
      if (!hasRing && kX >= window.innerWidth - 200) {
        hasRing = true;
        playItemPickupSound();
        if (objectiveText) {
          objectiveText.textContent = "Objective: Got the item from the smith! Walk left across town to the fountain gates.";
        }
      }
      if (hasRing && kX <= 10) {
        currentScene = 2;
        playSceneTransitionSound();

        if (blacksmith) {
          blacksmith.classList.add('hidden');
        }

        if (gameBody) {
          gameBody.style.backgroundImage = "url('DangerFOUNTAIN.png')";
        }
        sceneVignette.classList.add('fountain-atmosphere');
        locationBanner.textContent = "📍 Outer Gates — Moonlit Fountain";

        pX = 220;
        pY = 400;
        if (princess) {
          princess.classList.remove('hidden');
          princess.classList.remove('facing-left');
          princess.classList.add('facing-right');
          princess.style.left = pX + 'px';
          princess.style.top = pY + 'px';
        }
        kX = window.innerWidth - 150;
        kY = 400;
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');

        if (objectiveText) {
          objectiveText.textContent = "Objective: Approach the Princess by the fountain.";
        }
      }
    } else if (currentScene === 2) {
      let distance = Math.abs(kX - pX);
      if (kX <= pX && distance <= 90) {
        kX = pX - 70;
        kY = pY;
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
        startEncounter();
      }
    }
  } else {
    updateKnightSteps(false, nowMs);
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';

    if (kMoving) {
      knight.classList.add('running');
    } else {
      knight.classList.remove('running');
    }
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
  }

  knightEmote.style.left = (kX + 35) + 'px';
  knightEmote.style.top = (kY - 35) + 'px';

  princessEmote.style.left = (pX + 25) + 'px';
  princessEmote.style.top = (pY - 35) + 'px';

  requestAnimationFrame(gameLoop);
}

function triggerEmote(element, symbol) {
  element.textContent = symbol;
  element.classList.remove('hidden');
  void element.offsetWidth;
  setTimeout(() => {
    element.classList.add('hidden');
  }, 1800);
}

function startEncounter() {
  inDialogue = true;
  knight.classList.remove('running');
  playAlertSound();
  if (objectiveText) {
    objectiveText.textContent = "Event: Unexpected Encounter by the Fountain";
  }

  dialogueIndex = 0;
  showDialogueStep();
}

function showDialogueStep() {
  thoughtBox.classList.add('hidden');
  dialogueBox.classList.remove('hidden');

  if (dialogueIndex === 0) {
    speakerNameEl.className = '';
    speakerNameEl.textContent = "Knight";
    dialogueTextEl.textContent = "“Your Highness?! What are you doing out here by the outer gates?!”";
    thoughtBox.textContent = "...Royalty shouldn't be outside the palace. It's dangerous—they could easily be waylaid or robbed.";
    thoughtBox.classList.remove('hidden');
    triggerEmote(knightEmote, "❓");
  } else if (dialogueIndex === 1) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“Keep your voice down, you fool! I didn't slip past the guards just to have the town watch alerted by my own personal knight.”";
    triggerEmote(princessEmote, "💢");
  } else if (dialogueIndex === 2) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“I need to get to the old gate road, and I cannot do it alone. Will you assist me, or must I find someone less... cowardly?”";
    triggerEmote(princessEmote, "✨");
    triggerEmote(knightEmote, "💧");

    presentChoices();
    return;
  }
}

nextArrow.onclick = () => {
  if (dialogueIndex < 2) {
    dialogueIndex++;
    showDialogueStep();
  }
};

prevArrow.onclick = () => {
  if (dialogueIndex > 0) {
    dialogueIndex--;
    choiceContainer.classList.add('hidden');
    showDialogueStep();
  }
};

function presentChoices() {
  nextArrow.style.display = 'none';
  prevArrow.style.display = 'none';
  choiceContainer.innerHTML = '';
  choiceContainer.classList.remove('hidden');

  const options = [
    { text: "1. 'I am not cowardly! I am professionally concerned for your safety!'", responseType: 1 },
    { text: "2. (Stammering) 'I—uh... that is to say... protocol dictates—'", responseType: 2 },
    { text: "3. 'If the King finds out, he will have my head on a spike!'", responseType: 3 }
  ];

  options.forEach(opt => {
    let btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      playChoiceSound();
      choiceContainer.classList.add('hidden');
      nextArrow.style.display = 'flex';
      prevArrow.style.display = 'flex';
      resolveChoice(opt.responseType);
    };
    choiceContainer.appendChild(btn);
  });
}

function resolveChoice(type) {
  thoughtBox.classList.remove('hidden');
  speakerNameEl.className = '';
  speakerNameEl.textContent = "Knight";

  if (type === 1) {
    dialogueTextEl.textContent = "“I am not cowardly! I am professionally concerned for your safety!”";
    thoughtBox.textContent = "(Internal) For a year I've admired her from afar... I never imagined she was this boldly teasing up close.";
    triggerEmote(knightEmote, "😳");
  } else if (type === 2) {
    dialogueTextEl.textContent = "“I—uh... that is to say... protocol dictates—oh, by the gods.”";
    thoughtBox.textContent = "(Internal) She's actually flirting with me. My entire nervous system is short-circuiting.";
    triggerEmote(knightEmote, "⚡");
  } else if (type === 3) {
    dialogueTextEl.textContent = "“If the King finds out, he will have my head on a spike!”";
    thoughtBox.textContent = "(Internal) She's glaring at me now... but gods, even when she's furious, she's breathtaking.";
    triggerEmote(knightEmote, "💓");
  }

  setTimeout(() => {
    thoughtBox.classList.add('hidden');
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";

    if (type === 1) {
      dialogueTextEl.textContent = "“Professional concern? Is that what you call shaking in your greaves? Get moving toward the Old Gate Road.”";
    } else if (type === 2) {
      dialogueTextEl.textContent = "“Protocol doesn't look very steady on its feet right now. Lead the way to the Old Gate Road.”";
    } else {
      dialogueTextEl.textContent = "“Then let's pray he doesn't find out. To the Old Gate Road, Knight.”";
    }
    triggerEmote(princessEmote, "✨");

    setTimeout(() => {
      dialogueBox.classList.add('hidden');
      inDialogue = false;
      if (objectiveText) {
        objectiveText.textContent = "Objective: Walk with the Princess toward the Old Gate Road on the left.";
      }

      transitionToNextChapter('chapter2.html');
    }, 4500);
  }, 4000);
}

gameLoop();

function transitionToNextChapter(nextChapterFilename) {
  playSceneTransitionSound();
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    window.location.href = nextChapterFilename;
  }, 1000);
}
  }, 100);
});

const knight = document.getElementById('knight');
const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
const objectiveText = document.getElementById('objective');
const audioToggleBtn = document.getElementById('audio-toggle');

let sceneVignette = document.createElement('div');
sceneVignette.id = 'scene-vignette';
document.body.appendChild(sceneVignette);

let locationBanner = document.createElement('div');
locationBanner.id = 'location-banner';
locationBanner.textContent = "📍 Town Square — Alleys";
document.body.appendChild(locationBanner);

let thoughtBox = document.createElement('div');
thoughtBox.id = 'thought-box';
thoughtBox.className = 'subtle-thought hidden';
document.body.appendChild(thoughtBox);

let dialogueBox = document.createElement('div');
dialogueBox.id = 'dialogue-box';
dialogueBox.classList.add('hidden');
dialogueBox.innerHTML = `
  <div id="speaker-name">Knight</div>
  <p id="dialogue-text"></p>
  <button id="prev-arrow" class="nav-arrow" title="Previous Line">◀</button>
  <button id="next-arrow" class="nav-arrow" title="Next Line">▶</button>
`;
document.body.appendChild(dialogueBox);

let speakerNameEl = document.getElementById('speaker-name');
let dialogueTextEl = document.getElementById('dialogue-text');
let prevArrow = document.getElementById('prev-arrow');
let nextArrow = document.getElementById('next-arrow');

let choiceContainer = document.createElement('div');
choiceContainer.id = 'choice-container';
choiceContainer.classList.add('hidden');
document.body.appendChild(choiceContainer);

let blacksmith = document.createElement('div');
blacksmith.id = 'blacksmith';
blacksmith.className = 'blacksmith';
document.body.appendChild(blacksmith);

let knightEmote = document.createElement('div');
knightEmote.className = 'emote-bubble hidden';
document.body.appendChild(knightEmote);

let princessEmote = document.createElement('div');
princessEmote.className = 'emote-bubble hidden';
document.body.appendChild(princessEmote);

// --- WEB AUDIO SOUND EFFECTS (CH3 PATTERN) ---
let audioCtx = null;
let isMuted = false;
let lastStepSoundAt = 0;
let stepParity = false;

function getAudioCtx() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
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
}

function syncAudioToggleLabel() {
  if (!audioToggleBtn) return;
  audioToggleBtn.textContent = isMuted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
}

function playStepSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    stepParity = !stepParity;

    // Armored step thud
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thudOsc.type = 'triangle';
    const baseFreq = currentScene === 2 ? (stepParity ? 115 : 128) : (stepParity ? 132 : 148);
    thudOsc.frequency.setValueAtTime(baseFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(42, now + 0.11);
    thudGain.gain.setValueAtTime(0.14, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.125);

    // Subtle boot/stone transient
    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(stepParity ? 520 : 590, now + 0.015);
    tapOsc.frequency.exponentialRampToValueAtTime(240, now + 0.075);
    tapGain.gain.setValueAtTime(0.045, now + 0.015);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start(now + 0.015);
    tapOsc.stop(now + 0.085);
  } catch (e) {}
}

function playUiClickSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(860, now + 0.07);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

function playItemPickupSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [587.33, 880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.09, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.26);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.27);
    });
  } catch (e) {}
}

function playChoiceSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.09, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.23);
    });
  } catch (e) {}
}

function playAlertSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    [330, 246.94].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);
      gain.gain.setValueAtTime(0.08, now + idx * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 0.25);
    });
  } catch (e) {}
}

function playSceneTransitionSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.22);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

if (audioToggleBtn) {
  syncAudioToggleLabel();
  audioToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAudio();
    isMuted = !isMuted;
    syncAudioToggleLabel();
    if (!isMuted) {
      playUiClickSound();
    }
  });
}

let kX = 200;
let kY = 400;
let pX = 500;
let pY = 400;

const speed = 6;
let currentScene = 1;
let hasRing = false;
let inDialogue = false;
let dialogueIndex = 0;

const keys = {};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', ' '].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;
});

window.addEventListener('pointerdown', unlockAudio, { passive: true });

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop() {
  let kMoving = false;

  if (!inDialogue) {
    if (keys['w']) {
      kY -= speed;
      kMoving = true;
    }
    if (keys['s']) {
      kY += speed;
      kMoving = true;
    }

    if (kY < 300) kY = 300;
    if (kY > window.innerHeight - 120) kY = window.innerHeight - 120;

    if (keys['a']) {
      kX -= speed;
      kMoving = true;
      knight.classList.add('facing-left');
      knight.classList.remove('facing-right');
    }
    if (keys['d']) {
      kX += speed;
      kMoving = true;
      knight.classList.remove('facing-left');
      knight.classList.add('facing-right');
    }

    if (kMoving) {
      const now = performance.now();
      if (now - lastStepSoundAt > 240) {
        lastStepSoundAt = now;
        playStepSound();
      }
    }

    if (currentScene === 1) {
      if (!hasRing && kX >= window.innerWidth - 200) {
        hasRing = true;
        playItemPickupSound();
        if (objectiveText) {
          objectiveText.textContent = "Objective: Got the item from the smith! Walk left across town to the fountain gates.";
        }
      }
      if (hasRing && kX <= 10) {
        currentScene = 2;
        playSceneTransitionSound();

        if (blacksmith) {
          blacksmith.classList.add('hidden');
        }

        if (gameBody) {
          gameBody.style.backgroundImage = "url('DangerFOUNTAIN.png')";
        }
        sceneVignette.classList.add('fountain-atmosphere');
        locationBanner.textContent = "📍 Outer Gates — Moonlit Fountain";

        pX = 220;
        pY = 400;
        if (princess) {
          princess.classList.remove('hidden');
          princess.classList.remove('facing-left');
          princess.classList.add('facing-right');
          princess.style.left = pX + 'px';
          princess.style.top = pY + 'px';
        }
        kX = window.innerWidth - 150;
        kY = 400;
        knight.classList.add('facing-left');
        knight.classList.remove('facing-right');

        if (objectiveText) {
          objectiveText.textContent = "Objective: Approach the Princess by the fountain.";
        }
      }
    } else if (currentScene === 2) {
      let distance = Math.abs(kX - pX);
      if (kX <= pX && distance <= 90) {
        kX = pX - 70;
        kY = pY;
        knight.classList.remove('facing-left');
        knight.classList.add('facing-right');
        startEncounter();
      }
    }
  }

  if (knight) {
    knight.style.left = kX + 'px';
    knight.style.top = kY + 'px';

    if (kMoving) {
      knight.classList.add('running');
    } else {
      knight.classList.remove('running');
    }
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';
  }

  knightEmote.style.left = (kX + 35) + 'px';
  knightEmote.style.top = (kY - 35) + 'px';

  princessEmote.style.left = (pX + 25) + 'px';
  princessEmote.style.top = (pY - 35) + 'px';

  requestAnimationFrame(gameLoop);
}

function triggerEmote(element, symbol) {
  element.textContent = symbol;
  element.classList.remove('hidden');
  void element.offsetWidth;
  setTimeout(() => {
    element.classList.add('hidden');
  }, 1800);
}

function startEncounter() {
  inDialogue = true;
  knight.classList.remove('running');
  playAlertSound();
  if (objectiveText) {
    objectiveText.textContent = "Event: Unexpected Encounter by the Fountain";
  }

  dialogueIndex = 0;
  showDialogueStep();
}

function showDialogueStep() {
  thoughtBox.classList.add('hidden');
  dialogueBox.classList.remove('hidden');

  if (dialogueIndex === 0) {
    speakerNameEl.className = '';
    speakerNameEl.textContent = "Knight";
    dialogueTextEl.textContent = "“Your Highness?! What are you doing out here by the outer gates?!”";
    thoughtBox.textContent = "...Royalty shouldn't be outside the palace. It's dangerous—they could easily be waylaid or robbed.";
    thoughtBox.classList.remove('hidden');
    triggerEmote(knightEmote, "❓");
  } else if (dialogueIndex === 1) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“Keep your voice down, you fool! I didn't slip past the guards just to have the town watch alerted by my own personal knight.”";
    triggerEmote(princessEmote, "💢");
  } else if (dialogueIndex === 2) {
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";
    dialogueTextEl.textContent = "“I need to get to the old gate road, and I cannot do it alone. Will you assist me, or must I find someone less... cowardly?”";
    triggerEmote(princessEmote, "✨");
    triggerEmote(knightEmote, "💧");

    presentChoices();
    return;
  }
}

nextArrow.onclick = () => {
  if (dialogueIndex < 2) {
    playUiClickSound();
    dialogueIndex++;
    showDialogueStep();
  }
};

prevArrow.onclick = () => {
  if (dialogueIndex > 0) {
    playUiClickSound();
    dialogueIndex--;
    choiceContainer.classList.add('hidden');
    showDialogueStep();
  }
};

function presentChoices() {
  nextArrow.style.display = 'none';
  prevArrow.style.display = 'none';
  choiceContainer.innerHTML = '';
  choiceContainer.classList.remove('hidden');

  const options = [
    { text: "1. 'I am not cowardly! I am professionally concerned for your safety!'", responseType: 1 },
    { text: "2. (Stammering) 'I—uh... that is to say... protocol dictates—'", responseType: 2 },
    { text: "3. 'If the King finds out, he will have my head on a spike!'", responseType: 3 }
  ];

  options.forEach(opt => {
    let btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = opt.text;
    btn.onclick = () => {
      playChoiceSound();
      choiceContainer.classList.add('hidden');
      nextArrow.style.display = 'flex';
      prevArrow.style.display = 'flex';
      resolveChoice(opt.responseType);
    };
    choiceContainer.appendChild(btn);
  });
}

function resolveChoice(type) {
  thoughtBox.classList.remove('hidden');
  speakerNameEl.className = '';
  speakerNameEl.textContent = "Knight";

  if (type === 1) {
    dialogueTextEl.textContent = "“I am not cowardly! I am professionally concerned for your safety!”";
    thoughtBox.textContent = "(Internal) For a year I've admired her from afar... I never imagined she was this boldly teasing up close.";
    triggerEmote(knightEmote, "😳");
  } else if (type === 2) {
    dialogueTextEl.textContent = "“I—uh... that is to say... protocol dictates—oh, by the gods.”";
    thoughtBox.textContent = "(Internal) She's actually flirting with me. My entire nervous system is short-circuiting.";
    triggerEmote(knightEmote, "⚡");
  } else if (type === 3) {
    dialogueTextEl.textContent = "“If the King finds out, he will have my head on a spike!”";
    thoughtBox.textContent = "(Internal) She's glaring at me now... but gods, even when she's furious, she's breathtaking.";
    triggerEmote(knightEmote, "💓");
  }

  setTimeout(() => {
    thoughtBox.classList.add('hidden');
    speakerNameEl.className = 'princess-speak';
    speakerNameEl.textContent = "Princess";

    if (type === 1) {
      dialogueTextEl.textContent = "“Professional concern? Is that what you call shaking in your greaves? Get moving toward the Old Gate Road.”";
    } else if (type === 2) {
      dialogueTextEl.textContent = "“Protocol doesn't look very steady on its feet right now. Lead the way to the Old Gate Road.”";
    } else {
      dialogueTextEl.textContent = "“Then let's pray he doesn't find out. To the Old Gate Road, Knight.”";
    }
    triggerEmote(princessEmote, "✨");

    setTimeout(() => {
      dialogueBox.classList.add('hidden');
      inDialogue = false;
      if (objectiveText) {
        objectiveText.textContent = "Objective: Walk with the Princess toward the Old Gate Road on the left.";
      }

      transitionToNextChapter('chapter2.html');
    }, 4500);
  }, 4000);
}

gameLoop();

function transitionToNextChapter(nextChapterFilename) {
  playSceneTransitionSound();
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    window.location.href = nextChapterFilename;
  }, 1000);
}
