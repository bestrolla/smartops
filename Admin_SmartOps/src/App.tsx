import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import Dashboard from './pages/Dashboard'
import SignIn from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { ThemeConfigurator } from './components/ThemeConfigurator'
import { Settings as SettingsIcon } from 'lucide-react'
import { Button } from './components/ui/button'
import './App.css'
import { useAuth } from "./lib/AuthContext"
import { FeaturesProvider, useFeatures } from "./lib/FeaturesContext"
import { DynamicSidebar } from './components/DynamicSidebar'
import FeatureRoute from './components/FeatureRoute'
import Appointments from './pages/Appointments'
import CRM from './pages/CRM'
import Professionals from './pages/Professionals'
import Products from './pages/Products'
import Orders from './pages/Orders'
import Inventory from './pages/Inventory'
import Ecommerce from './pages/Ecommerce'
import Services from './pages/Services'
import { Categories } from './pages/Categories'
import Settings from './pages/Settings'
import TenantSettings from './pages/TenantSettings'
import Profile from './pages/Profile'
import ThemeSelection from './pages/ThemeSelection'
import NFCSettings from './pages/NFCSettings'
import Automation from './pages/Automation'
import AutomationCreate from './pages/AutomationCreate'
import Templates from './pages/Templates'
// Removido ProfileTemplates - integrado en Profile
import { ToastProvider } from './components/ui/use-toast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PublicProfiles from './pages/PublicProfiles';
import PublicProfile from './pages/PublicProfile';
import React from 'react';
import { Toaster } from 'sonner'
import PaymentRequiredModal from './components/payments/PaymentRequiredModal'

// Subcomponente autenticado: usa useFeatures dentro del Provider
function AuthedApp() {
  const [isConfiguratorOpen, setIsConfiguratorOpen] = useState(false)
  const { loading: featuresLoading, requiresPayment, refreshFeatures } = useFeatures()
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  React.useEffect(() => {
    if (!featuresLoading && requiresPayment) {
      setShowPaymentModal(true)
    } else {
      setShowPaymentModal(false)
    }
  }, [featuresLoading, requiresPayment])

  return (
    <div className="flex h-screen">
      <DynamicSidebar />
      <div className="flex-1 flex flex-col overflow-hidden ml-72">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profiles-public-smartops" element={<PublicProfiles />} />
            <Route path="/profile-public-smartops/:tenantId" element={<PublicProfile />} />
            {/* Feature-protected routes */}
            <Route path="/appointments" element={
              <FeatureRoute featureName="appointments">
                <Appointments />
              </FeatureRoute>
            } />
            <Route path="/crm" element={
              <FeatureRoute featureName="crm">
                <CRM />
              </FeatureRoute>
            } />
            <Route path="/professionals" element={
              <FeatureRoute featureName="professionals">
                <Professionals />
              </FeatureRoute>
            } />
            <Route path="/products" element={
              <FeatureRoute featureName="products">
                <Products />
              </FeatureRoute>
            } />
            <Route path="/categories" element={
              <FeatureRoute featureName="products">
                <Categories />
              </FeatureRoute>
            } />
            <Route path="/orders" element={
              <FeatureRoute featureName="orders">
                <Orders />
              </FeatureRoute>
            } />
            <Route path="/inventory" element={
              <FeatureRoute featureName="inventory">
                <Inventory />
              </FeatureRoute>
            } />
            <Route path="/ecommerce" element={
              <FeatureRoute featureName="ecommerce">
                <Ecommerce />
              </FeatureRoute>
            } />
            <Route path="/services" element={
              <FeatureRoute featureName="services">
                <Services />
              </FeatureRoute>
            } />
            
            {/* Settings routes */}
            <Route path="/settings" element={<Settings />} />
            <Route path="/tenant-settings" element={<TenantSettings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/theme-selection" element={<ThemeSelection />} />
            {/* <Route path="/profile-setup" element={<ProfileSetup />} /> */}
            {/* Removida ruta /profile-templates - integrado en /profile */}
            <Route path="/nfc-settings" element={<NFCSettings />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/automation-create" element={<AutomationCreate />} />
            <Route path="/templates" element={<Templates />} />
          </Routes>
        </main>
        <Footer />
      </div>

      <Button
        onClick={() => setIsConfiguratorOpen(true)}
        className="fixed bottom-8 right-6 z-40 w-12 h-12 rounded-full bg-white shadow-lg hover:shadow-xl text-gray-700 hover:text-purple-600 border border-gray-200"
        variant="ghost"
      >
        <SettingsIcon className="w-5 h-5" />
      </Button>

      <ThemeConfigurator
        isOpen={isConfiguratorOpen}
        onClose={() => setIsConfiguratorOpen(false)}
      />

      {showPaymentModal && (
        <PaymentRequiredModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={async () => {
            setShowPaymentModal(false)
            await refreshFeatures()
          }}
        />
      )}
    </div>
  )
}

function App() {
  const { auth } = useAuth()

  return (
    <ToastProvider>
      <Router>
        {auth.token && auth.user ? (
          <FeaturesProvider>
            <AuthedApp />
          </FeaturesProvider>
        ) : (
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/profiles-public-smartops" element={<PublicProfiles />} />
            <Route path="/profile-public-smartops/:tenantId" element={<PublicProfile />} />
            <Route path="/*" element={<SignIn />} />
          </Routes>
        )}
        <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        <Toaster richColors position="top-right" />
      </Router>
    </ToastProvider>
  )
}

export default App;