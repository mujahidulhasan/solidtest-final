import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import './global.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'TesterPRO — Engineering Certification Simulator',
  description:
    'Professional SOLIDWORKS exam simulator with real-time timer, tolerance validation and detailed analytics.',
  icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script
          src="https://kit.fontawesome.com/66ce5ae449.js"
          crossOrigin="anonymous"
          async
        ></script>
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', Arial, sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
