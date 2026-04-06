import { Link, useLocation, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '../../config/routes';
import { clearAuthToken, hasAuthToken } from '../../utils/authSession';

const LOGGED_OUT_NAV_ITEMS = [
  { label: 'Home', to: APP_ROUTES.home },
  { label: 'Login', to: APP_ROUTES.login },
  { label: 'Register', to: APP_ROUTES.register },
];

const LOGGED_IN_NAV_ITEMS = [
  { label: 'Home', to: APP_ROUTES.home },
  { label: 'Dashboard', to: APP_ROUTES.dashboard },
];

export default function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = hasAuthToken();
  const navItems = isLoggedIn ? LOGGED_IN_NAV_ITEMS : LOGGED_OUT_NAV_ITEMS;

  function handleLogout() {
    clearAuthToken();
    navigate(APP_ROUTES.login, { replace: true });
  }

  return (
    <header className="w-full relative z-20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 border-b border-stable-200/50 bg-transparent backdrop-blur-md">
        <Link
          className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-teal-700 to-emerald-600"
          to={APP_ROUTES.home}
        >
          Mails System
        </Link>

        {/* Floating rounded nav bar */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-stable-200/60 bg-white/70 px-2 py-1.5 shadow-sm backdrop-blur-xl">
          {navItems.map((item) => {
            const isDashboardItem = item.to === APP_ROUTES.dashboard;
            const isActive = isDashboardItem
              ? location.pathname.startsWith(APP_ROUTES.dashboard)
              : location.pathname === item.to;

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                    : 'text-stable-600 hover:bg-stable-200/50 hover:text-stable-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {isLoggedIn && (
            <button
              type="button"
              className="ml-2 rounded-full border border-stable-300 bg-white px-5 py-2 text-sm font-bold text-stable-700 transition hover:bg-stable-50 hover:border-stable-400 focus:outline-none focus:ring-2 focus:ring-stable-500/20"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
