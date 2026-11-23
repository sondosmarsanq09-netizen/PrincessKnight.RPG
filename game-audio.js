// game-audio.js — Single guarded BGM instance + clean loop + stop/pause on unload
const GameAudio = (() => {
  const TRACK_SRC = '2019-07-29_-_Elven_Forest_-_FesliyanStudios.com_-_David_Renda.mp3';
  const BGM_VOLUME = 0.58;
  const STORAGE_MUTE_KEY = 'game_audio_muted';
  const STORAGE_TIME_KEY = 'game_audio_time';

  if (window.__OUR_RPG_GAME_AUDIO__) {
    return window.__OUR_RPG_GAME_AUDIO__;
  }

  let ctx = null;
  let muted = false;
  let bgmStarted = false;

  try {
    muted = sessionStorage.getItem(STORAGE_MUTE_KEY) === '1';
  } catch (e) {}

  let bgmAudio = window.__OUR_RPG_BGM_AUDIO__ || null;

  function initBgm() {
    if (bgmAudio) return bgmAudio;

    const el = new Audio(TRACK_SRC);
    el.loop = true;
    el.volume = BGM_VOLUME;
    el.preload = 'auto';

    el.addEventListener('ended', () => {
      el.currentTime = 0;
      if (!muted && bgmStarted) {
        el.play().catch(() => {});
      }
    });

    try {
      const savedTime = parseFloat(sessionStorage.getItem(STORAGE_TIME_KEY) || '0');
      if (!Number.isNaN(savedTime) && savedTime > 0) {
        el.addEventListener(
          'loadedmetadata',
          () => {
            if (el.duration && savedTime < el.duration) {
              el.currentTime = savedTime;
            }
          },
          { once: true }
        );
      }
    } catch (e) {}

    window.__OUR_RPG_BGM_AUDIO__ = el;
    bgmAudio = el;
    return bgmAudio;
  }

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

  function syncBgmState() {
    const el = initBgm();
    el.volume = BGM_VOLUME;
    el.loop = true;

    if (muted) {
      el.pause();
      return;
    }

    if (bgmStarted && el.paused) {
      el.play().catch(() => {});
    }
  }

  function unlock() {
    bgmStarted = true;
    ensureContext();
    syncBgmState();
  }

  function stopBgm(savePosition = true) {
    if (!bgmAudio) return;
    if (savePosition && !Number.isNaN(bgmAudio.currentTime)) {
      try {
        sessionStorage.setItem(STORAGE_TIME_KEY, String(bgmAudio.currentTime));
      } catch (e) {}
    }
    bgmAudio.pause();
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    try {
      sessionStorage.setItem(STORAGE_MUTE_KEY, muted ? '1' : '0');
    } catch (e) {}

    if (muted) {
      stopBgm(true);
    } else {
      bgmStarted = true;
      ensureContext();
      syncBgmState();
      playUiTick();
    }
  }

  function toggleMute() {
    setMuted(!muted);
    return muted;
  }

  function isMuted() {
    return muted;
  }

  function playTone(freq, duration = 0.2, type = 'sine', gainPeak = 0.06, delay = 0, slideTo = null) {
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

  // Stride-synced footsteps matching a 900ms walk/run cycle
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
        const baseFreq = stepFlip ? 96 : 108;
        playTone(baseFreq, 0.08, 'sine', 0.032, 0, baseFreq * 0.58);
      }
    });
  }

  function playUiTick() {
    playTone(620, 0.06, 'sine', 0.04, 0, 760);
  }

  function playPageTurn() {
    playTone(440, 0.08, 'triangle', 0.035, 0, 587.33);
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
    [523.25, 659.25, 783.99, 1046.50].forEach((n, i) => {
      playTone(n, 0.28, 'triangle', 0.075, i * 0.09);
    });
  }

  function playSuccess() {
    [587.33, 739.99, 880.00].forEach((n, i) => {
      playTone(n, 0.2, 'triangle', 0.06, i * 0.08);
    });
  }

  function playAlert() {
    playTone(330, 0.11, 'sine', 0.05, 0, 261.63);
  }

  function playBlockedThud() {
    playTone(190, 0.14, 'sawtooth', 0.04, 0, 125);
  }

  function playPrincessCall() {
    playTone(783.99, 0.14, 'sine', 0.06, 0);
    playTone(987.77, 0.22, 'sine', 0.065, 0.11);
  }

  function playEndingCadence() {
    [523.25, 659.25, 783.99, 987.77, 1318.51].forEach((n, i) => {
      playTone(n, 0.75, 'sine', 0.055, i * 0.14);
    });
  }

  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('pagehide', () => stopBgm(true));
  window.addEventListener('beforeunload', () => stopBgm(true));

  initBgm();

  const api = {
    unlock,
    stopBgm,
    setMuted,
    toggleMute,
    isMuted,
    updateStrideFootsteps,
    playUiTick,
    playPageTurn,
    playChoiceChime,
    playFlowerPick,
    playBouquetComplete,
    playSuccess,
    playAlert,
    playBlockedThud,
    playPrincessCall,
    playEndingCadence
  };

  window.__OUR_RPG_GAME_AUDIO__ = api;
  return api;
})();
