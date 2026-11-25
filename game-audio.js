(function () {
  const DEFAULT_TRACK = '683268__migfus20__relaxing-chiptune-music.mp3';
  const TARGET_VOLUME = 0.14; // Soft background level
  const STORAGE_TIME_KEY = 'rpg_bgm_time_v1';
  const STORAGE_TRACK_KEY = 'rpg_bgm_track_v1';
  const STORAGE_MUTED_KEY = 'rpg_muted_v1';

  function readMutedPref() {
    try {
      return sessionStorage.getItem(STORAGE_MUTED_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function writeMutedPref(muted) {
    try {
      sessionStorage.setItem(STORAGE_MUTED_KEY, muted ? '1' : '0');
    } catch (e) {}
  }

  function readSavedTime(trackSrc) {
    try {
      const savedTrack = sessionStorage.getItem(STORAGE_TRACK_KEY);
      if (savedTrack !== trackSrc) return 0;
      const raw = parseFloat(sessionStorage.getItem(STORAGE_TIME_KEY) || '0');
      return Number.isFinite(raw) && raw >= 0 ? raw : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeSavedTime(trackSrc, currentTime) {
    if (!Number.isFinite(currentTime) || currentTime < 0) return;
    try {
      sessionStorage.setItem(STORAGE_TRACK_KEY, trackSrc);
      sessionStorage.setItem(STORAGE_TIME_KEY, currentTime.toFixed(3));
    } catch (e) {}
  }

  class SharedMusicController {
    constructor() {
      this.trackSrc = DEFAULT_TRACK;
      this.targetVolume = TARGET_VOLUME;
      this.muted = readMutedPref();
      this.audio = null;
      this.hasRestoredTime = false;
      this.fadeTimer = null;
      this.saveTimer = null;

      this._createAudio(this.trackSrc);
      this._bindLifecycleEvents();
    }

    _createAudio(src) {
      if (this.audio) {
        this.audio.pause();
      }
      const el = new Audio(src);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      this.audio = el;
      this.hasRestoredTime = false;

      const applyResumePosition = () => {
        if (this.hasRestoredTime) return;
        const saved = readSavedTime(src);
        if (saved > 0 && el.duration && saved < el.duration - 0.25) {
          try {
            el.currentTime = saved;
          } catch (e) {}
        }
        this.hasRestoredTime = true;
      };

      el.addEventListener('loadedmetadata', applyResumePosition, { once: true });
      el.addEventListener('canplay', applyResumePosition, { once: true });
    }

    _fadeTo(targetVol, durationMs = 450) {
      if (!this.audio) return;
      clearInterval(this.fadeTimer);
      const startVol = this.audio.volume;
      const delta = targetVol - startVol;
      if (Math.abs(delta) < 0.002 || durationMs <= 0) {
        this.audio.volume = Math.max(0, Math.min(1, targetVol));
        return;
      }

      const steps = Math.max(1, Math.round(durationMs / 30));
      let step = 0;
      this.fadeTimer = setInterval(() => {
        step++;
        const progress = Math.min(1, step / steps);
        const eased = 1 - Math.pow(1 - progress, 2);
        this.audio.volume = Math.max(0, Math.min(1, startVol + delta * eased));
        if (progress >= 1) {
          clearInterval(this.fadeTimer);
          this.fadeTimer = null;
        }
      }, 30);
    }

    start(src = this.trackSrc, volume = this.targetVolume) {
      this.targetVolume = volume;
      if (src && src !== this.trackSrc) {
        this.savePositionNow();
        this.trackSrc = src;
        this._createAudio(src);
      }

      if (!this.audio) return;
      if (!this.hasRestoredTime && this.audio.readyState >= 1) {
        const saved = readSavedTime(this.trackSrc);
        if (saved > 0 && this.audio.duration && saved < this.audio.duration - 0.25) {
          try {
            this.audio.currentTime = saved;
          } catch (e) {}
        }
        this.hasRestoredTime = true;
      }

      if (this.muted) {
        this.audio.volume = 0;
        return;
      }

      if (this.audio.paused) {
        const playPromise = this.audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {});
        }
      }
      this._fadeTo(this.targetVolume, 450);
    }

    setMuted(muted) {
      this.muted = Boolean(muted);
      writeMutedPref(this.muted);
      this.savePositionNow();

      if (!this.audio) return;
      if (this.muted) {
        this._fadeTo(0, 180);
      } else {
        if (this.audio.paused) {
          const playPromise = this.audio.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(() => {});
          }
        }
        this._fadeTo(this.targetVolume, 350);
      }
    }

    isMuted() {
      return this.muted;
    }

    savePositionNow() {
      if (!this.audio) return;
      writeSavedTime(this.trackSrc, this.audio.currentTime);
    }

    prepareSceneTransition() {
      this.savePositionNow();
      if (this.audio && !this.muted) {
        this._fadeTo(this.targetVolume * 0.65, 350);
      }
    }

    _bindLifecycleEvents() {
      clearInterval(this.saveTimer);
      this.saveTimer = setInterval(() => {
        if (this.audio && !this.audio.paused) {
          this.savePositionNow();
        }
      }, 250);

      window.addEventListener('pagehide', () => this.savePositionNow());
      window.addEventListener('beforeunload', () => this.savePositionNow());
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.savePositionNow();
        } else if (!this.muted && this.audio && this.audio.paused) {
          this.start(this.trackSrc, this.targetVolume);
        }
      });
    }
  }

  window.GameAudio = new SharedMusicController();
})();
