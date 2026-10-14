import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG } from '../src/timer-core.mjs';
import { loadConfig, saveConfig } from '../src/storage.mjs';

test('broken saved JSON falls back to defaults', () => {
  assert.deepEqual(loadConfig({ getItem: () => '{broken' }), DEFAULT_CONFIG);
});

test('out-of-range and incomplete saved data are ignored', () => {
  for (const value of [{ ...DEFAULT_CONFIG, setCount: 100 }, { exerciseCount: 2 }]) {
    assert.deepEqual(loadConfig({ getItem: () => JSON.stringify(value) }), DEFAULT_CONFIG);
  }
});

test('storage rejection cannot stop a workout', () => {
  const storage = { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } };
  assert.deepEqual(loadConfig(storage), DEFAULT_CONFIG);
  assert.equal(saveConfig(storage, DEFAULT_CONFIG), false);
});

test('valid configuration round-trips', () => {
  let saved = null;
  const storage = { getItem: () => saved, setItem: (_key, value) => { saved = value; } };
  assert.equal(saveConfig(storage, DEFAULT_CONFIG), true);
  assert.deepEqual(loadConfig(storage), DEFAULT_CONFIG);
});
