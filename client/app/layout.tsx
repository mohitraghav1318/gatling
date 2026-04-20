import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Gatling — Modern Mail System',
  description: 'Fast, secure, and powerful email management for modern teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main style={{ minHeight: '100vh', paddingTop: '64px' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
