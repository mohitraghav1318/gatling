import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import MemberDashboardPage from '../features/member/pages/MemberDashboardPage';
import AppHeader from '../shared/components/layout/AppHeader';
import HeroScene from '../shared/components/three/HeroScene';
import { APP_ROUTES } from '../shared/config/routes';
import ProtectedRoute from '../shared/components/routing/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* 
        App Shell: 
        We use relative positioning with min-h-screen to ensure full coverage. 
        Flex column makes sure the header stays on top and content expands below.
      */}
      <div className="relative min-h-screen flex flex-col font-sans text-stable-900 bg-stable-50 overflow-hidden">
        
        {/* Animated & 3D Background elements */}
        {/* The 3D Canvas sits fixed in the background */}
        <div className="absolute inset-0 z-0 opacity-60">
          <HeroScene />
        </div>

        {/* AppHeader sits above the background but before main content */}
        <div className="relative z-10">
          <AppHeader />
        </div>

        {/* 
          Main centered focused content area. 
          flex-1 allows it to take remaining vertical space after header.
          justify-center and items-center align content in the true center of the screen.
        */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <Routes>
              <Route path={APP_ROUTES.home} element={<HomePage />} />
              <Route path={APP_ROUTES.login} element={<LoginPage />} />
              <Route path={APP_ROUTES.register} element={<RegisterPage />} />
              <Route
                path={APP_ROUTES.dashboard}
                element={
                  <ProtectedRoute>
                    <MemberDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${APP_ROUTES.dashboardOrgBase}/:organizationName`}
                element={
                  <ProtectedRoute>
                    <MemberDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={`${APP_ROUTES.dashboardUserBase}/:username`}
                element={
                  <ProtectedRoute>
                    <MemberDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate replace to={APP_ROUTES.home} />} />
            </Routes>
          </div>
        </div>

      </div>
    </BrowserRouter>
  );
}
