type Props = {
  size?: number;
  withWordmark?: boolean;
  className?: string;
};

/**
 * Cyster mark: a uterus outline whose top loop and crossing tails form an
 * awareness ribbon, with fallopian tubes ending in ovaries. One color, currentColor.
 */
export default function Logo({ size = 32, withWordmark = false, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${className}`}
      role={withWordmark ? undefined : 'img'}
      aria-label={withWordmark ? undefined : 'Cyster'}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        className="text-rose-deep"
      >
        <path d="M32 44 C20 36 18 18 32 16 C46 18 44 36 32 44 Z" />
        <path d="M32 44 L39 57 M32 44 L25 57" />
        <path d="M24 20 C19 15 12 17 11 24 M40 20 C45 15 52 17 53 24" />
        <circle cx="11" cy="27" r="3" />
        <circle cx="53" cy="27" r="3" />
      </svg>
      {withWordmark && (
        <span className="text-lg font-semibold tracking-wide text-lavender-deep">cyster</span>
      )}
    </span>
  );
}
