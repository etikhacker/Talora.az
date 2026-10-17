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
      <span className={`font-sans text-[1.65rem] font-extrabold tracking-[-0.055em] ${inverted ? 'text-white' : 'text-slate-950 dark:text-white'}`}>
        talora<span className={inverted ? 'text-blue-200' : 'text-blue-600 dark:text-blue-300'}>.</span>
      </span>
    </Link>
  );
}
