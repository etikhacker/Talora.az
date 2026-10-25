import Image from 'next/image';

const artworkRules: [RegExp, string][] = [
  [/mobile|mobil|android|ios/i, 'mobile'],
  [/ui.?ux|design|dizayn/i, 'design'],
  [/cyber|security|təhlükəsiz/i, 'security'],
  [/automation|avtomat/i, 'automation'],
  [/\bai\b|artificial|süni|machine learning/i, 'ai'],
  [/data|analyt|məlumat/i, 'data'],
  [/backend|back.end|server/i, 'backend'],
  [/frontend|front.end|web/i, 'frontend'],
];

export function ProgramArtwork({ title, category = '', sizes = '(max-width: 640px) 100vw, (max-width: 1100px) 50vw, 25vw' }: {
  title: string;
  category?: string | null;
  sizes?: string;
}) {
  const key = artworkRules.find(([pattern]) => pattern.test(`${title} ${category}`))?.[1] || 'frontend';
  return <span className="program-artwork" aria-hidden="true">
    <Image src={`/design/programs/${key}.webp`} alt="" fill sizes={sizes} className="program-artwork__image" />
  </span>;
}
