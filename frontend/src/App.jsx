"use client"
import { useState } from "react"
import Sidebar from "./components/Sidebar"
import AppHeader from "./components/AppHeader"
import Player from "./components/Player"
import AppRoutes from "./routes"
import "./App.css"

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="app-container">
      <div className="app-content">
        <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
        <main className="main-content">
          <AppHeader />
          <div className="page-content">
            <AppRoutes />
          </div>
        </main>
      </div>
      <Player />
    </div>
  )
}

export default App