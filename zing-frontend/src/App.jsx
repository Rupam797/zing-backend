import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy-load all pages for optimal bundle splitting
const HomePage             = lazy(() => import('./pages/HomePage'));
const LoginPage            = lazy(() => import('./pages/LoginPage'));
const SignupPage           = lazy(() => import('./pages/SignupPage'));
const RestaurantsPage      = lazy(() => import('./pages/RestaurantsPage'));
const RestaurantDetailPage = lazy(() => import('./pages/RestaurantDetailPage'));
const CartPage             = lazy(() => import('./pages/CartPage'));
const BookingsPage         = lazy(() => import('./pages/BookingsPage'));
const DashboardPage        = lazy(() => import('./pages/DashboardPage'));
const AdminDashboardPage   = lazy(() => import('./pages/AdminDashboardPage'));
const DeliveryDashboardPage= lazy(() => import('./pages/DeliveryDashboardPage'));
const MyOrdersPage         = lazy(() => import('./pages/MyOrdersPage'));
const OrderTrackingPage    = lazy(() => import('./pages/OrderTrackingPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  );
}

// Pages that should NOT show the footer (auth pages, dashboards)
const NO_FOOTER_PATHS = ['/login', '/signup', '/dashboard', '/admin', '/deliveries'];

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"                     element={<HomePage />} />
                <Route path="/login"                element={<LoginPage />} />
                <Route path="/signup"               element={<SignupPage />} />
                <Route path="/restaurants"          element={<RestaurantsPage />} />
                <Route path="/restaurants/:id"      element={<RestaurantDetailPage />} />
                <Route path="/cart"                 element={<ProtectedRoute roles={['USER']}><CartPage /></ProtectedRoute>} />
                <Route path="/orders"               element={<ProtectedRoute roles={['USER']}><MyOrdersPage /></ProtectedRoute>} />
                <Route path="/orders/:id/track"     element={<ProtectedRoute roles={['USER']}><OrderTrackingPage /></ProtectedRoute>} />
                <Route path="/bookings"             element={<ProtectedRoute roles={['USER']}><BookingsPage /></ProtectedRoute>} />
                <Route path="/dashboard"            element={<ProtectedRoute roles={['RESTAURANT']}><DashboardPage /></ProtectedRoute>} />
                <Route path="/admin"                element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
                <Route path="/deliveries"           element={<ProtectedRoute roles={['DELIVERY']}><DeliveryDashboardPage /></ProtectedRoute>} />
                <Route path="*"                     element={<NotFoundPage />} />
              </Routes>
            </Suspense>
            <Footer />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  fontSize: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                },
                success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
