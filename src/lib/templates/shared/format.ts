/**
 * Formats a repository metric for display in a template.
 *
 * @param value - Metric value, when the endpoint supplied one.
 * @returns A localized count, compact count, or placeholder.
 */
function formatCount(value?: number) {
  if (value === undefined) {
    return '—';
  }

  return new Intl.NumberFormat('en', {
    notation: value >= 10_000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

export { formatCount };
