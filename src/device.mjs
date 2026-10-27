export function createDeviceControls({ requestWakeLock, createAudioContext, audioSession, onWakeRelease }) {
  let context = null;
  let audioReady = false;
  let sentinel = null;
  let wakePending = null;
  let wakeGeneration = 0;

  async function unlockAudio() {
    if (!createAudioContext) return false;
    // Mix timer cues with music from other apps instead of taking exclusive audio.
    // On iPhone this category respects silent mode; select it before opening audio.
    try { if (audioSession) audioSession.type = 'ambient'; }
    catch { /* Unsupported browsers retain their default audio behavior. */ }
    try {
      // Construct and resume before the first await so Safari sees the tap gesture.
      context ??= createAudioContext();
      const resumed = context.resume();
      await resumed;
      audioReady = true;
      return true;
    } catch {
      audioReady = false;
      return false;
    }
  }

  function playCue(kind) {
    if (!audioReady || !context || !['countdown', 'phase', 'complete'].includes(kind)) return false;
    try {
      const now = context.currentTime;
      const notes = kind === 'complete'
        ? [[660, 0, 0.24], [880, 0.3, 0.24], [1046, 0.6, 0.5]]
        : [[kind === 'countdown' ? 520 : 760, 0, 0.14]];
      for (const [frequency, offset, duration] of notes) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const start = now + offset;
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.16, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration - 0.01);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + duration);
      }
      return true;
    } catch {
      return false;
    }
  }

  async function keepAwake() {
    if (sentinel) return true;
    if (wakePending) return wakePending;
    if (!requestWakeLock) return false;
    const generation = wakeGeneration;
    const pending = (async () => {
      try {
        const granted = await requestWakeLock();
        if (generation !== wakeGeneration) {
          await granted.release();
          return false;
        }
        sentinel = granted;
        sentinel.addEventListener?.('release', () => {
          if (sentinel === granted) {
            sentinel = null;
            onWakeRelease?.();
          }
        });
        return true;
      } catch {
        return false;
      }
    })();
    wakePending = pending;
    try { return await pending; }
    finally { if (wakePending === pending) wakePending = null; }
  }

  async function releaseAwake() {
    wakeGeneration++;
    wakePending = null;
    const current = sentinel;
    sentinel = null;
    try { await current?.release(); } catch { /* The timer continues without Wake Lock. */ }
  }

  return { unlockAudio, playCue, keepAwake, releaseAwake };
}
