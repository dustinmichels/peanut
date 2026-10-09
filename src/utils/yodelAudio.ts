const YODEL_URL = `${import.meta.env.BASE_URL}audio/cowboy-yodel.mp3`;

export interface YodelHandle {
  stop: () => void;
  finished: Promise<void>;
  readonly isPlaying: boolean;
}

let currentAudio: HTMLAudioElement | null = null;
let resolveCurrent: (() => void) | null = null;

function clearCurrent(audio: HTMLAudioElement): void {
  audio.onended = null;
  audio.onerror = null;

  if (currentAudio === audio) {
    currentAudio = null;
    const resolve = resolveCurrent;
    resolveCurrent = null;
    resolve?.();
  }
}

export function isYodelPlaying(): boolean {
  return currentAudio !== null;
}

export function stopYodel(): void {
  const audio = currentAudio;
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  clearCurrent(audio);
}

/** Plays a short recording of a human yodeler. */
export function playYodel(volume = 0.85): YodelHandle {
  stopYodel();

  if (typeof Audio === "undefined") {
    return {
      stop: () => {},
      finished: Promise.resolve(),
      isPlaying: false,
    };
  }

  const audio = new Audio(YODEL_URL);
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, volume));
  currentAudio = audio;

  const finished = new Promise<void>((resolve) => {
    resolveCurrent = resolve;
  });
  const finish = () => clearCurrent(audio);
  audio.onended = finish;
  audio.onerror = finish;
  void audio.play().catch(finish);

  return {
    stop: stopYodel,
    finished,
    get isPlaying() {
      return currentAudio === audio;
    },
  };
}
