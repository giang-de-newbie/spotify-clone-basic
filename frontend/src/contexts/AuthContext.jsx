// contexts/AuthContext.js
import { createContext, useContext, useState, useEffect } from "react"
import api from "../services/api"
import LoginPage from "../pages/LoginPage"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const showLogin = () => setShowLoginModal(true)
  const hideLogin = () => setShowLoginModal(false)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const userProfile = await api.getUserProfile()
          setUser(userProfile.data)
        } catch (error) {
          console.error("Auth check failed:", error)
          logout()
        }
      }
      setLoading(false)
    }
    
    checkAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const response = await api.login({ username, password })
      localStorage.setItem('token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      
      const userProfile = await api.getUserProfile()
      setUser(userProfile.data)
      return true
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    showLoginModal,
    showLogin,
    hideLogin,
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout,
      loading, 
      showLogin,
      hideLogin 
    }}>
      {children}
      {showLoginModal && <LoginPage onClose={hideLogin} />}
    </AuthContext.Provider>
  )
}