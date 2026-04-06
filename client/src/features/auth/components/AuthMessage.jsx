export default function AuthMessage({ type = 'info', text }) {
  if (!text) return null;

  const colorMap = {
    success: {
      border: 'hsl(var(--color-primary) / 0.4)',
      background: 'hsl(var(--color-primary) / 0.12)',
      text: 'hsl(var(--color-primary-strong))',
    },
    error: {
      border: 'hsl(var(--color-accent) / 0.45)',
      background: 'hsl(var(--color-accent) / 0.12)',
      text: 'hsl(var(--color-text))',
    },
    info: {
      border: 'hsl(var(--color-border))',
      background: 'hsl(var(--color-bg-soft) / 0.6)',
      text: 'hsl(var(--color-text))',
    },
  };

  const color = colorMap[type] || colorMap.info;

  return (
    <div
      className="mt-4 rounded-xl border px-3 py-2 text-sm"
      style={{
        borderColor: color.border,
        background: color.background,
        color: color.text,
      }}
    >
      {text}
    </div>
  );
}
