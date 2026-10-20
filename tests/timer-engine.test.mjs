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

test('pause just after a boundary captures the new phase', () => {
  const timer = new TimerEngine(phases);
  timer.start(0);
  assert.deepEqual(timer.pause(2010), { status: 'paused', phaseIndex: 1, remainingMs: 990 });
  assert.deepEqual(timer.snapshot(100000), { status: 'paused', phaseIndex: 1, remainingMs: 990 });
});

test('stop resets and prevents stale ticks from advancing', () => {
  const timer = new TimerEngine(phases);
  timer.start(0);
  timer.stop();
  assert.deepEqual(timer.tick(100000), {
    state: { status: 'idle', phaseIndex: 0, remainingMs: 2000 }, cue: null
  });
});

for (const kind of ['exercise', 'transition', 'rest']) {
  test(`${kind} cues each of the final five seconds only once`, () => {
    const timer = new TimerEngine([{ kind, seconds: 8 }]);
    assert.equal(timer.start(0).cue, 'phase');
    assert.equal(timer.tick(2999).cue, null);
    for (const now of [3000, 4000, 5000, 6000, 7000]) {
      assert.equal(timer.tick(now).cue, 'countdown');
      assert.equal(timer.tick(now + 100).cue, null);
    }
    assert.equal(timer.tick(8000).cue, 'complete');
    assert.equal(timer.tick(8100).cue, null);
  });
}

test('preparation cues 3, 2, 1 before every set without doubling the entry cue', () => {
  const timer = new TimerEngine([
    { kind: 'prepare', seconds: 3, set: 1 },
    { kind: 'exercise', seconds: 1, set: 1 },
    { kind: 'prepare', seconds: 3, set: 2 },
    { kind: 'exercise', seconds: 1, set: 2 }
  ]);
  assert.equal(timer.start(0).cue, 'phase');
  for (const [now, want] of [
    [100, null], [1000, 'countdown'], [2000, 'countdown'],
    [3000, 'phase'], [3100, null], [4000, 'phase'],
    [4100, null], [5000, 'countdown'], [6000, 'countdown'],
    [7000, 'phase'], [7100, null], [8000, 'complete']
  ]) assert.equal(timer.tick(now).cue, want, `at ${now}ms`);
});

test('late ticks play only the current countdown second without replaying missed beeps', () => {
  const timer = new TimerEngine([{ kind: 'exercise', seconds: 8 }]);
  timer.start(0);
  assert.equal(timer.tick(6100).cue, 'countdown');
  assert.equal(timer.tick(6200).cue, null);
  assert.equal(timer.tick(7000).cue, 'countdown');
  assert.equal(timer.tick(20000).cue, 'complete');
});

test('pause and resume in the final seconds do not repeat a beep or play while paused', () => {
  const timer = new TimerEngine([{ kind: 'exercise', seconds: 8 }]);
  timer.start(0);
  assert.equal(timer.tick(3000).cue, 'countdown');
  timer.pause(3500);
  assert.equal(timer.tick(15000).cue, null);
  timer.resume(15000);
  assert.equal(timer.tick(15100).cue, null);
  assert.equal(timer.tick(15500).cue, 'countdown');
});

test('restart resets countdown cues for a new workout', () => {
  const timer = new TimerEngine([{ kind: 'exercise', seconds: 6 }]);
  timer.start(0);
  assert.equal(timer.tick(1000).cue, 'countdown');
  timer.stop();
  assert.equal(timer.tick(2000).cue, null);
  timer.start(10000);
  assert.equal(timer.tick(11000).cue, 'countdown');
});

test('pausing across a second boundary keeps the unheard countdown cue for resume', () => {
  const timer = new TimerEngine([{ kind: 'exercise', seconds: 8 }]);
  timer.start(0);
  assert.equal(timer.tick(2950).cue, null);
  timer.pause(3020);
  assert.equal(timer.tick(9000).cue, null);
  timer.resume(10000);
  assert.equal(timer.tick(10010).cue, 'countdown');
  assert.equal(timer.tick(10100).cue, null);
  assert.equal(timer.tick(10980).cue, 'countdown');
});
