import { buildPhases, formatSeconds, plannedSeconds, validateConfig } from './timer-core.mjs';
import { TimerEngine } from './timer-engine.mjs';
import { loadConfig, saveConfig } from './storage.mjs';
import { createDeviceControls } from './device.mjs';

const $ = id => document.getElementById(id);
const timeFields = [
  ['exercise', 'exerciseSeconds', 'Tempo de cada exercício'],
  ['transition', 'transitionSeconds', 'Transição entre exercícios'],
  ['rest', 'restSeconds', 'Descanso entre sets']
];
const fieldNames = {
  exerciseSeconds: 'Tempo de cada exercício', transitionSeconds: 'Transição entre exercícios',
  restSeconds: 'Descanso entre sets', exerciseCount: 'Exercícios por set', setCount: 'Sets'
};

function splitTime(total) {
  return [Math.floor(total / 60), total % 60];
}

function fillForm(config) {
  for (const [prefix, key] of timeFields) {
    const [minutes, seconds] = splitTime(config[key]);
    $(`${prefix}Minutes`).value = minutes;
    $(`${prefix}Seconds`).value = seconds;
  }
  $('exerciseCount').value = config.exerciseCount;
  $('setCount').value = config.setCount;
}

function parseNumber(input, min, max) {
  const raw = input.value.trim();
  if (!/^\d+$/.test(raw)) return NaN;
  const number = Number(raw);
  return Number.isInteger(number) && number >= min && number <= max ? number : NaN;
}

function parseTime(prefix) {
  const minutes = parseNumber($(`${prefix}Minutes`), 0, 99);
  const seconds = parseNumber($(`${prefix}Seconds`), 0, 59);
  return minutes * 60 + seconds;
}

function readForm() {
  const raw = {
    exerciseSeconds: parseTime('exercise'),
    transitionSeconds: parseTime('transition'),
    restSeconds: parseTime('rest'),
    exerciseCount: parseNumber($('exerciseCount'), 1, 99),
    setCount: parseNumber($('setCount'), 1, 99)
  };
  return validateConfig(raw);
}

