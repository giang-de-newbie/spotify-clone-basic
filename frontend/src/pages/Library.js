import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const Library = ({ user, accessToken }) => {
  const [albums, setAlbums] = useState([]);
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    songIds: [],
  });
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !accessToken) {
        navigate("/login");
        return;
      }

      try {
        const albumsRes = await axios.get("http://localhost:8000/api/albums/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const songsRes = await axios.get("http://localhost:8000/api/songs/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const artistsRes = await axios.get(
          "http://localhost:8000/api/music/artists/",
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const userRes = await axios.get("http://localhost:8000/api/user/me/", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const currentUserId = userRes.data?.id;
        if (!currentUserId) {
          throw new Error("Không thể xác định ID người dùng.");
        }

        setAlbums(
          albumsRes.data.filter((album) => album.user === currentUserId)
        );
        setSongs(songsRes.data || []);
        setArtists(artistsRes.data || []);
      } catch (err) {
        console.error(
          "Error fetching data:",
          err.response?.data || err.message
        );
        setError(
          "Không thể tải dữ liệu. Vui lòng kiểm tra đăng nhập hoặc thử lại."
        );
      }
    };
    fetchData();
  }, [user, accessToken, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSongToggle = (songId) => {
    setSelectedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!user || !accessToken) {
      navigate("/login");
      return;
    }

    const data = {
      title: formData.title,
      artist: formData.artist,
      song_ids: selectedSongs,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/albums/",
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      setAlbums([...albums, response.data]);
      setIsCreateFormOpen(false);
      setFormData({ title: "", artist: "", songIds: [] });
      setSelectedSongs([]);
      setError(null);
    } catch (err) {
      console.error("Error creating album:", err.response?.data || err.message);
      setError("Tạo album thất bại. Vui lòng kiểm tra lại.");
    }
  };

  if (!user)
    return <p className="text-white">Vui lòng đăng nhập để xem thư viện.</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="mb-6 text-4xl font-bold text-white">Your Library</h1>

      <button
        onClick={() => setIsCreateFormOpen(true)}
        className="px-4 py-2 mb-6 text-white bg-green-500 rounded hover:bg-green-400"
      >
        Tạo Album Mới
      </button>

      {isCreateFormOpen && (
        <div className="p-4 mb-6 bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-2xl font-semibold text-white">Tạo Album</h2>
          <form onSubmit={handleCreateAlbum} className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Tên album"
              className="w-full p-2 text-white bg-gray-700 rounded"
              required
            />
            <select
              name="artist"
              value={formData.artist}
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              required
            >
              <option value="">Chọn nghệ sĩ</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
            <div className="overflow-y-auto max-h-60">
              {songs.map((song) => (
                <div key={song.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedSongs.includes(song.id)}
                    onChange={() => handleSongToggle(song.id)}
                    className="mr-2"
                  />
                  <span className="text-white">
                    {song.title} - {song.artist_name || "Không rõ"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-400"
              >
                Tạo
              </button>
              <button
                type="button"
                onClick={() => setIsCreateFormOpen(false)}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {albums.map((album) => (
          <Link to={`/album/${album.id}`} key={album.id} className="block">
            <div className="p-4 transition bg-gray-800 rounded-lg shadow-lg hover:bg-gray-700">
              <img
                src={album.cover || "https://via.placeholder.com/150"}
                alt={album.title}
                className="object-cover w-full h-40 rounded-t-lg"
              />
              <div className="p-2">
                <h3 className="font-medium text-white truncate">
                  {album.title}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  Người tạo: {user.username}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {albums.length === 0 && (
        <p className="text-white">Bạn chưa tạo album nào.</p>
      )}
    </div>
  );
};

export default Library;
