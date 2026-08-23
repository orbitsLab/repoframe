/**
 * Applies template settings over their defaults.
 *
 * @param defaults - Complete default setting values.
 * @param settings - User-provided setting overrides.
 * @returns The merged setting values.
 */
function mergeSettings(
  defaults: Record<string, unknown>,
  settings: Record<string, unknown>,
) {
  return { ...defaults, ...settings };
}

/**
 * Reads a string setting with an empty-string fallback.
 *
 * @param settings - Resolved template settings.
 * @param key - Setting key to read.
 * @returns The string value or an empty string.
 */
function stringSetting(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return typeof value === 'string' ? value : '';
}

/**
 * Reads a numeric setting with a zero fallback.
 *
 * @param settings - Resolved template settings.
 * @param key - Setting key to read.
 * @returns The numeric value or zero.
 */
function numberSetting(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return typeof value === 'number' ? value : 0;
}

/**
 * Reads whether a setting is explicitly enabled.
 *
 * @param settings - Resolved template settings.
 * @param key - Setting key to read.
 * @returns Whether the stored value is true.
 */
function booleanSetting(settings: Record<string, unknown>, key: string) {
  return settings[key] === true;
}

/**
 * Reads a string-array setting and removes non-string entries.
 *
 * @param settings - Resolved template settings.
 * @param key - Setting key to read.
 * @returns The sanitized string values.
 */
function stringArraySetting(settings: Record<string, unknown>, key: string) {
  const value = settings[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export {
  booleanSetting,
  mergeSettings,
  numberSetting,
  stringArraySetting,
  stringSetting,
};