function showValidation(result, announce) {
  const invalid = new Set(Object.keys(result.errors));
  for (const [prefix, key] of timeFields) {
    for (const suffix of ['Minutes', 'Seconds']) {
      const input = $(`${prefix}${suffix}`);
      if (invalid.has(key)) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', 'fieldErrors');
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
  }
  for (const key of ['exerciseCount', 'setCount']) {
    const input = $(key);
    if (invalid.has(key)) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', 'fieldErrors');
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }
  const errorBox = $('fieldErrors');
  errorBox.hidden = !announce || invalid.size === 0;
  errorBox.textContent = invalid.size ?
    `Confira: ${[...invalid].map(key => fieldNames[key]).join(', ')}. Use minutos de 0 a 99, segundos de 0 a 59, exercício de pelo menos 00:01 e quantidades de 1 a 99.` : '';
  $('plannedTime').textContent = result.value ? formatSeconds(plannedSeconds(result.value)) : '--:--';
  return result.value;
}

const setup = $('setup');
const run = $('run');
const done = $('done');
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const device = createDeviceControls({
  requestWakeLock: navigator.wakeLock?.request ? () => navigator.wakeLock.request('screen') : null,
  createAudioContext: AudioContextClass ? () => new AudioContextClass() : null
});
fillForm(loadConfig(storage));
showValidation(readForm(), false);

let timer = null;
let config = null;
let refreshId = null;
let lastPhaseIndex = -1;
let deviceNotice = '';
let pauseMessage = '';

function updateNotice() {
  $('notice').textContent = [pauseMessage, deviceNotice].filter(Boolean).join(' ');
}

function addDeviceNotice(message) {
  if (!deviceNotice.includes(message)) deviceNotice = [deviceNotice, message].filter(Boolean).join(' ');
  updateNotice();
}

function activateDevice(activeTimer, playInitialCue) {
  // Call both APIs within the button handler; neither can block the workout.
  const audio = device.unlockAudio();
  const wake = device.keepAwake();
  void audio.then(ready => {
    if (timer !== activeTimer || timer?.snapshot(performance.now()).status !== 'running') return;
    if (!ready) addDeviceNotice('Som indisponível; acompanhe o contador visual.');
    else if (playInitialCue && timer.snapshot(performance.now()).phaseIndex === 0 && !device.playCue('phase')) {
      addDeviceNotice('Som indisponível; acompanhe o contador visual.');
    }
  });
  void wake.then(ready => {
    if (timer === activeTimer && timer.snapshot(performance.now()).status === 'running' && !ready) {
      addDeviceNotice('A tela pode apagar; mantenha o aparelho ativo.');
    }
  });
}

function clearRefresh() {
  if (refreshId !== null) clearInterval(refreshId);
  refreshId = null;
}

function show(view) {
  setup.hidden = view !== setup;
  run.hidden = view !== run;
  done.hidden = view !== done;
}

function describePhase(phase) {
  if (phase.kind === 'exercise') {
    let upNext = '';
    if (phase.exercise < config.exerciseCount) upNext = `Depois: exercício ${phase.exercise + 1}`;
    else if (phase.set < config.setCount) upNext = `Depois: descanso e set ${phase.set + 1}`;
    else upNext = 'Último exercício do treino';
    return {
      title: `Exercício ${phase.exercise}`,
      position: `Set ${phase.set}/${config.setCount} · Exercício ${phase.exercise}/${config.exerciseCount}`,
      upNext
    };
  }
  if (phase.kind === 'transition') {
    return {
      title: 'Transição',
      position: `Set ${phase.set}/${config.setCount}`,
      upNext: `Prepare-se para o exercício ${phase.nextExercise}`
    };
  }
  return {
    title: 'Descanso',
    position: `Set ${phase.set} concluído`,
    upNext: `O set ${phase.nextSet} começa automaticamente`
  };
}

function render(state) {
  if (!timer || state.status === 'complete') return;
  const phase = timer.phases[state.phaseIndex];
  const details = describePhase(phase);
  if (state.phaseIndex !== lastPhaseIndex) {
    $('phaseTitle').textContent = details.title;
    lastPhaseIndex = state.phaseIndex;
  }
  $('position').textContent = details.position;
  $('upNext').textContent = details.upNext;
  $('countdown').textContent = formatSeconds(Math.ceil(state.remainingMs / 1000));
  run.dataset.phase = phase.kind;
  run.dataset.status = state.status;
  $('pauseButton').textContent = state.status === 'paused' ? 'Continuar' : 'Pausar';
  pauseMessage = state.status === 'paused' ? (pauseMessage || 'Treino pausado. Toque em Continuar.') : '';
  updateNotice();
}

function completeWorkout() {
  clearRefresh();
  void device.releaseAwake();
  timer = null;
  show(done);
}

function refresh() {
  if (!timer) return;
  if (document.hidden) {
    pauseWorkout(true);
    return;
  }
  const { state, cue } = timer.tick(performance.now());
  if (cue && !device.playCue(cue)) addDeviceNotice('Som indisponível; acompanhe o contador visual.');
  if (cue === 'complete') {
    completeWorkout();
    return;
  }
  render(state);
}

function startRefresh() {
  clearRefresh();
  refreshId = setInterval(refresh, 100);
}

function startWorkout(nextConfig) {
  if (timer && ['running', 'paused'].includes(timer.snapshot(performance.now()).status)) return;
  config = nextConfig;
  timer = new TimerEngine(buildPhases(config));
  lastPhaseIndex = -1;
  deviceNotice = '';
  pauseMessage = '';
  const { state } = timer.start(performance.now());
  render(state);
  show(run);
  startRefresh();
}

function pauseWorkout(fromHidden = false) {
  if (!timer || timer.snapshot(performance.now()).status !== 'running') return;
  const state = timer.pause(performance.now());
  clearRefresh();
  void device.releaseAwake();
  if (state.status === 'complete') {
    device.playCue('complete');
    completeWorkout();
    return;
  }
  pauseMessage = fromHidden
    ? 'Treino pausado ao sair da página. Toque em Continuar.'
    : 'Treino pausado. Toque em Continuar.';
  render(state);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseWorkout(true);
});

setup.addEventListener('input', () => {
  const config = showValidation(readForm(), false);
  if (config) saveConfig(storage, config);
});
setup.addEventListener('submit', event => {
  event.preventDefault();
  const config = showValidation(readForm(), true);
  if (config) {
    saveConfig(storage, config);
    startWorkout(config);
    activateDevice(timer, true);
  }
});

$('pauseButton').addEventListener('click', () => {
  if (!timer) return;
  if (timer.snapshot(performance.now()).status === 'running') {
    pauseWorkout();
  } else if (timer.snapshot(performance.now()).status === 'paused') {
    activateDevice(timer, false);
    pauseMessage = '';
    render(timer.resume(performance.now()));
    startRefresh();
  }
});

$('endButton').addEventListener('click', () => {
  clearRefresh();
  timer?.stop();
  timer = null;
  void device.releaseAwake();
  show(setup);
});

$('restartButton').addEventListener('click', () => {
  show(setup);
});
