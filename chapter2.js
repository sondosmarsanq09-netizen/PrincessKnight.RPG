window.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('transition-overlay');
  setTimeout(() => {
    overlay.classList.remove('active');
  }, 100);
});

const knight = document.getElementById('knight');
const gameBody = document.getElementById('game-body');
const locationBanner = document.getElementById('location-banner');
const objectiveText = document.getElementById('objective');
const arrowLeft = document.getElementById('arrow-left');
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

const KNIGHT_STRIDE_MS = 900;
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
    syncAudioToggleLabel();
  });
}

let kX = 400;
let kY = 450;
const speed = 6;
let currentArea = 'hall';
let inDialogue = false;

let taskStage = 0;
let canInteract = false;

function showActionFeedback(message) {
  actionPopup.textContent = "✨ " + message + " ✨";

  actionPopup.style.left = (kX + 60) + 'px';
  actionPopup.style.top = (kY - 10) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above-knight 1.6s ease-out forwards';

  setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 1600);
}

const keys = {};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (k === 'e' && canInteract && !inDialogue) {
    if (taskStage === 0) {
      taskStage = 1;
      playSilverClinkSound(true);
      showActionFeedback("Anvil Inspected! +1 Forged Steel");
      objectiveText.textContent = "Objective: Head right to the Royal Garden to harvest a Moonbloom flower.";
    } else if (taskStage === 1) {
      taskStage = 2;
      playPorcelainChimeSound(false);
      showActionFeedback("Moonbloom Harvested Successfully!");
      objectiveText.textContent = "Objective: Return to Dragon's Hall and salute the grand statue.";
    } else if (taskStage === 2) {
      taskStage = 3;
      playSuccessChime();
      showActionFeedback("Grand Statue Saluted! Duties Complete!");
      objectiveText.textContent = "✅ All Chapter 2 palace duties completed successfully!";

      setTimeout(() => {
        playSuccessChime();
        const overlay = document.getElementById('transition-overlay');
        overlay.classList.add('active');

        setTimeout(() => {
          window.location.href = 'chapter2_scene2.html';
        }, 1200);
      }, 2000);
    }
  }
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

    if (kY < 350) kY = 350;
    if (kY > window.innerHeight - 100) kY = window.innerHeight - 100;

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

    updateStrideFootsteps(kMoving, nowMs);

    if (currentArea === 'hall') {
      arrowLeft.style.display = 'flex';
      arrowRight.style.display = 'flex';

      if (kX < 180) {
        arrowLeft.classList.add('highlight');
      } else {
        arrowLeft.classList.remove('highlight');
      }
      if (kX > window.innerWidth - 280) {
        arrowRight.classList.add('highlight');
      } else {
        arrowRight.classList.remove('highlight');
      }
    } else {
      arrowLeft.style.display = 'none';
      arrowRight.style.display = 'none';
    }

    if (currentArea === 'hall') {
      if (kX <= 10) {
        currentArea = 'workspace';
        gameBody.style.backgroundImage = "url('WorkSpace.png')";
        locationBanner.textContent = "📍 Forge Chambers";
        kX = window.innerWidth - 150;
      } else if (kX >= window.innerWidth - 130) {
        currentArea = 'garden';
        gameBody.style.backgroundImage = "url('RoyalGarden.png')";
        locationBanner.textContent = "📍 Royal Garden";
        kX = 20;
      }
    } else if (currentArea === 'workspace') {
      if (kX >= window.innerWidth - 130) {
        currentArea = 'hall';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Dragon's Hall";
        kX = 20;
      }
      if (kX < 10) kX = 10;
    } else if (currentArea === 'garden') {
      if (kX <= 10) {
        currentArea = 'hall';
        gameBody.style.backgroundImage = "url('PolishDragon.png')";
        locationBanner.textContent = "📍 Dragon's Hall";
        kX = window.innerWidth - 150;
      }
      if (kX > window.innerWidth - 130) kX = window.innerWidth - 130;
    }

    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (taskStage === 0) {
      if (currentArea === 'workspace') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '500px';
        taskMarker.style.top = '500px';

        if (Math.abs(kX - 500) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Inspect Forge Anvil";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } else if (taskStage === 1) {
      if (currentArea === 'garden') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '350px';
        taskMarker.style.top = '480px';

        if (Math.abs(kX - 350) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Harvest Moonbloom";
          interactionPrompt.classList.remove('hidden');
        }
      }
    } else if (taskStage === 2) {
      if (currentArea === 'hall') {
        taskMarker.classList.remove('hidden');
        taskMarker.style.left = '600px';
        taskMarker.style.top = '500px';

        if (Math.abs(kX - 600) < 50) {
          canInteract = true;
          interactionPrompt.textContent = "Press [E] to Salute Dragon Statue";
          interactionPrompt.classList.remove('hidden');
        }
      }
    }
  } else {
    updateStrideFootsteps(false, nowMs);
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

  requestAnimationFrame(gameLoop);
}

gameLoop();
