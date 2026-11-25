window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
  if (window.GameAudio) {
    isMuted = window.GameAudio.isMuted();
    syncAudioToggleLabel();
    window.GameAudio.start('683268__migfus20__relaxing-chiptune-music.mp3', 0.14);
  }
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

// --- EXACT WEB AUDIO SOUND EFFECTS FROM CH3 ---
let audioCtx = null;
let isMuted = false;
let stepToggle = false;
let runStrideStartMs = null;
let lastStepStamp = -1;

// Tuned to .knight.running (0.7s cycle) so steps aren't rapid or bouncy
const KNIGHT_STRIDE_MS = 700;
const STEP_PHASES = [0.2, 0.7];

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
    thudGain.gain.linearRampToValueAtTime(0.11, now + 0.008);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.095);

    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(stepToggle ? 390 : 440, now);
    tapOsc.frequency.exponentialRampToValueAtTime(190, now + 0.045);
    tapGain.gain.setValueAtTime(0.001, now);
    tapGain.gain.linearRampToValueAtTime(0.04, now + 0.005);
    tapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    tapOsc.connect(tapGain);
    tapGain.connect(ctx.destination);
    tapOsc.start(now);
    tapOsc.stop(now + 0.055);
  } catch (e) {}
}

function playKnightFootstepSound() {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(84, now);
    osc1.frequency.exponentialRampToValueAtTime(30, now + 0.19);
    gain1.gain.setValueAtTime(0.22, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.21);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(640, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(340, now + 0.15);
    gain2.gain.setValueAtTime(0.06, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.17);
  } catch (e) {}
}

function playWoodCreakSound(loud = false) {
  if (isMuted) return;
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(loud ? 160 : 210, now);
    osc.frequency.linearRampToValueAtTime(loud ? 95 : 175, now + 0.22);
    gain.gain.setValueAtTime(loud ? 0.14 : 0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
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
        playSilverClinkSound(false);
        if (objectiveText) {
          objectiveText.textContent = "Objective: Got the item from the smith! Walk left across town to the fountain gates.";
        }
      }
      if (hasRing && kX <= 10) {
        currentScene = 2;

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
  playKnightFootstepSound();
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
      playPorcelainChimeSound(false);
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
  playSuccessChime();
  if (window.GameAudio) window.GameAudio.prepareSceneTransition();
  const overlay = document.getElementById('transition-overlay');
  overlay.classList.add('active');

  setTimeout(() => {
    window.location.href = nextChapterFilename;
  }, 1000);
}
