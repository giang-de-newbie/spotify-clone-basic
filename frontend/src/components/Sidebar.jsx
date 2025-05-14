"use client"

import { useState, useEffect} from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import "./Sidebar.css"
import { useAuth } from "../contexts/AuthContext"
import api from "../services/api"

const Sidebar = () => {
  const { user, showLogin,loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [myalbums, setMyAlbums] = useState([])

  const isActive = (path) => location.pathname === path
  const handleProtectedRoute = (path) => {
    if (loading) return null;
    if(!user) {
      showLogin()
      return
    } else{
      navigate(path)
    }
  }
  useEffect(() => {
    if (!loading && user) {
      api.getUserAlbums()
        .then(res => {
          setMyAlbums(res.data)
        })
        .catch(err => {
          console.error("Failed to fetch user albums", err)
        })
    } else {
      setMyAlbums([]) 
    }
  }, [user, loading])

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <Link to="/">
          <span className="spotify-logo-text">Spotify</span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li className={isActive("/") ? "active" : ""}>
            <Link to="/">
              <svg viewBox="0 0 24 24" className="sidebar-icon">
                <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z"></path>
              </svg>
              <span>Home</span>
            </Link>
          </li>
          <li className={isActive("/search") ? "active" : ""}>
            <Link to="/search">
              <svg viewBox="0 0 24 24" className="sidebar-icon">
                <path d="M10.533 1.279c-5.18 0-9.407 4.14-9.407 9.279s4.226 9.279 9.407 9.279c2.234 0 4.29-.77 5.907-2.058l4.353 4.353a1 1 0 1 0 1.414-1.414l-4.344-4.344a9.157 9.157 0 0 0 2.077-5.816c0-5.14-4.226-9.28-9.407-9.28zm-7.407 9.279c0-4.006 3.302-7.28 7.407-7.28s7.407 3.274 7.407 7.28-3.302 7.279-7.407 7.279-7.407-3.273-7.407-7.28z"></path>
              </svg>
              <span>Search</span>
            </Link>
          </li>
        </ul>

        <div className="sidebar-actions">
            <button className="create-playlist-btn"
              onClick={(e) => handleProtectedRoute("/my-albums")}>
              <div className="create-playlist-icon">
                <svg viewBox="0 0 16 16" className="plus-icon">
                  <path d="M15.25 8a.75.75 0 0 1-.75.75H8.75v5.75a.75.75 0 0 1-1.5 0V8.75H1.5a.75.75 0 0 1 0-1.5h5.75V1.5a.75.75 0 0 1 1.5 0v5.75h5.75a.75.75 0 0 1 .75.75z"></path>
                </svg>
              </div>
              <span>My Albums</span>
            </button>          
          <button className="liked-songs-btn"
            onClick={(e) => handleProtectedRoute("/favorites")}
          >
            <div className="liked-songs-icon">
              <svg viewBox="0 0 16 16" className="heart-icon">
                <path d="M15.724 4.22A4.313 4.313 0 0 0 12.192.814a4.269 4.269 0 0 0-3.622 1.13.837.837 0 0 1-1.14 0 4.272 4.272 0 0 0-6.21 5.855l5.916 7.05a1.128 1.128 0 0 0 1.727 0l5.916-7.05a4.228 4.228 0 0 0 .945-3.577z"></path>
              </svg>
            </div>
            <span>Favorites</span>
          </button>
        </div>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-myalbums">
        <ul>
          {myalbums.map((playlist) => (
            <li key={playlist.id}>
              <Link to={`/my-album/${playlist.id}`}>{playlist.title}</Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <button className="install-app-btn">
          <svg viewBox="0 0 16 16" className="download-icon">
            <path d="M4.995 8.745a.75.75 0 0 1 1.06 0L7.25 9.939V4a.75.75 0 0 1 1.5 0v5.94l1.195-1.195a.75.75 0 1 1 1.06 1.06L8 12.811l-3.005-3.005a.75.75 0 0 1 0-1.06z"></path>
            <path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z"></path>
          </svg>
          <span>Install App</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar

