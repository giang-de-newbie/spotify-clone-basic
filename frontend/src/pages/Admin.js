import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Admin = ({ accessToken }) => {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    audio_file: null,
    cover: null,
    video_file: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songsRes, artistsRes] = await Promise.all([
          axios.get("http://localhost:8000/api/songs/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get("http://localhost:8000/api/artists/", {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);
        setSongs(songsRes.data);
        setArtists(artistsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [accessToken]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("artist", formData.artist);
    if (formData.audio_file) data.append("audio_file", formData.audio_file);
    if (formData.cover) data.append("cover", formData.cover);
    if (formData.video_file) data.append("video_file", formData.video_file);

    try {
      await axios.post("http://localhost:8000/api/songs/", data, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSongs([...songs, { ...formData, id: Date.now() }]); // Temp ID, sẽ được cập nhật từ API
      setIsAddFormOpen(false);
      setFormData({
        title: "",
        artist: "",
        audio_file: null,
        cover: null,
        video_file: null,
      });
      setError(null);
    } catch (err) {
      console.error("Error adding song:", err);
      setError("Thêm bài hát thất bại. Vui lòng kiểm tra lại.");
    }
  };

  const handleEditSong = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("artist", formData.artist);
    if (formData.audio_file) data.append("audio_file", formData.audio_file);
    if (formData.cover) data.append("cover", formData.cover);
    if (formData.video_file) data.append("video_file", formData.video_file);

    try {
      await axios.put(
        `http://localhost:8000/api/songs/${selectedSong.id}/`,
        data,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSongs(
        songs.map((song) =>
          song.id === selectedSong.id ? { ...formData, id: song.id } : song
        )
      );
      setIsEditFormOpen(false);
      setSelectedSong(null);
      setFormData({
        title: "",
        artist: "",
        audio_file: null,
        cover: null,
        video_file: null,
      });
      setError(null);
    } catch (err) {
      console.error("Error editing song:", err);
      setError("Cập nhật bài hát thất bại. Vui lòng kiểm tra lại.");
    }
  };

  const handleDeleteSong = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa bài hát này?")) {
      try {
        await axios.delete(`http://localhost:8000/api/music/songs/${id}/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setSongs(songs.filter((song) => song.id !== id));
        setError(null);
      } catch (err) {
        console.error("Error deleting song:", err);
        setError("Xóa bài hát thất bại. Vui lòng thử lại.");
      }
    }
  };

  const openEditForm = (song) => {
    setSelectedSong(song);
    setFormData({
      title: song.title,
      artist: song.artist,
      audio_file: null,
      cover: null,
      video_file: null,
    });
    setIsEditFormOpen(true);
  };

  if (loading) return <p className="text-white">Đang tải...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="mb-6 text-4xl font-bold text-white">Quản Lý Bài Hát</h1>

      <button
        onClick={() => setIsAddFormOpen(true)}
        className="px-4 py-2 mb-6 text-white bg-green-500 rounded hover:bg-green-400"
      >
        Thêm Bài Hát
      </button>

      {/* Form Thêm Bài Hát */}
      {isAddFormOpen && (
        <div className="p-4 mb-6 bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Thêm Bài Hát Mới
          </h2>
          <form onSubmit={handleAddSong} className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Tiêu đề"
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
            <input
              type="file"
              name="audio_file"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="audio/*"
            />
            <input
              type="file"
              name="cover"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="image/*"
            />
            <input
              type="file"
              name="video_file"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="video/*"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-400"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form Sửa Bài Hát */}
      {isEditFormOpen && selectedSong && (
        <div className="p-4 mb-6 bg-gray-800 rounded-lg">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Sửa Bài Hát
          </h2>
          <form onSubmit={handleEditSong} className="space-y-4">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Tiêu đề"
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
            <input
              type="file"
              name="audio_file"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="audio/*"
            />
            <input
              type="file"
              name="cover"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="image/*"
            />
            <input
              type="file"
              name="video_file"
              onChange={handleInputChange}
              className="w-full p-2 text-white bg-gray-700 rounded"
              accept="video/*"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-400"
              >
                Cập nhật
              </button>
              <button
                type="button"
                onClick={() => setIsEditFormOpen(false)}
                className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách bài hát */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {songs.map((song) => (
          <div key={song.id} className="p-4 bg-gray-800 rounded-lg shadow-lg">
            <img
              src={song.cover || "https://via.placeholder.com/150"}
              alt={song.title}
              className="object-cover w-full h-40 rounded-t-lg"
            />
            <div className="p-2">
              <h3 className="font-medium text-white truncate">{song.title}</h3>
              <p className="text-sm text-gray-400 truncate">
                Nghệ sĩ: {song.artist_name || "Không rõ"}
              </p>
            </div>
            <div className="flex justify-between mt-2">
              <button
                onClick={() => openEditForm(song)}
                className="px-2 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-400"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDeleteSong(song.id)}
                className="px-2 py-1 text-white bg-red-500 rounded hover:bg-red-400"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {songs.length === 0 && (
        <p className="text-white">Không có bài hát nào.</p>
      )}
    </div>
  );
};

export default Admin;
