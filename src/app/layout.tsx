import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: '야또샀냐 — 너의 소비, 내가 좀 볼게',
  description: '일단 말해봐. 안 혼낼게 ㅋㅋ 소비를 입력하고 잼민이의 한마디를 받아보세요.',
  openGraph: { title: '야또샀냐', description: '너의 소비, 내가 좀 볼게. 소비 심판받으러 가기', locale: 'ko_KR', type: 'website' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#faf9f7' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
