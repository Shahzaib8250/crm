import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './Pages/HomePage';
import LoginPage from './Pages/LoginPage';
import SuperAdminLogin from './Pages/SuperAdminLogin';
import SuperAdminDashboard from './Pages/SuperAdminDashboard';
import AdminDashboard from './Pages/AdminDashboard';
import UserDashboard from './Pages/UserDashboard';
import CustomerManagement from './Pages/CRM/CustomerManagement';
import SuperAdminCustomerManagement from './Pages/CRM/SuperAdminCustomerManagement';
import LeadManagement from './Pages/CRM/LeadManagement';
import DealManagement from './Pages/CRM/DealManagement';
import ProductAccess from './Pages/ProductAccess';
import SuperAdminServicesPage from './Pages/SuperAdminServicesPage';
import AdminServicesPage from './Pages/AdminServicesPage';
import { ThemeProvider } from './utils/ThemeContext';
import ComplaintsManagement from './Pages/Complaints/ComplaintsManagement';
import CRMDashboard from './Pages/CRM/CRMDashboard';
import ProductManagement from './Pages/CRM/ProductManagement';
import UserRoleManagement from './Pages/CRM/UserRoleManagement';
import AuditLog from './Pages/CRM/AuditLog';
import { NotificationProvider } from './utils/NotificationContext';
import ErrorBoundary from './Components/ErrorBoundary';
import SubUserLogin from './Pages/SubUserLogin';
import SubuserTickets from './Pages/SubuserTickets';
import SubuserProducts from './Pages/SubuserProducts';
import SubuserProfile from './Pages/SubuserProfile';
import SubuserNotifications from './Pages/SubuserNotifications';
import ServiceManagement from './Pages/CRM/ServiceManagement';
import QuotationManagement from './Pages/CRM/QuotationManagement';
import InvoiceManagement from './Pages/CRM/InvoiceManagement';
import Reports from './Pages/CRM/Reports';
import CreateTicket from './Pages/CRM/CreateTicket';
import SalesManagement from './Pages/CRM/SalesManagement';

/**
 * App Component - Main routing setup for the CRM application
 * 
 * Handles all routes in the application with role-based access.
 * SEO-friendly component organization with semantic route names.
 * 
 * @returns {JSX.Element} The router configuration with all app routes
 */
const App = () => {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <ErrorBoundary>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/superadmin/login" element={<SuperAdminLogin />} />
              <Route path="/subuser/login" element={<SubUserLogin />} />
              <Route path="/user/login" element={<SubUserLogin />} />
              
              {/* Product Access Route */}
              <Route path="/products/access/:accessLink" element={<ProductAccess />} />

              {/* SuperAdmin Routes */}
              <Route path="/superadmin" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/products" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/services" element={<SuperAdminServicesPage />} />
              <Route path="/superadmin/services/create" element={<SuperAdminServicesPage />} />
              <Route path="/superadmin/services/edit/:id" element={<SuperAdminServicesPage />} />
              <Route path="/superadmin/enterprise" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/quotations" element={<SuperAdminServicesPage />} />
              <Route path="/superadmin/invoices" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/reports" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/expenses" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/receipts" element={<SuperAdminDashboard />} />
              <Route path="/superadmin/complaints" element={<ComplaintsManagement />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/crm" element={<AdminDashboard />} />
              <Route path="/admin/services" element={<AdminDashboard activeTab="services" />} />
              <Route path="/admin/hrm" element={<AdminDashboard />} />
              <Route path="/admin/job-portal" element={<AdminDashboard />} />
              <Route path="/admin/job-board" element={<AdminDashboard />} />
              <Route path="/admin/projects" element={<AdminDashboard />} />
              
              {/* User Routes */}
              <Route path="/user/*" element={<UserDashboard />}>
                <Route index element={<UserDashboard.WelcomeModule />} />
                <Route path="tickets" element={<SubuserTickets />} />
                <Route path="products" element={<SubuserProducts />} />
                <Route path="profile" element={<SubuserProfile />} />
                <Route path="notifications" element={<SubuserNotifications />} />
              </Route>

              {/* CRM Dashboard & Modules */}
              <Route path="/crm/*" element={<CRMDashboard />}>
                <Route path="products" element={<ProductManagement />} />
                <Route path="services" element={<ServiceManagement />} />
                <Route path="leads" element={<LeadManagement />} />
                <Route path="users" element={<UserRoleManagement />} />
                <Route path="quotations" element={<QuotationManagement />} />
                <Route path="invoices" element={<InvoiceManagement />} />
                <Route path="reports" element={<Reports />} />
                <Route path="create-ticket" element={<CreateTicket />} />
                <Route path="customers" element={<CustomerManagement />} />
                <Route path="sales" element={<SalesManagement />} />
                <Route path="audit-logs" element={<AuditLog />} />
                {/* Catch-all for invalid/nested CRM routes */}
                <Route path="*" element={<Navigate to="/crm" replace />} />
              </Route>

              {/* Catch all route - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;