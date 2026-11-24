function removeOverlay() {
  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    overlay.classList.remove('active');
  }
}

window.addEventListener('DOMContentLoaded', removeOverlay);
setTimeout(removeOverlay, 50);

const princess = document.getElementById('princess');
const gameBody = document.getElementById('game-body');
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

const PRINCESS_STRIDE_MS = 800;
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
    const baseFreq = stepToggle ? 145 : 162;
    thudOsc.frequency.setValueAtTime(baseFreq, now);
    thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

    thudGain.gain.setValueAtTime(0.001, now);
    thudGain.gain.linearRampToValueAtTime(0.095, now + 0.008);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);
    thudOsc.start(now);
    thudOsc.stop(now + 0.09);

    const tapOsc = ctx.createOscillator();
    const tapGain = ctx.createGain();
    tapOsc.type = 'sine';
    tapOsc.frequency.setValueAtTime(stepToggle ? 420 : 470, now);
    tapOsc.frequency.exponentialRampToValueAtTime(210, now + 0.045);
    tapGain.gain.setValueAtTime(0.001, now);
    tapGain.gain.linearRampToValueAtTime(0.035, now + 0.005);
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
  const cycle = Math.floor(elapsed / PRINCESS_STRIDE_MS);
  const phase = (elapsed % PRINCESS_STRIDE_MS) / PRINCESS_STRIDE_MS;

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

let pX = 400;
let pY = 570;
const speed = 6;
let currentArea = 'room';
let inDialogue = false;
let isFadingOut = false;
let questEnded = false;

let taskStage = 0;
let canInteract = false;
let popupTimeout = null;

function showActionFeedback(message) {
  if (!actionPopup) return;

  actionPopup.textContent = "✨ " + message + " ✨";
  actionPopup.style.left = (pX + 40) + 'px';
  actionPopup.style.top = (pY - 20) + 'px';

  actionPopup.classList.remove('hidden');
  actionPopup.style.animation = 'none';
  actionPopup.offsetHeight;
  actionPopup.style.animation = 'float-above-princess 2.2s ease-out forwards';

  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(() => {
    actionPopup.classList.add('hidden');
  }, 2200);
}

function fadeToScene3(nextSceneUrl = 'chapter2scene3.html') {
  if (isFadingOut) return;
  isFadingOut = true;

  playSuccessChime();
  taskMarker.classList.add('hidden');
  interactionPrompt.classList.add('hidden');

  const overlay = document.getElementById('transition-overlay');
  if (overlay) {
    overlay.innerHTML = '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.classList.add('active');
      });
    });

    setTimeout(() => {
      window.location.href = nextSceneUrl;
    }, 1500);
  } else {
    window.location.href = nextSceneUrl;
  }
}

const keys = {};

window.addEventListener('keydown', (e) => {
  unlockAudio();
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(k)) {
    e.preventDefault();
  }
  keys[k] = true;

  if (k === 'e' && canInteract && !inDialogue && !questEnded && !isFadingOut) {
    if (taskStage === 0) {
      taskStage = 1;
      playSilverClinkSound(false);
      showActionFeedback("Bed Made Neatly!");
      objectiveText.textContent = "Objective: Brush your hair at the vanity dresser (left).";
    } else if (taskStage === 1) {
      taskStage = 2;
      playSilverClinkSound(false);
      showActionFeedback("Hair Brushed Smoothly!");
      objectiveText.textContent = "Objective: Put on your favorite perfume at the table (middle).";
    } else if (taskStage === 2) {
      taskStage = 3;
      playPorcelainChimeSound(false);
      showActionFeedback("Perfume Applied!");
      objectiveText.textContent = "🔊 Objective: Strange noises are coming from outside... Head right to the Balcony to investigate!";
    } else if (taskStage === 3) {
      taskStage = 4;
      questEnded = true;
      playSuccessChime();
      taskMarker.classList.add('hidden');
      interactionPrompt.classList.add('hidden');
      showActionFeedback("💕 Oh! It's him... down in the Royal Garden!");
      objectiveText.textContent = "✅ Princess spotted her favorite knight! Scene complete.";

      setTimeout(() => {
        fadeToScene3('chapter2scene3.html');
      }, 2500);
    }
  }
});

window.addEventListener('pointerdown', unlockAudio, { passive: true });

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

function gameLoop(nowMs = performance.now()) {
  let pMoving = false;

  if (!inDialogue && !isFadingOut) {
    if (keys['w']) {
      pY -= speed;
      pMoving = true;
    }
    if (keys['s']) {
      pY += speed;
      pMoving = true;
    }

    if (pY < 480) pY = 480;
    if (pY > window.innerHeight - 110) pY = window.innerHeight - 110;

    if (keys['a']) {
      pX -= speed;
      pMoving = true;
      princess.classList.add('facing-left');
      princess.classList.remove('facing-right');
    }
    if (keys['d']) {
      pX += speed;
      pMoving = true;
      princess.classList.remove('facing-left');
      princess.classList.add('facing-right');
    }

    updateStrideFootsteps(pMoving, nowMs);

    if (currentArea === 'room') {
      if (taskStage >= 3) {
        arrowRight.style.display = 'flex';
        if (pX > window.innerWidth - 280) {
          arrowRight.classList.add('highlight');
        } else {
          arrowRight.classList.remove('highlight');
        }
      } else {
        arrowRight.style.display = 'none';
      }

      if (taskStage >= 3 && pX >= window.innerWidth - 130) {
        currentArea = 'balcony';
        gameBody.style.backgroundImage = "url('Balcony.png')";
        locationBanner.textContent = "📍 Royal Balcony";
        pX = 20;
      }
    } else if (currentArea === 'balcony') {
      arrowRight.style.display = 'none';
      if (pX <= 10) {
        currentArea = 'room';
        gameBody.style.backgroundImage = "url('PrincessRoom.png')";
        locationBanner.textContent = "📍 Princess's Chambers";
        pX = window.innerWidth - 150;
      }
      if (pX > window.innerWidth - 130) pX = window.innerWidth - 130;
    }

    canInteract = false;
    taskMarker.classList.add('hidden');
    interactionPrompt.classList.add('hidden');

    if (!questEnded) {
      if (taskStage === 0) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '1050px';
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 1050) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Make Bed";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 1) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '150px';
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 150) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Brush Hair";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 2) {
        if (currentArea === 'room') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '580px';
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 580) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Apply Perfume";
            interactionPrompt.classList.remove('hidden');
          }
        }
      } else if (taskStage === 3) {
        if (currentArea === 'balcony') {
          taskMarker.classList.remove('hidden');
          taskMarker.style.left = '600px';
          taskMarker.style.top = '520px';

          if (Math.abs(pX - 600) < 60) {
            canInteract = true;
            interactionPrompt.textContent = "Press [E] to Look Over Balcony Railing";
            interactionPrompt.classList.remove('hidden');
          }
        }
      }
    }
  } else {
    updateStrideFootsteps(false, nowMs);
  }

  if (princess) {
    princess.style.left = pX + 'px';
    princess.style.top = pY + 'px';

    if (pMoving) {
      princess.classList.add('running');
    } else {
      princess.classList.remove('running');
    }
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
