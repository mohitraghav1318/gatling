import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import AppHeader from '../shared/components/layout/AppHeader';
import HeroScene from '../shared/components/three/HeroScene';
import { APP_ROUTES } from '../shared/config/routes';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <div className="grid-overlay" />
        <HeroScene />
        <AppHeader />

        <Routes>
          <Route path={APP_ROUTES.home} element={<HomePage />} />
          <Route path={APP_ROUTES.login} element={<LoginPage />} />
          <Route path={APP_ROUTES.register} element={<RegisterPage />} />
          <Route path="*" element={<Navigate replace to={APP_ROUTES.home} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
