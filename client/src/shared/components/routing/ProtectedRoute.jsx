import { Navigate, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../../config/routes';
import { hasAuthToken } from '../../utils/authSession';

export default function ProtectedRoute({ children }) {
  const location = useLocation();

  // Route guard for private pages. If no token exists, send user to login.
  if (!hasAuthToken()) {
    return (
      <Navigate
        replace
        to={APP_ROUTES.login}
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
