import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_CONFIG,
  buildPhases,
  formatSeconds,
  plannedSeconds,
  validateConfig,
} from '../src/timer-core.mjs';

const config = {
  exerciseSeconds: 30,
  transitionSeconds: 10,
  restSeconds: 60,
  exerciseCount: 2,
  setCount: 2,
};

test('two exercises and two sets have only internal gaps', () => {
  assert.deepEqual(buildPhases(config), [
    { kind: 'prepare', seconds: 3, set: 1 },
    { kind: 'exercise', seconds: 30, set: 1, exercise: 1 },
    { kind: 'transition', seconds: 10, set: 1, nextExercise: 2 },
    { kind: 'exercise', seconds: 30, set: 1, exercise: 2 },
    { kind: 'rest', seconds: 60, set: 1, nextSet: 2 },
    { kind: 'prepare', seconds: 3, set: 2 },
    { kind: 'exercise', seconds: 30, set: 2, exercise: 1 },
    { kind: 'transition', seconds: 10, set: 2, nextExercise: 2 },
    { kind: 'exercise', seconds: 30, set: 2, exercise: 2 },
  ]);
  assert.equal(plannedSeconds(config), 206);
});

test('zero gaps and one exercise never emit zero-length phases', () => {
  const phases = buildPhases({
    ...config,
    transitionSeconds: 0,
    restSeconds: 0,
    exerciseCount: 1,
  });
  assert.deepEqual(phases, [
    { kind: 'prepare', seconds: 3, set: 1 },
    { kind: 'exercise', seconds: 30, set: 1, exercise: 1 },
    { kind: 'prepare', seconds: 3, set: 2 },
    { kind: 'exercise', seconds: 30, set: 2, exercise: 1 },
  ]);
});

test('one exercise and one set ends without a gap', () => {
  assert.deepEqual(buildPhases({ ...config, exerciseCount: 1, setCount: 1 }), [
    { kind: 'prepare', seconds: 3, set: 1 },
    { kind: 'exercise', seconds: 30, set: 1, exercise: 1 },
  ]);
});

test('planned duration includes no final rest', () => {
  assert.equal(plannedSeconds({ ...config, exerciseCount: 1, setCount: 1 }), 33);
});

test('time display uses minutes and seconds', () => {
  assert.equal(formatSeconds(125), '02:05');
  assert.equal(formatSeconds(0), '00:00');
});

test('valid numeric and digit-string values normalize to numbers', () => {
  assert.deepEqual(validateConfig({
    exerciseSeconds: '30', transitionSeconds: '10', restSeconds: '60',
    exerciseCount: '2', setCount: '2',
  }), { value: config, errors: {} });
});

test('blank, negative, decimal and out-of-range counts are rejected', () => {
  for (const bad of ['', '-1', '1.5', '100']) {
    const result = validateConfig({ ...config, exerciseCount: bad });
    assert.equal(result.value, null);
    assert.ok(result.errors.exerciseCount);
  }
});

test('duration limits are exact', () => {
  assert.deepEqual(validateConfig({ ...config, exerciseSeconds: 5999 }).errors, {});
  assert.ok(validateConfig({ ...config, exerciseSeconds: 0 }).errors.exerciseSeconds);
  assert.ok(validateConfig({ ...config, restSeconds: 6000 }).errors.restSeconds);
});

test('missing config is rejected and defaults are valid', () => {
  assert.equal(validateConfig(null).value, null);
  assert.deepEqual(validateConfig(DEFAULT_CONFIG).errors, {});
});
