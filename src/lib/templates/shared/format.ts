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

/**
 * Formats an ISO timestamp as a short human-readable date.
 *
 * @param value - ISO timestamp, when the endpoint supplied one.
 * @returns A short date, or an empty string when unavailable.
 */
function formatDate(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? ''
    : new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
}

export { formatCount, formatDate };
