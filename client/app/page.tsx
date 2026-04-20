'use client';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section
        style={{
          minHeight: 'calc(100vh - 64px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 24px',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background:
              'radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            width: '300px',
            height: '300px',
            background:
              'radial-gradient(ellipse, rgba(6,182,212,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '100px',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: 'rgba(59, 130, 246, 0.08)',
            marginBottom: '32px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#3b82f6',
              boxShadow: '0 0 8px rgba(59,130,246,0.8)',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#3b82f6',
              letterSpacing: '0.05em',
            }}
          >
            NOW IN BETA
          </span>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 8vw, 88px)',
            fontWeight: 800,
            lineHeight: 1.0,
            letterSpacing: '-2px',
            maxWidth: '900px',
            marginBottom: '24px',
          }}
        >
          <span style={{ color: '#e8edf5' }}>Mail that moves</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            at your speed.
          </span>
        </h1>

        {/* Subheading */}
        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: '#6b7a99',
            maxWidth: '560px',
            marginBottom: '48px',
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          Gatling is a next-generation mail system built for teams who can not
          afford to lose time. Fast, secure, and beautifully simple.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          <Button href="/contact" variant="primary" size="lg">
            Get Early Access
          </Button>
          <Button href="/about" variant="outline" size="lg">
            Learn More →
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section
        style={{
          padding: '120px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '72px' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 52px)',
              fontWeight: 700,
              letterSpacing: '-1px',
              color: '#e8edf5',
              marginBottom: '16px',
            }}
          >
            Built different.
          </h2>
          <p
            style={{
              color: '#6b7a99',
              fontSize: '17px',
              maxWidth: '480px',
              margin: '0 auto',
            }}
          >
            Everything you need. Nothing you do not.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {[
            {
              icon: '⚡',
              title: 'Lightning Fast',
              desc: 'Emails delivered in milliseconds. No queues, no delays.',
            },
            {
              icon: '🔒',
              title: 'End-to-End Encrypted',
              desc: 'Your messages are private. Always. No exceptions.',
            },
            {
              icon: '🧠',
              title: 'Smart Filtering',
              desc: 'AI-powered inbox that learns what matters to you.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid rgba(99, 179, 237, 0.1)',
                background: 'rgba(22, 27, 39, 0.6)',
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(99, 179, 237, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>
                {feature.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#e8edf5',
                  marginBottom: '12px',
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{ color: '#6b7a99', fontSize: '15px', lineHeight: 1.7 }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
