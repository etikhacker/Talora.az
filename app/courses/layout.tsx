import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Courses | Talora',
  description: 'Explore practical courses in software development, AI, business and design on Talora.',
  robots: { index: true, follow: true },
};
export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
