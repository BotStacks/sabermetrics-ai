interface IconProps {
  size?: number;
  className?: string;
}

/** Baseball with its two seams — the product mark. */
export function BaseballMark({ size = 26, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="1.8" />
      <path
        d="M7.2 6.6c3.2 2.6 4.9 5.8 4.9 9.4s-1.7 6.8-4.9 9.4"
        stroke="var(--seam)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M24.8 6.6c-3.2 2.6-4.9 5.8-4.9 9.4s1.7 6.8 4.9 9.4"
        stroke="var(--seam)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
