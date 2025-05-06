import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Home = ({ setCurrentSong, user, accessToken, onLogout }) => {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const songListRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, artistsRes, albumsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/songs/", {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }),
          axios.get("http://localhost:8000/api/artists/", {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }),
          axios.get("http://localhost:8000/api/albums/", {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }),
        ]);
        setSongs(songsRes.data);
        setArtists(artistsRes.data);
        setAlbums(albumsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchData();
  }, [accessToken]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogoutAndClose = () => {
    onLogout();
    setIsDropdownOpen(false);
  };

  const handleSettings = () => {
    navigate("/settings");
    setIsDropdownOpen(false);
  };

  const handleSongClick = (song) => {
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: song.artist_name,
      audio_url: song.audio_file,
      cover: song.cover || "https://via.placeholder.com/150",
      video_url: song.video_file || null,
    });
    navigate(`/song/${song.id}`);
  };

  const handleViewAllSongs = () => {
    navigate("/all-songs");
  };

  const scrollLeft = () => {
    if (songListRef.current) {
      songListRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (songListRef.current) {
      songListRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <div className="relative min-h-screen p-6 bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white">Trang Chủ</h1>
        <div className="relative">
          {user && accessToken ? (
            <div className="flex items-center">
              <img
                src={user.avatar || "https://via.placeholder.com/40"}
                alt="User Avatar"
                className="w-10 h-10 rounded-full cursor-pointer"
                onClick={toggleDropdown}
              />
              {isDropdownOpen && (
                <div className="absolute right-0 z-10 w-64 text-black bg-white rounded-lg shadow-lg top-12">
                  <div className="p-4 border-b">
                    <p className="font-semibold">{user.username}</p>
                    <p className="text-sm text-gray-500">
                      {user.email || "user@example.com"}
                    </p>
                  </div>
                  <ul className="py-2">
                    <li
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={handleSettings}
                    >
                      Cài đặt
                    </li>
                    <li
                      className="px-4 py-2 text-red-500 cursor-pointer hover:bg-gray-100"
                      onClick={handleLogoutAndClose}
                    >
                      Đăng Xuất
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="px-4 py-2 text-white bg-yellow-600 rounded-lg">
              <p>Bạn chưa đăng nhập</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Bài Hát Nổi Bật</h2>
          <div className="flex items-center space-x-4">
            {songs.length > 10 && (
              <>
                <button onClick={scrollLeft} className="text-white">
                  <FaChevronLeft size={24} />
                </button>
                <button onClick={scrollRight} className="text-white">
                  <FaChevronRight size={24} />
                </button>
              </>
            )}
            <button
              onClick={handleViewAllSongs}
              className="text-green-500 hover:underline"
            >
              Xem tất cả
            </button>
          </div>
        </div>
        <div
          ref={songListRef}
          className="flex space-x-4 overflow-x-auto scroll-smooth scrollbar-hide"
        >
          {songs.slice(0, 10).map((song) => (
            <div
              key={song.id}
              className="flex-shrink-0 w-40 overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
              onClick={() => handleSongClick(song)}
            >
              <img
                src={song.cover || "https://via.placeholder.com/150"}
                alt={song.title}
                className="object-cover w-full h-40"
              />
              <div className="p-3">
                <h3 className="font-medium text-white truncate">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {song.artist_name || "Không rõ nghệ sĩ"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Nghệ Sĩ Nổi Bật
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {artists.map((artist) => (
            <div
              key={artist.id}
              className="overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
            >
              <img
                src={artist.image || "https://via.placeholder.com/150"}
                alt={artist.name}
                className="object-cover w-full h-40"
              />
              <div className="p-3">
                <h3 className="font-medium text-white truncate">
                  {artist.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Album Nổi Bật
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {albums.map((album) => (
            <div
              key={album.id}
              className="overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
            >
              <img
                src={album.cover || "https://via.placeholder.com/150"}
                alt={album.title}
                className="object-cover w-full h-40"
              />
              <div className="p-3">
                <h3 className="font-medium text-white truncate">
                  {album.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">{album.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
