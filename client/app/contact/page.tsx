'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    setSubmitted(true);
  };

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(99, 179, 237, 0.15)',
    background: 'rgba(22, 27, 39, 0.8)',
    color: '#e8edf5',
    fontSize: '15px',
    fontFamily: 'var(--font-body)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#6b7a99',
    marginBottom: '8px',
    letterSpacing: '0.03em',
  };

  return (
    <div style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ maxWidth: '560px', marginBottom: '72px' }}>
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
          Get in Touch
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 5vw, 60px)',
            fontWeight: 800,
            letterSpacing: '-1.5px',
            color: '#e8edf5',
            marginBottom: '20px',
            lineHeight: 1.05,
          }}
        >
          Let us talk.
        </h1>
        <p
          style={{
            color: '#6b7a99',
            fontSize: '17px',
            lineHeight: 1.7,
            fontWeight: 300,
          }}
        >
          Have a question, partnership idea, or just want to say hi? We read
          every message and reply within 24 hours.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.6fr',
          gap: '48px',
          alignItems: 'start',
        }}
      >
        {/* Left — contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { label: 'Email', value: 'hello@gatling.io', icon: '✉' },
            { label: 'Response time', value: 'Within 24 hours', icon: '⏱' },
            { label: 'Based in', value: 'India 🇮🇳', icon: '📍' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '24px',
                borderRadius: '14px',
                border: '1px solid rgba(99, 179, 237, 0.1)',
                background: 'rgba(22, 27, 39, 0.5)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#3d4a66',
                    marginBottom: '4px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    color: '#e8edf5',
                    fontWeight: 500,
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right — form */}
        <div
          style={{
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid rgba(99, 179, 237, 0.12)',
            background: 'rgba(13, 17, 23, 0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>✅</div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#e8edf5',
                  marginBottom: '12px',
                }}
              >
                Message sent!
              </h3>
              <p style={{ color: '#6b7a99', fontSize: '15px' }}>
                We will get back to you within 24 hours.
              </p>
            </div>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div>
                <label style={labelStyle}>Your name</label>
                <input
                  style={inputStyle}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'rgba(99, 179, 237, 0.15)')
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Email address</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'rgba(99, 179, 237, 0.15)')
                  }
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  style={{
                    ...inputStyle,
                    minHeight: '140px',
                    resize: 'vertical',
                  }}
                  placeholder="Tell us what's on your mind..."
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  onFocus={(e) =>
                    (e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)')
                  }
                  onBlur={(e) =>
                    (e.target.style.borderColor = 'rgba(99, 179, 237, 0.15)')
                  }
                />
              </div>
              <Button variant="primary" size="md" onClick={handleSubmit}>
                Send Message →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
