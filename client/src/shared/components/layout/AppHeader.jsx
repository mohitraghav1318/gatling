import { Link, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../config/routes';

const NAV_ITEMS = [
  { label: 'Home', to: APP_ROUTES.home },
  { label: 'Login', to: APP_ROUTES.login },
  { label: 'Register', to: APP_ROUTES.register },
];

export default function AppHeader() {
  const location = useLocation();

  return (
    <header className="page-content">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <Link
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
          to={APP_ROUTES.home}
        >
          Mails System
        </Link>

        <nav
          className="flex items-center gap-2 rounded-full border px-2 py-1"
          style={{
            borderColor: 'hsl(var(--color-border))',
            background: 'hsl(var(--color-surface) / 0.7)',
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-3 py-1.5 text-sm font-medium transition"
                style={{
                  background: isActive
                    ? 'hsl(var(--color-primary))'
                    : 'transparent',
                  color: isActive
                    ? 'hsl(var(--color-on-primary))'
                    : 'hsl(var(--color-text))',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
