import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeviceControls } from '../src/device.mjs';

test('missing device APIs are nonfatal', async () => {
  const device = createDeviceControls({ requestWakeLock: null, createAudioContext: null });
  assert.equal(await device.unlockAudio(), false);
  assert.equal(await device.keepAwake(), false);
  assert.equal(device.playCue('phase'), false);
  await device.releaseAwake();
});

test('granted wake lock is released once', async () => {
  let releases = 0;
  const device = createDeviceControls({
    requestWakeLock: async () => ({ release: async () => { releases++; } }),
    createAudioContext: null
  });
  assert.equal(await device.keepAwake(), true);
  await device.releaseAwake();
  await device.releaseAwake();
  assert.equal(releases, 1);
});

test('external wake-lock revocation is reported, manual release is not', async () => {
  let released;
  let notices = 0;
  const sentinel = {
    addEventListener: (_event, callback) => { released = callback; },
    release: async () => { released(); }
  };
  const device = createDeviceControls({
    requestWakeLock: async () => sentinel,
    createAudioContext: null,
    onWakeRelease: () => { notices++; }
  });
  await device.keepAwake();
  released();
  assert.equal(notices, 1);
  await device.keepAwake();
  await device.releaseAwake();
  assert.equal(notices, 1);
});

test('late wake-lock grant after pause is released', async () => {
  let grant;
  let releases = 0;
  const device = createDeviceControls({
    requestWakeLock: () => new Promise(resolve => { grant = resolve; }),
    createAudioContext: null
  });
  const pending = device.keepAwake();
  await device.releaseAwake();
  grant({ release: async () => { releases++; } });
  assert.equal(await pending, false);
  assert.equal(releases, 1);
});

test('resume can request a new lock while the old request is still pending', async () => {
  const grants = [];
  let releases = 0;
  const device = createDeviceControls({
    requestWakeLock: () => new Promise(resolve => { grants.push(resolve); }),
    createAudioContext: null
  });
  const first = device.keepAwake();
  await device.releaseAwake();
  const second = device.keepAwake();
  assert.equal(grants.length, 2);
  grants[0]({ release: async () => { releases++; } });
  grants[1]({ release: async () => { releases++; } });
  assert.equal(await first, false);
  assert.equal(await second, true);
  await device.releaseAwake();
  assert.equal(releases, 2);
});

test('audio cannot play before unlock and rejected resume is reported', async () => {
  const device = createDeviceControls({
    requestWakeLock: null,
    createAudioContext: () => ({ resume: async () => { throw Error('blocked'); } })
  });
  assert.equal(device.playCue('phase'), false);
  assert.equal(await device.unlockAudio(), false);
  assert.equal(device.playCue('phase'), false);
});

test('unlocked audio plays one short pattern for a phase', async () => {
  let starts = 0;
  const context = {
    currentTime: 1,
    destination: {},
    resume: async () => {},
    createOscillator: () => ({ frequency: { setValueAtTime: () => {} }, connect: () => {}, start: () => { starts++; }, stop: () => {} }),
    createGain: () => ({ gain: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} })
  };
  const device = createDeviceControls({ requestWakeLock: null, createAudioContext: () => context });
  assert.equal(await device.unlockAudio(), true);
  assert.equal(device.playCue('phase'), true);
  assert.equal(starts, 1);
});
