const sections = [
  {
    title: '1. Information We Collect',
    content:
      'We collect information you provide directly — such as your name, email address, and message content when you sign up or contact us. We also collect usage data automatically, including IP addresses, browser type, and pages visited, to improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content:
      'We use your information to operate and improve Gatling, send you important updates, respond to your inquiries, and ensure the security of our platform. We never sell your personal data to third parties.',
  },
  {
    title: '3. Data Storage & Security',
    content:
      'All data is encrypted at rest and in transit using AES-256 encryption. We store data on secure servers and regularly audit our systems for vulnerabilities. Only authorized personnel have access to user data.',
  },
  {
    title: '4. Cookies',
    content:
      'We use essential cookies to keep you logged in and remember your preferences. We do not use advertising or tracking cookies. You can disable cookies in your browser settings, but some features may not work correctly.',
  },
  {
    title: '5. Third-Party Services',
    content:
      'We may use trusted third-party services for analytics and infrastructure. These providers are contractually bound to protect your data and may not use it for any other purpose.',
  },
  {
    title: '6. Your Rights',
    content:
      'You have the right to access, correct, or delete your personal data at any time. To exercise these rights, contact us at privacy@gatling.io. We will respond within 30 days.',
  },
  {
    title: '7. Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our website. Continued use of Gatling after changes means you accept the updated policy.',
  },
  {
    title: '8. Contact Us',
    content:
      'If you have questions about this Privacy Policy, reach out to us at privacy@gatling.io. We take privacy seriously and will address your concerns promptly.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div style={{ padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '64px' }}>
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
          Legal
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 56px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            color: '#e8edf5',
            marginBottom: '20px',
            lineHeight: 1.05,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ color: '#6b7a99', fontSize: '15px' }}>
          Last updated: January 1, 2025
        </p>
      </div>

      {/* Intro */}
      <div
        style={{
          padding: '28px 32px',
          borderRadius: '14px',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          background: 'rgba(59, 130, 246, 0.05)',
          marginBottom: '48px',
        }}
      >
        <p
          style={{
            color: '#6b7a99',
            fontSize: '16px',
            lineHeight: 1.8,
            fontWeight: 300,
          }}
        >
          At Gatling, your privacy is not an afterthought — it is a core part of
          how we build. This policy explains what we collect, why we collect it,
          and how we keep it safe.
        </p>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {sections.map((section, i) => (
          <div
            key={section.title}
            style={{
              padding: '36px 0',
              borderBottom:
                i < sections.length - 1
                  ? '1px solid rgba(99, 179, 237, 0.07)'
                  : 'none',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '19px',
                fontWeight: 600,
                color: '#e8edf5',
                marginBottom: '14px',
                letterSpacing: '-0.3px',
              }}
            >
              {section.title}
            </h2>
            <p
              style={{
                color: '#6b7a99',
                fontSize: '15px',
                lineHeight: 1.85,
                fontWeight: 300,
              }}
            >
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
