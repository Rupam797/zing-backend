import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RestaurantsPage from './pages/RestaurantsPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartPage from './pages/CartPage';
import BookingsPage from './pages/BookingsPage';
import DashboardPage from './pages/DashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Navbar />
          <Routes>
            {/* Public */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />

            {/* User only */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute roles={['USER']}>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute roles={['USER']}>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />

            {/* Restaurant owner only */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={['RESTAURANT']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Admin only */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Delivery partner only */}
            <Route
              path="/deliveries"
              element={
                <ProtectedRoute roles={['DELIVERY']}>
                  <DeliveryDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <h1 className="text-6xl font-bold text-brand-500">404</h1>
                  <p className="mt-2 text-surface-400">Page not found</p>
                </div>
              }
            />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#27272a',
                color: '#fafafa',
                border: '1px solid #3f3f46',
                borderRadius: '12px',
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
