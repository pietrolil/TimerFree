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
    return { state: this.snapshot(nowMs), cue: entered ? 'phase' : null };
  }

  pause(nowMs) {
    if (this.status !== 'running') return this.snapshot(nowMs);
    this.tick(nowMs);
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
    return this.snapshot(0);
  }
}
