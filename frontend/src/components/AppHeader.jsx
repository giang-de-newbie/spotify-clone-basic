"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api from "../services/api"
import "./AppHeader.css"
import LoginPage from "../pages/LoginPage"
import { useAuth } from "../contexts/AuthContext";

const AppHeader = () => {
  const { user, logout } = useAuth();
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchPage, setIsSearchPage] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setIsSearchPage(location.pathname === "/search")

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [location, scrolled])

  const handleBack = () => {
    navigate(-1)
  }

  const handleForward = () => {
    navigate(1)
  }

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value)
    if (!isSearchPage) {
      navigate("/search")
    }
  }

  const handleLoginSuccess = () => {
    setShowLoginModal(false)
  }

  const handleLogout = () => {
    logout(); // Use the logout function from auth context
    setShowUserMenu(false)
  }

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu)
  }

  return (
    <>
      <header className={`app-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-left">
          <div className="navigation-buttons">
            <button className="nav-button" onClick={handleBack}>
              <svg viewBox="0 0 16 16" className="nav-icon">
                <path d="M11.03.47a.75.75 0 0 1 0 1.06L4.56 8l6.47 6.47a.75.75 0 1 1-1.06 1.06L2.44 8 9.97.47a.75.75 0 0 1 1.06 0z"></path>
              </svg>
            </button>
            <button className="nav-button" onClick={handleForward}>
              <svg viewBox="0 0 16 16" className="nav-icon">
                <path d="M4.97.47a.75.75 0 0 0 0 1.06L11.44 8l-6.47 6.47a.75.75 0 1 0 1.06 1.06L13.56 8 6.03.47a.75.75 0 0 0-1.06 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        <div className="header-right">
          {user ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <button className="user-menu-button" onClick={toggleUserMenu}>
                <div className="user-avatar">
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user.user.username} 
                      className="user-avatar-image"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" className="user-icon">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                    </svg>
                  )}
                </div>
                <span className="user-name">{user?.user.username || "User"}</span>
                <svg viewBox="0 0 16 16" className="dropdown-icon">
                  <path d="M14 6l-6 6-6-6h12z"></path>
                </svg>
              </button>

              {showUserMenu && (
                <div className="user-menu-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user?.images?.[0]?.url ? (
                        <img 
                          src={user.profile_picture} 
                          alt={user.user.username} 
                          className="dropdown-avatar-image"
                        />
                      ) : (
                        <svg viewBox="0 0 24 24" className="dropdown-user-icon">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path>
                        </svg>
                      )}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{user?.user.username || "User"}</div>
                      <div className="dropdown-user-email">{user?.user.email || ""}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item">
                    <span>Profile</span>
                  </button>
                  <button className="dropdown-item">
                    <span>Changes password</span>
                  </button>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-button" onClick={() => setShowLoginModal(true)}>
              Đăng nhập
            </button>
          )}
        </div>
      </header>

      {showLoginModal && (
        <div className="login-modal-overlay">
          <div className="login-modal-content">
            <LoginPage onClose={() => setShowLoginModal(false)} onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      )}
    </>
  )
}

export default AppHeader