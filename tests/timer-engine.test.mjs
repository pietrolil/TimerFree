import test from 'node:test';
import assert from 'node:assert/strict';
import { TimerEngine } from '../src/timer-engine.mjs';

const phases = [
  { kind: 'exercise', seconds: 2, set: 1, exercise: 1 },
  { kind: 'transition', seconds: 1, set: 1, nextExercise: 2 },
  { kind: 'exercise', seconds: 2, set: 1, exercise: 2 }
];

test('a late tick crosses multiple phases without drifting or cue bursts', () => {
  const timer = new TimerEngine(phases);
  timer.start(1000);
  assert.deepEqual(timer.tick(4500), {
    state: { status: 'running', phaseIndex: 2, remainingMs: 1500 }, cue: 'phase'
  });
  assert.equal(timer.tick(4500).cue, null);
});

test('pause freezes remaining time until manual resume', () => {
  const timer = new TimerEngine(phases);
  timer.start(0);
  timer.pause(1500);
  assert.deepEqual(timer.snapshot(9000), { status: 'paused', phaseIndex: 0, remainingMs: 500 });
  timer.resume(9000);
  assert.equal(timer.tick(9499).state.phaseIndex, 0);
  assert.equal(timer.tick(9500).state.phaseIndex, 1);
});

test('repeated controls and completion never emit duplicate cues', () => {
  const timer = new TimerEngine(phases);
  assert.equal(timer.start(0).cue, 'phase');
  assert.equal(timer.start(0).cue, null);
  timer.pause(500);
  timer.pause(500);
  timer.resume(1000);
  timer.resume(1000);
  assert.equal(timer.tick(5500).cue, 'complete');
  assert.equal(timer.tick(6000).cue, null);
  assert.equal(timer.snapshot(6000).status, 'complete');
});

test('hiding just before a boundary holds that phase', () => {
  const timer = new TimerEngine(phases);
  timer.start(0);
  timer.pause(1990);
  assert.equal(timer.snapshot(100000).phaseIndex, 0);
  assert.equal(timer.snapshot(100000).remainingMs, 10);
});

test('stop resets and prevents stale ticks from advancing', () => {
  const timer = new TimerEngine(phases);
  timer.start(0);
  timer.stop();
  assert.deepEqual(timer.tick(100000), {
    state: { status: 'idle', phaseIndex: 0, remainingMs: 2000 }, cue: null
  });
});
