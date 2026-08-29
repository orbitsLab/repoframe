/** Total number of numbered sections on the landing page. */
const sectionCount = 5;

type SectionMarkerProps = {
  /** One-based position, printed against the total. */
  index: number;
  /** Name of the section this marker closes. */
  label: string;
  /** Name of the section below, omitted on the last one. */
  next?: string;
};

/**
 * Prints the running section count along the bottom edge of a section, with a
 * pointer to whatever comes next.
 *
 * Rules and text are drawn from the inherited colour, so the marker reads in
 * either theme.
 *
 * @param props - Section position, its name, and the name of the next one.
 */
function SectionMarker({ index, label, next }: SectionMarkerProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-baseline justify-between gap-6 border-current/15 border-t py-5">
          <p className="site-data whitespace-nowrap text-current/50">
            <span className="text-current/90">
              {String(index).padStart(3, '0')}
            </span>{' '}
            / {String(sectionCount).padStart(3, '0')} — {label}
          </p>
          {next ? (
            <p className="site-data hidden truncate text-current/50 sm:block">
              Next — {next} <span aria-hidden="true">↓</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export { SectionMarker, sectionCount };
