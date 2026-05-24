import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

import LoginPage           from '@/pages/Auth/LoginPage';
import DashboardPage       from '@/pages/Dashboard/DashboardPage';
import OrdersPage          from '@/pages/Orders/OrdersPage';
import OrderDetailPage     from '@/pages/Orders/OrderDetailPage';
import MenuPage            from '@/pages/Menu/MenuPage';
import MenuItemFormPage    from '@/pages/Menu/MenuItemFormPage';
import UsersPage           from '@/pages/Users/UsersPage';
import AnalyticsPage       from '@/pages/Analytics/AnalyticsPage';
import PromotionsPage      from '@/pages/Promotions/PromotionsPage';
import PromotionFormPage   from '@/pages/Promotions/PromotionFormPage';
import NotificationsPage   from '@/pages/Notifications/NotificationsPage';
import ChatPage            from '@/pages/Chat/ChatPage';

// Auth guard — redirects to /login when not authenticated
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/menu" element={<ProtectedRoute><MenuPage /></ProtectedRoute>} />
      <Route path="/menu/new" element={<ProtectedRoute><MenuItemFormPage /></ProtectedRoute>} />
      <Route path="/menu/:id/edit" element={<ProtectedRoute><MenuItemFormPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/promotions" element={<ProtectedRoute><PromotionsPage /></ProtectedRoute>} />
      <Route path="/promotions/new" element={<ProtectedRoute><PromotionFormPage /></ProtectedRoute>} />
      <Route path="/promotions/:id/edit" element={<ProtectedRoute><PromotionFormPage /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
