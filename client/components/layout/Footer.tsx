'use client';
import Link from 'next/link';

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
];

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid rgba(99, 179, 237, 0.08)',
        background: 'rgba(8, 10, 15, 0.8)',
        padding: '48px 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '20px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #e8edf5 0%, #3b82f6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Gatling
        </span>

        {/* Links */}
        <nav style={{ display: 'flex', gap: '32px' }}>
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{
                fontSize: '14px',
                color: '#6b7a99',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#e8edf5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7a99')}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Copyright */}
        <p
          style={{
            fontSize: '13px',
            color: '#3d4a66',
          }}
        >
          © {new Date().getFullYear()} Gatling. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
