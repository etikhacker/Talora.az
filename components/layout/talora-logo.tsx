import Image from 'next/image';
import Link from 'next/link';

type TaloraLogoProps = {
  className?: string;
  inverted?: boolean;
  compact?: boolean;
};

export function TaloraLogo({ className = '', inverted = false, compact = false }: TaloraLogoProps) {
  return (
    <Link
      href="/"
      aria-label="Talora"
      className={`inline-flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${className}`}
    >
      <Image src="/talora-mark.svg" width={compact ? 34 : 40} height={compact ? 34 : 40} alt="" />
      <span
        className="font-sans text-[1.65rem] font-extrabold tracking-[-0.055em]"
        style={{ color: inverted ? '#ffffff' : 'var(--talora-ink, var(--ink))' }}
      >
        talora<span style={{ color: inverted ? '#c7d2fe' : 'var(--talora-cobalt, #4169e1)' }}>.</span>
      </span>
    </Link>
  );
}
