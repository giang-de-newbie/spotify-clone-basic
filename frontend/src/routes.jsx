import { Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import SearchPage from "./pages/SearchPage"
import AlbumPage from "./pages/AlbumPage"
import ArtistPage from "./pages/ArtistPage"
import LoginPage from "./pages/LoginPage"
import SongPage from "./pages/SongPage"
import VideoPage from "./pages/VideoPage"
import UserAlbumsPage from "./pages/UserAlbumsPage"
import UserAlbumPage from "./pages/UserAlbumPage"
import FavoritesPage from "./pages/FavoritesPage"
import ProtectedRoute from "./components/ProtectedRoute"

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/album/:id" element={<AlbumPage />} />
      <Route path="/artist/:id" element={<ArtistPage />} />
      <Route path="/song/:id" element={<SongPage />} />
      <Route path="/video/:id" element={<VideoPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/my-albums" element={<UserAlbumsPage />} />
      <Route path="/my-album/:id" element={<UserAlbumPage />} />

      
      
      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes

