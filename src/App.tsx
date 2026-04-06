/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { MenuPage } from './pages/MenuPage';
import { CartPage } from './pages/CartPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { KitchenDisplayPage } from './pages/KitchenDisplayPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { LanguageProvider } from './lib/LanguageContext';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { OfflineBanner } from './components/OfflineBanner';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <OfflineBanner />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrderHistoryPage />} />
                <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/kitchen" element={<KitchenDisplayPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                },
                success: {
                  iconTheme: {
                    primary: '#1e9e62',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#e23744',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
