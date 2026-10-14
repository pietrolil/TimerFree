export const DEFAULT_CONFIG = Object.freeze({
  exerciseSeconds: 30,
  transitionSeconds: 15,
  restSeconds: 60,
  exerciseCount: 4,
  setCount: 3,
});

export const SET_PREP_SECONDS = 3;

const LIMITS = {
  exerciseSeconds: [1, 5999],
  transitionSeconds: [0, 5999],
  restSeconds: [0, 5999],
  exerciseCount: [1, 99],
  setCount: [1, 99],
};

export function validateConfig(raw) {
  const value = {};
  const errors = {};

  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const input = raw?.[key];
    const number = typeof input === 'number'
      ? input
      : typeof input === 'string' && /^\d+$/.test(input.trim())
        ? Number(input.trim())
        : NaN;

    if (!Number.isInteger(number) || number < min || number > max) {
      errors[key] = `Use um valor inteiro de ${min} a ${max}.`;
    } else {
      value[key] = number;
    }
  }

  return {
    value: Object.keys(errors).length ? null : value,
    errors,
  };
}

export function plannedSeconds(config) {
  return config.setCount * (
    SET_PREP_SECONDS + config.exerciseCount * config.exerciseSeconds
    + (config.exerciseCount - 1) * config.transitionSeconds
  ) + (config.setCount - 1) * config.restSeconds;
}

export function formatSeconds(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function buildPhases(config) {
  const phases = [];

  for (let set = 1; set <= config.setCount; set += 1) {
    phases.push({ kind: 'prepare', seconds: SET_PREP_SECONDS, set });
    for (let exercise = 1; exercise <= config.exerciseCount; exercise += 1) {
      phases.push({ kind: 'exercise', seconds: config.exerciseSeconds, set, exercise });

      if (exercise < config.exerciseCount && config.transitionSeconds > 0) {
        phases.push({
          kind: 'transition',
          seconds: config.transitionSeconds,
          set,
          nextExercise: exercise + 1,
        });
      }
    }

    if (set < config.setCount && config.restSeconds > 0) {
      phases.push({ kind: 'rest', seconds: config.restSeconds, set, nextSet: set + 1 });
    }
  }

  return phases;
}
