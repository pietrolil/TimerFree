export class TimerEngine {
  constructor(phases) {
    if (!Array.isArray(phases) || phases.length === 0 ||
        phases.some(phase => !Number.isFinite(phase.seconds) || phase.seconds <= 0)) {
      throw new TypeError('At least one positive-duration phase is required.');
    }
    this.phases = phases;
    this.status = 'idle';
    this.phaseIndex = 0;
    this.remainingMs = phases[0].seconds * 1000;
    this.deadlineMs = null;
    this.lastCueSecond = null;
  }

  snapshot(nowMs) {
    return {
      status: this.status,
      phaseIndex: this.phaseIndex,
      remainingMs: this.status === 'running'
        ? Math.max(0, this.deadlineMs - nowMs)
        : this.remainingMs
    };
  }

  start(nowMs) {
    if (this.status !== 'idle') return { state: this.snapshot(nowMs), cue: null };
    this.status = 'running';
    this.deadlineMs = nowMs + this.remainingMs;
    this.lastCueSecond = Math.ceil(this.remainingMs / 1000);
    return { state: this.snapshot(nowMs), cue: 'phase' };
  }

  tick(nowMs) {
    let entered = false;
    while (this.status === 'running' && nowMs >= this.deadlineMs) {
      this.phaseIndex++;
      if (this.phaseIndex === this.phases.length) {
        this.status = 'complete';
        this.remainingMs = 0;
        this.deadlineMs = null;
        return { state: this.snapshot(nowMs), cue: 'complete' };
      }
      this.deadlineMs += this.phases[this.phaseIndex].seconds * 1000;
      entered = true;
    }
    const state = this.snapshot(nowMs);
    let cue = null;
    if (state.status === 'running') {
      const second = Math.ceil(state.remainingMs / 1000);
      // An entry cue also covers the first second of short phases.
      if (entered) cue = 'phase';
      else if (second <= 5 && second > 0 && second !== this.lastCueSecond) cue = 'countdown';
      this.lastCueSecond = second;
    }
    return { state, cue };
  }

  pause(nowMs) {
    if (this.status !== 'running') return this.snapshot(nowMs);
    const previousPhaseIndex = this.phaseIndex;
    const previousCueSecond = this.lastCueSecond;
    this.tick(nowMs);
    // Pausing does not play cues; keep an unheard second eligible on resume.
    if (this.phaseIndex === previousPhaseIndex) this.lastCueSecond = previousCueSecond;
    if (this.status === 'running') {
      this.remainingMs = Math.max(0, this.deadlineMs - nowMs);
      this.deadlineMs = null;
      this.status = 'paused';
    }
    return this.snapshot(nowMs);
  }

  resume(nowMs) {
    if (this.status !== 'paused') return this.snapshot(nowMs);
    this.status = 'running';
    this.deadlineMs = nowMs + this.remainingMs;
    return this.snapshot(nowMs);
  }

  stop() {
    this.status = 'idle';
    this.phaseIndex = 0;
    this.remainingMs = this.phases[0].seconds * 1000;
    this.deadlineMs = null;
    this.lastCueSecond = null;
    return this.snapshot(0);
  }
}
