import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './admin/AdminLayout'
import { RequireAuth } from './admin/RequireAuth'
import { AdminBrandsPage } from './admin/pages/AdminBrandsPage'
import { AdminCategoriesPage } from './admin/pages/AdminCategoriesPage'
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage'
import { AdminEnquiriesPage } from './admin/pages/AdminEnquiriesPage'
import { AdminLoginPage } from './admin/pages/AdminLoginPage'
import { AdminProductEditPage } from './admin/pages/AdminProductEditPage'
import { AdminProductsPage } from './admin/pages/AdminProductsPage'
import { AdminSettingsPage } from './admin/pages/AdminSettingsPage'
import { Layout } from './components/Layout'
import { SmoothScrollProvider } from './components/SmoothScrollProvider'
import { AboutPage } from './pages/AboutPage'
import { CataloguePage } from './pages/CataloguePage'
import { ContactPage } from './pages/ContactPage'
import { HomePage } from './pages/HomePage'
import { ProductPage } from './pages/ProductPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/manage/login" element={<AdminLoginPage />} />
        <Route path="/manage" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/:id" element={<AdminProductEditPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="enquiries" element={<AdminEnquiriesPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        <Route
          element={
            <SmoothScrollProvider>
              <Layout />
            </SmoothScrollProvider>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="catalogue" element={<CataloguePage />} />
          <Route path="catalogue/:categorySlug" element={<CataloguePage />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
