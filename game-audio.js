const GameAudio = (() => {
  if (window.__OUR_RPG_GAME_AUDIO__) {
    return window.__OUR_RPG_GAME_AUDIO__;
  }

  let ctx = null;
  let muted = false;

  function ensureContext() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) {
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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
    const c = ensureContext();
    if (c && c.state === 'suspended') {
      c.resume().catch(() => {});
    }
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    syncAudioToggleUI();
    if (!muted) {
      unlock();
      playUiTick();
    }
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function playTone(freq, duration = 0.14, type = 'triangle', peak = 0.16, delay = 0, slideTo = null) {
    if (muted) return;
    const c = ensureContext();
    if (!c) return;

    const run = () => {
      const start = c.currentTime + delay;
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), start + duration);
      }

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(peak, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(c.destination);

      osc.start(start);
      osc.stop(start + duration + 0.02);
    };

    if (c.state === 'suspended') {
      c.resume().then(run).catch(() => {});
    } else {
      run();
    }
  }

  // Crisp stepping sound while moving
  const STEP_INTERVAL_MS = 230;
  let lastStepAt = 0;
  let alternateFoot = false;

  function playStepSound() {
    alternateFoot = !alternateFoot;
    const base = alternateFoot ? 155 : 185;
    playTone(base, 0.08, 'triangle', 0.16, 0, base * 0.48);
    playTone(base * 2.1, 0.035, 'sine', 0.05, 0.005, base * 1.1);
  }

  function updateStrideFootsteps(isMoving) {
    if (!isMoving) {
      return;
    }
    if (muted) return;
    unlock();

    const now = performance.now();
    if (now - lastStepAt >= STEP_INTERVAL_MS) {
      lastStepAt = now;
      playStepSound();
    }
  }

  // Interaction & UI noises
  function playUiTick() {
    playTone(660, 0.07, 'sine', 0.14, 0, 860);
  }

  function playPageTurn() {
    playTone(392, 0.09, 'triangle', 0.13, 0, 587.33);
  }

  function playChoiceChime() {
    playTone(587.33, 0.12, 'triangle', 0.15, 0);
    playTone(880, 0.2, 'sine', 0.16, 0.07);
  }

  function playItemPickup() {
    playTone(659.25, 0.12, 'triangle', 0.17, 0);
    playTone(987.77, 0.22, 'sine', 0.17, 0.07);
  }

  function playBlacksmithAnvil() {
    playTone(1046.5, 0.14, 'triangle', 0.18, 0, 620);
    playTone(1567.98, 0.22, 'sine', 0.12, 0.02, 920);
  }

  function playFlowerPick() {
    playTone(523.25, 0.12, 'triangle', 0.15, 0);
    playTone(659.25, 0.12, 'triangle', 0.15, 0.06);
    playTone(783.99, 0.2, 'sine', 0.16, 0.12);
  }

  function playSuccess() {
    [587.33, 739.99, 880, 1174.66].forEach((freq, i) => {
      playTone(freq, 0.18, 'triangle', 0.15, i * 0.075);
    });
  }

  function playAlert() {
    playTone(340, 0.13, 'sawtooth', 0.12, 0, 220);
  }

  function playPrincessCall() {
    playTone(783.99, 0.13, 'sine', 0.15, 0);
    playTone(1046.5, 0.22, 'sine', 0.16, 0.1);
  }

  window.addEventListener('DOMContentLoaded', bindAudioToggleButton);
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });

  const api = {
    unlock,
    setMuted,
    toggleMute,
    syncAudioToggleUI,
    playStepSound,
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
