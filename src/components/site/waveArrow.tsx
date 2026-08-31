type WaveArrowProps = {
  className?: string;
};

/**
 * Renders a rightward arrow drawn as a travelling wave, in the inherited text
 * colour.
 *
 * @param props - Optional class names.
 */
function WaveArrow({ className }: WaveArrowProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 34 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 6q2.5-3.5 5 0t5 0t5 0t5 0t5 0t5 0" />
      <path d="M28 2.5 31.5 6 28 9.5" />
    </svg>
  );
}

export { WaveArrow };
