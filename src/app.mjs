import { formatSeconds, plannedSeconds, validateConfig } from './timer-core.mjs';
import { loadConfig, saveConfig } from './storage.mjs';

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
let storage;
try { storage = window.localStorage; } catch { storage = null; }
fillForm(loadConfig(storage));
showValidation(readForm(), false);
setup.addEventListener('input', () => {
  const config = showValidation(readForm(), false);
  if (config) saveConfig(storage, config);
});
setup.addEventListener('submit', event => {
  event.preventDefault();
  const config = showValidation(readForm(), true);
  if (config) saveConfig(storage, config);
});
