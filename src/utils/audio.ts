// Web Audio API Sound Effects and Ambient Romantic Music Engine

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Sound Effects
export const playKeySound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle soft key pop
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Ignore audio error
  }
};

export const playPasscodeSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.4);
    });
  } catch (e) {
    // Ignore
  }
};

export const playPullCordSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore
  }
};

export const playLampIgniteSound = () => {
  try {
    const ctx = getAudioContext();
    // Warm gentle bell sound
    const notes = [440, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
      gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.8);
    });
  } catch (e) {
    // Ignore
  }
};

export const playCakeSliceSound = () => {
  try {
    const ctx = getAudioContext();
    // Sparkly chime glissando
    const chimes = [587.33, 739.99, 880, 1174.66, 1318.51, 1567.98];
    chimes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.06 + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.06);
      osc.stop(ctx.currentTime + i * 0.06 + 0.5);
    });
  } catch (e) {
    // Ignore
  }
};

export const playEnvelopeOpenSound = () => {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Ignore
  }
};

// Ambient Romantic Melody Generator
class RomanticMusicPlayer {
  private isPlaying = false;
  private timer: number | null = null;
  private noteIndex = 0;
  private volume = 0.35;
  private audioElement: HTMLAudioElement | null = null;
  private isCustomAudio = false;

  // Romantic progression: Cmaj7 -> Am7 -> Fmaj7 -> G7 (sweet arpeggio)
  private chords = [
    [261.63, 329.63, 392.00, 493.88], // C E G B
    [220.00, 261.63, 329.63, 392.00], // A C E G
    [174.61, 220.00, 261.63, 329.63], // F A C E
    [196.00, 246.94, 293.66, 392.00], // G B D G
  ];

  setCustomAudio(url?: string) {
    if (url) {
      if (!this.audioElement) {
        this.audioElement = new Audio();
        this.audioElement.loop = true;
      }
      this.audioElement.src = url;
      this.audioElement.volume = this.volume;
      this.isCustomAudio = true;
      if (this.isPlaying) {
        this.audioElement.play().catch(() => {});
      }
    } else {
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement = null;
      }
      this.isCustomAudio = false;
    }
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
  }

  getVolume() {
    return this.volume;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    window.dispatchEvent(new Event('dearli:music-state'));

    if (this.isCustomAudio && this.audioElement) {
      this.audioElement.play().catch(() => {});
      return;
    }

    // Synthesized gentle music box / romantic chimes
    const scheduleNextNote = () => {
      if (!this.isPlaying || this.isCustomAudio) return;
      try {
        const ctx = getAudioContext();
        const chordIdx = Math.floor((this.noteIndex / 8) % this.chords.length);
        const chord = this.chords[chordIdx];
        const pitch = chord[this.noteIndex % chord.length] * (this.noteIndex % 2 === 0 ? 1 : 2);

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = this.noteIndex % 4 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);

        const noteVol = this.volume * 0.08;
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(noteVol, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.85);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.9);

        this.noteIndex++;
      } catch (e) {
        // Audio suspended or disabled
      }

      this.timer = window.setTimeout(scheduleNextNote, 320);
    };

    scheduleNextNote();
  }

  pause() {
    this.isPlaying = false;
    window.dispatchEvent(new Event('dearli:music-state'));
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }
}

export const musicPlayer = new RomanticMusicPlayer();
