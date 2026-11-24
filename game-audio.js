// game-audio.js — Shared BGM (0.58 volume) + SFX + Stride Footsteps + Auto #audio-toggle
const GameAudio = (() => {
  const DEFAULT_TRACK_SRC = '2019-07-29_-_Elven_Forest_-_FesliyanStudios.com_-_David_Renda.mp3';
  const DEFAULT_BGM_VOLUME = 0.58;
  const STORAGE_MUTE_KEY = 'game_audio_muted';
  const STORAGE_TRACK_KEY = 'game_audio_track';
  const STORAGE_TIME_KEY = 'game_audio_time';

  if (window.__OUR_RPG_GAME_AUDIO__) {
    return window.__OUR_RPG_GAME_AUDIO__;
  }

  let ctx = null;
  let muted = false;
  let userInteracted = false;
  let currentTrackSrc = DEFAULT_TRACK_SRC;
  let bgmAudio = null;

  try {
    muted = sessionStorage.getItem(STORAGE_MUTE_KEY) === '1';
  } catch (e) {}

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

  function saveBgmState() {
    if (!bgmAudio) return;
    try {
      if (currentTrackSrc) {
        sessionStorage.setItem(STORAGE_TRACK_KEY, currentTrackSrc);
      }
      if (!Number.isNaN(bgmAudio.currentTime)) {
        sessionStorage.setItem(STORAGE_TIME_KEY, String(bgmAudio.currentTime));
      }
    } catch (e) {}
  }

  function initBgm(trackSrc = DEFAULT_TRACK_SRC, volume = DEFAULT_BGM_VOLUME) {
    const targetSrc = trackSrc || DEFAULT_TRACK_SRC;
    const trackChanged = currentTrackSrc !== targetSrc || !bgmAudio;
    currentTrackSrc = targetSrc;

    if (!bgmAudio) {
      bgmAudio = new Audio();
      bgmAudio.loop = true;
      bgmAudio.preload = 'auto';

      bgmAudio.addEventListener('ended', () => {
        bgmAudio.currentTime = 0;
        if (!muted && userInteracted) {
          bgmAudio.play().catch(() => {});
        }
      });

      setInterval(() => {
        if (bgmAudio && !bgmAudio.paused) {
          saveBgmState();
        }
      }, 600);
    }

    bgmAudio.volume = Math.max(0, Math.min(1, volume));
    bgmAudio.loop = true;

    if (trackChanged) {
      bgmAudio.pause();
      bgmAudio.src = targetSrc;
      bgmAudio.load();

      try {
        const savedTrack = sessionStorage.getItem(STORAGE_TRACK_KEY);
        const savedTime = parseFloat(sessionStorage.getItem(STORAGE_TIME_KEY) || '0');
        if (savedTrack === targetSrc && !Number.isNaN(savedTime) && savedTime > 0) {
          bgmAudio.addEventListener(
            'loadedmetadata',
            () => {
              if (bgmAudio.duration && savedTime < bgmAudio.duration) {
                bgmAudio.currentTime = savedTime;
              }
            },
            { once: true }
          );
        }
      } catch (e) {}
    }

    if (muted) {
      bgmAudio.pause();
    } else if (userInteracted && bgmAudio.paused) {
      bgmAudio.play().catch(() => {});
    }

    return bgmAudio;
  }

  function setTrack(trackSrc, volume = DEFAULT_BGM_VOLUME) {
    initBgm(trackSrc, volume);
  }

  function stopBgm(savePosition = true) {
    if (!bgmAudio) return;
    if (savePosition) saveBgmState();
    bgmAudio.pause();
  }

  function unlock() {
    userInteracted = true;
    ensureContext();
    const el = initBgm(currentTrackSrc, DEFAULT_BGM_VOLUME);
    if (!muted && el.paused) {
      el.play().catch(() => {});
    }
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    try {
      sessionStorage.setItem(STORAGE_MUTE_KEY, muted ? '1' : '0');
    } catch (e) {}

    syncAudioToggleUI();

    if (muted) {
      stopBgm(true);
    } else {
      userInteracted = true;
      ensureContext();
      const el = initBgm(currentTrackSrc, DEFAULT_BGM_VOLUME);
      el.play().catch(() => {});
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

  function playTone(freq, duration = 0.2, type = 'sine', gainPeak = 0.09, delay = 0, slideTo = null) {
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
        const baseFreq = stepFlip ? 125 : 145;
        playTone(baseFreq, 0.09, 'triangle', 0.075, 0, baseFreq * 0.55);
      }
    });
  }

  function playUiTick() {
    playTone(640, 0.065, 'sine', 0.07, 0, 780);
  }

  function playPageTurn() {
    playTone(440, 0.09, 'triangle', 0.065, 0, 587.33);
  }

  function playChoiceChime() {
    playTone(587.33, 0.13, 'triangle', 0.085, 0);
    playTone(880.00, 0.19, 'sine', 0.08, 0.07);
  }

  function playItemPickup() {
    playTone(659.25, 0.13, 'triangle', 0.09, 0);
    playTone(987.77, 0.2, 'sine', 0.09, 0.07);
  }

  function playBlacksmithAnvil() {
    playTone(980, 0.14, 'triangle', 0.095, 0, 620);
    playTone(1480, 0.22, 'sine', 0.07, 0.02, 880);
  }

  function playFlowerPick() {
    playTone(523.25, 0.14, 'triangle', 0.09, 0);
    playTone(659.25, 0.14, 'triangle', 0.09, 0.07);
    playTone(783.99, 0.22, 'sine', 0.095, 0.14);
  }

  function playBouquetComplete() {
    [523.25, 659.25, 783.99, 1046.50].forEach((n, i) => {
      playTone(n, 0.28, 'triangle', 0.095, i * 0.09);
    });
  }

  function playSuccess() {
    [587.33, 739.99, 880.00].forEach((n, i) => {
      playTone(n, 0.2, 'triangle', 0.085, i * 0.08);
    });
  }

  function playAlert() {
    playTone(330, 0.12, 'sine', 0.08, 0, 261.63);
  }

  function playBlockedThud() {
    playTone(190, 0.15, 'sawtooth', 0.065, 0, 125);
  }

  function playPrincessCall() {
    playTone(783.99, 0.14, 'sine', 0.085, 0);
    playTone(987.77, 0.22, 'sine', 0.09, 0.11);
  }

  function playEndingCadence() {
    [523.25, 659.25, 783.99, 987.77, 1318.51].forEach((n, i) => {
      playTone(n, 0.75, 'sine', 0.08, i * 0.14);
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    bindAudioToggleButton();
    initBgm(DEFAULT_TRACK_SRC, DEFAULT_BGM_VOLUME);
  });
  window.addEventListener('pointerdown', unlock, { passive: true });
  window.addEventListener('keydown', unlock, { passive: true });
  window.addEventListener('pagehide', () => stopBgm(true));
  window.addEventListener('beforeunload', () => stopBgm(true));

  const api = {
    unlock,
    setTrack,
    stopBgm,
    setMuted,
    toggleMute,
    isMuted,
    syncAudioToggleUI,
    updateStrideFootsteps,
    playUiTick,
    playPageTurn,
    playChoiceChime,
    playItemPickup,
    playBlacksmithAnvil,
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
