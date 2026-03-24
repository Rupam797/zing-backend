import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
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
import MyOrdersPage from './pages/MyOrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/restaurants" element={<RestaurantsPage />} />
              <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
              <Route path="/cart" element={<ProtectedRoute roles={['USER']}><CartPage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute roles={['USER']}><MyOrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id/track" element={<ProtectedRoute roles={['USER']}><OrderTrackingPage /></ProtectedRoute>} />
              <Route path="/bookings" element={<ProtectedRoute roles={['USER']}><BookingsPage /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute roles={['RESTAURANT']}><DashboardPage /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
              <Route path="/deliveries" element={<ProtectedRoute roles={['DELIVERY']}><DeliveryDashboardPage /></ProtectedRoute>} />
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <h1 className="text-4xl font-bold text-brand-500">404</h1>
                  <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Page not found</p>
                </div>
              } />
            </Routes>
            <Toaster position="top-right" toastOptions={{ style: { fontSize: '12px', padding: '8px 12px', borderRadius: '8px' } }} />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
