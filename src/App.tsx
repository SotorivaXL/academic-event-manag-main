import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginForm } from './components/LoginForm'
import { MainApp } from './components/MainApp'
import { Toaster } from './components/ui/sonner'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return isAuthenticated ? <MainApp /> : <LoginForm />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App