import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./components/Sidebar";
import Player from "./components/Player";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Library from "./pages/Library";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import SongDetail from "./pages/SongDetail";
import AllSongs from "./pages/AllSongs";
import AlbumDetail from "./pages/AlbumDetail";

function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isShuffle, setIsShuffle] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (storedUser && storedAccessToken && storedRefreshToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
      } catch (e) {
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setShowAuthModal(true);
      }
    } else {
      setShowAuthModal(true);
    }
  }, []);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/songs/");
        const formattedPlaylist = response.data.map((song) => ({
          id: song.id,
          title: song.title,
          artist: song.artist_name || "Không rõ nghệ sĩ",
          audio_url: song.audio_file,
          cover: song.cover || "https://via.placeholder.com/48",
          video_url: song.video_file || null,
        }));
        setPlaylist(formattedPlaylist);
      } catch (err) {
        console.error("Error fetching playlist:", err);
      }
    };
    fetchSongs();
  }, []);

  const handleNext = (specificIndex = null) => {
    if (playlist.length === 0) return;
    let nextIndex;
    if (specificIndex !== null) {
      nextIndex = specificIndex;
    } else if (isShuffle) {
      nextIndex = Math.floor(Math.random() * playlist.length);
    } else {
      nextIndex = (currentIndex + 1) % playlist.length;
    }
    setCurrentIndex(nextIndex);
    const nextSong = playlist[nextIndex];
    setCurrentSong(nextSong);
    navigate(`/song/${nextSong.id}`);
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    setCurrentIndex(prevIndex);
    const prevSong = playlist[prevIndex];
    setCurrentSong(prevSong);
    navigate(`/song/${prevSong.id}`);
  };

  const handleSetCurrentSong = (song) => {
    const index = playlist.findIndex((s) => s.id === song.id);
    setCurrentIndex(index);
    setCurrentSong(song);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/user/login/",
        {
          username: username,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      setUser({ id: data.id, username: data.username, email: data.email });
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
        })
      );
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      setShowAuthModal(false);
      setErrorMessage("");
      if (data.username === "admin" && password === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setErrorMessage(
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin."
      );
      console.error("Login error:", err.response?.data || err.message);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/user/register/",
        {
          username,
          password,
          email,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = response.data;
      setUser({ id: data.id, username: data.username, email: data.email });
      setAccessToken(data.access);
      setRefreshToken(data.refresh);
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id,
          username: data.username,
          email: data.email,
        })
      );
      localStorage.setItem("accessToken", data.access);
      localStorage.setItem("refreshToken", data.refresh);
      setShowAuthModal(false);
      setErrorMessage("");
      navigate("/");
    } catch (err) {
      setErrorMessage(
        "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin."
      );
      console.error("Register error:", err.response?.data || err.message);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8000/api/user/logout/",
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    } catch (err) {
      console.error("Logout error:", err);
    }
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setCurrentSong(null);
    setCurrentIndex(-1);
    setShowAuthModal(true);
  };

  const renderAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="p-6 bg-gray-800 rounded-lg shadow-lg w-96">
          <h2 className="mb-4 text-2xl text-white">
            {authMode === "login" ? "Đăng Nhập" : "Đăng Ký"}
          </h2>
          <div className="flex justify-around mb-4">
            <button
              onClick={() => {
                setAuthMode("login");
                setErrorMessage("");
              }}
              className={`px-4 py-2 rounded ${
                authMode === "login"
                  ? "bg-green-500 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => {
                setAuthMode("register");
                setErrorMessage("");
              }}
              className={`px-4 py-2 rounded ${
                authMode === "register"
                  ? "bg-green-500 text-white"
                  : "bg-gray-600 text-gray-300"
              }`}
            >
              Đăng Ký
            </button>
          </div>
          {errorMessage && <p className="mb-4 text-red-500">{errorMessage}</p>}
          {authMode === "register" && (
            <div className="mb-4">
              <label className="block mb-2 text-gray-300">Tên người dùng</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 text-white bg-gray-700 rounded"
                placeholder="Nhập tên người dùng"
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 text-white bg-gray-700 rounded"
              placeholder="Nhập email"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 text-white bg-gray-700 rounded"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setErrorMessage("");
              }}
              className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={authMode === "login" ? handleLogin : handleRegister}
              className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-400"
            >
              {authMode === "login" ? "Đăng Nhập" : "Đăng Ký"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen text-white bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-6 overflow-y-auto">
          <Routes location={location}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="*"
              element={
                <>
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Home
                          setCurrentSong={handleSetCurrentSong}
                          user={user}
                          accessToken={accessToken}
                          onLogout={handleLogout}
                        />
                      }
                    />
                    <Route
                      path="/search"
                      element={
                        <Search
                          accessToken={accessToken}
                          setCurrentSong={handleSetCurrentSong}
                        />
                      }
                    />
                    <Route
                      path="/song/:id"
                      element={<SongDetail accessToken={accessToken} />}
                    />
                    <Route
                      path="/all-songs"
                      element={
                        <AllSongs
                          accessToken={accessToken}
                          setCurrentSong={handleSetCurrentSong}
                        />
                      }
                    />
                    <Route
                      path="/library"
                      element={
                        <Library user={user} accessToken={accessToken} />
                      }
                    />
                    <Route
                      path="/album/:id"
                      element={
                        <AlbumDetail user={user} accessToken={accessToken} />
                      }
                    />
                    <Route
                      path="/admin"
                      element={<Admin accessToken={accessToken} />}
                    />
                    <Route
                      path="/settings"
                      element={
                        <Settings
                          user={user}
                          accessToken={accessToken}
                          onLogout={handleLogout}
                        />
                      }
                    />
                  </Routes>
                  {user && (
                    <div className="mt-4 text-white">
                      <p>
                        Đăng nhập với: {user.username} ({user.email})
                      </p>
                      <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-400"
                      >
                        Đăng Xuất
                      </button>
                    </div>
                  )}
                </>
              }
            />
          </Routes>
        </main>
      </div>
      <Player
        currentSong={currentSong}
        onNext={handleNext}
        onPrevious={handlePrevious}
        playlist={playlist}
      />
      {renderAuthModal()}
    </div>
  );
}

export default App;
