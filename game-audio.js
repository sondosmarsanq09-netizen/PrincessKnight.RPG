const GameAudio = (() => {
  if (window.__OUR_RPG_GAME_AUDIO__) {
    return window.__OUR_RPG_GAME_AUDIO__;
  }

  let ctx = null;
  let muted = false;

  function ensureContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function syncAudioToggleUI() {
    const btn = document.getElementById('audio-toggle');
    if (!btn) return;
    btn.textContent = muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    btn.classList.toggle('muted', muted);
  }

  function bindAudioToggleButton() {
    const btn = document.getElementById('audio-toggle');
    if (!btn || btn.dataset.audioBound === '1') {
      syncAudioToggleUI();
      return;
    }
    btn.dataset.audioBound = '1';
    syncAudioToggleUI();
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
    });
  }

  function unlock() {
    ensureContext();
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    syncAudioToggleUI();
    if (!muted) {
      ensureContext();
      playUiTick();
    }
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function playTone(freq, duration = 0.16, type = 'triangle', gainPeak = 0.08, delay = 0, slideTo = null) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const trigger = () => {
      const now = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    };

    if (c.state === 'suspended') {
      c.resume().then(trigger).catch(() => {});
    } else {
      trigger();
    }
  }

  const RUN_CYCLE_MS = 900;
  const STEP_PHASES = [0.22, 0.72];
  let runCycleStartMs = null;
  let lastStepCycle = -1;
  let stepFlip = false;

  function updateStrideFootsteps(isMoving) {
    if (!isMoving) {
      runCycleStartMs = null;
      lastStepCycle = -1;
      return;
    }

    const nowMs = performance.now();
    if (runCycleStartMs === null) {
      runCycleStartMs = nowMs;
      lastStepCycle = -1;
    }

    if (muted) return;

    const elapsed = nowMs - runCycleStartMs;
    const cycleNum = Math.floor(elapsed / RUN_CYCLE_MS);
    const phase = (elapsed % RUN_CYCLE_MS) / RUN_CYCLE_MS;

    STEP_PHASES.forEach((targetPhase, idx) => {
      const stepStamp = cycleNum * 10 + idx;
      if (phase >= targetPhase && stepStamp > lastStepCycle) {
        lastStepCycle = stepStamp;
        stepFlip = !stepFlip;
        const baseFreq = stepFlip ? 115 : 135;
        playTone(baseFreq, 0.085, 'triangle', 0.065, 0, baseFreq * 0.55);
      }
    });
  }

  function playUiTick() {
    playTone(640, 0.065, 'sine', 0.06, 0, 780);
  }

  function playPageTurn() {
    playTone(440, 0.09, 'triangle', 0.06, 0, 587.33);
  }

  function playChoiceChime() {
    playTone(587.33, 0.13, 'triangle', 0.08, 0);
    playTone(880.0, 0.19, 'sine', 0.075, 0.07);
  }

  function playItemPickup() {
    playTone(659.25, 0.13, 'triangle', 0.085, 0);
    playTone(987.77, 0.2, 'sine', 0.085, 0.07);
  }

  function playBlacksmithAnvil() {
    playTone(980, 0.14, 'triangle', 0.09, 0, 620);
    playTone(1480, 0.22, 'sine', 0.065, 0.02, 880);
  }

  function playFlowerPick() {
    playTone(523.25, 0.14, 'triangle', 0.085, 0);
    playTone(659.25, 0.14, 'triangle', 0.085, 0.07);
    playTone(783.99, 0.22, 'sine', 0.09, 0.14);
  }

  function playSuccess() {
    [587.33, 739.99, 880.0].forEach((n, i) => {
      playTone(n, 0.2, 'triangle', 0.08, i * 0.08);
    });
  }

  function playAlert() {
    playTone(330, 0.12, 'sine', 0.075, 0, 261.63);
  }

  function playPrincessCall() {
    playTone(783.99, 0.14, 'sine', 0.08, 0);
    playTone(987.77, 0.22, 'sine', 0.085, 0.11);
  }

  window.addEventListener('DOMContentLoaded', bindAudioToggleButton);
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  const api = {
    unlock,
    setMuted,
    toggleMute,
    syncAudioToggleUI,
    updateStrideFootsteps,
    playUiTick,
    playPageTurn,
    playChoiceChime,
    playItemPickup,
    playBlacksmithAnvil,
    playFlowerPick,
    playSuccess,
    playAlert,
    playPrincessCall
  };

  window.__OUR_RPG_GAME_AUDIO__ = api;
  return api;
})();
