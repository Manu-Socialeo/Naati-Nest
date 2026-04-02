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
import { LanguageProvider } from './lib/LanguageContext';
import { AuthProvider } from './lib/AuthContext';
import { CartProvider } from './lib/CartContext';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrderHistoryPage />} />
              <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
