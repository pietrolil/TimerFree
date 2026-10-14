import { DEFAULT_CONFIG, validateConfig } from './timer-core.mjs';

const KEY = 'timerfree.config.v1';

export function loadConfig(storage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY));
    const result = validateConfig(saved);
    return result.value ?? DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveConfig(storage, config) {
  try {
    storage.setItem(KEY, JSON.stringify(config));
    return true;
  } catch {
    return false;
  }
}
