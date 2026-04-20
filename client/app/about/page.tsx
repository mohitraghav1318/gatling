export default function AboutPage() {
  return (
    <div style={{ padding: '80px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ maxWidth: '720px', marginBottom: '96px' }}>
        <p
          style={{
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: '#3b82f6',
            marginBottom: '20px',
            textTransform: 'uppercase',
          }}
        >
          About Gatling
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-2px',
            lineHeight: 1.0,
            color: '#e8edf5',
            marginBottom: '28px',
          }}
        >
          We are rethinking
          <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            how email works.
          </span>
        </h1>
        <p
          style={{
            fontSize: '18px',
            color: '#6b7a99',
            lineHeight: 1.8,
            fontWeight: 300,
          }}
        >
          Gatling was born from frustration. Email has not truly evolved in
          decades. We believe your inbox should work for you — not the other way
          around.
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(99, 179, 237, 0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          marginBottom: '96px',
        }}
      >
        {[
          { value: '10ms', label: 'Average delivery time' },
          { value: '99.9%', label: 'Uptime guarantee' },
          { value: '256-bit', label: 'AES encryption' },
          { value: '2024', label: 'Founded' },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: '40px 32px',
              background: 'rgba(13, 17, 23, 0.9)',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '40px',
                fontWeight: 800,
                color: '#3b82f6',
                marginBottom: '8px',
                letterSpacing: '-1px',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7a99' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Mission */}
      <div
        style={{
          padding: '64px',
          borderRadius: '20px',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          background:
            'linear-gradient(135deg, rgba(59,130,246,0.05) 0%, rgba(6,182,212,0.05) 100%)',
          marginBottom: '96px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 700,
            color: '#e8edf5',
            marginBottom: '20px',
            letterSpacing: '-0.5px',
          }}
        >
          Our Mission
        </h2>
        <p
          style={{
            fontSize: '17px',
            color: '#6b7a99',
            lineHeight: 1.9,
            maxWidth: '640px',
            fontWeight: 300,
          }}
        >
          To build a mail system so fast, so secure, and so intuitive that teams
          forget email was ever a problem. We obsess over every millisecond,
          every pixel, and every interaction — so you do not have to.
        </p>
      </div>

      {/* Team */}
      <div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '36px',
            fontWeight: 700,
            color: '#e8edf5',
            marginBottom: '48px',
            letterSpacing: '-0.5px',
          }}
        >
          The Team
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}
        >
          {[
            { name: 'Alex Morgan', role: 'Co-founder & CEO', initial: 'A' },
            { name: 'Sam Rivera', role: 'Co-founder & CTO', initial: 'S' },
            { name: 'Jordan Lee', role: 'Head of Design', initial: 'J' },
          ].map((person) => (
            <div
              key={person.name}
              style={{
                padding: '32px',
                borderRadius: '16px',
                border: '1px solid rgba(99, 179, 237, 0.1)',
                background: 'rgba(22, 27, 39, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1e3a8a, #0e7490)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#e8edf5',
                }}
              >
                {person.initial}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: '#e8edf5',
                    marginBottom: '4px',
                  }}
                >
                  {person.name}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7a99' }}>
                  {person.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
