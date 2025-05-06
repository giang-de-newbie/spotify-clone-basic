import { useState } from "react";
import axios from "axios";

const SongForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    audio_url: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:8000/api/songs/", formData)
      .then(() => {
        alert("Bài hát đã được thêm!");
        setFormData({ title: "", artist: "", audio_url: "" });
        window.location.reload();
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg mb-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Thêm bài hát</h2>
      <div className="space-y-4">
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Tên bài hát"
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="text"
          name="artist"
          value={formData.artist}
          onChange={handleChange}
          placeholder="Nghệ sĩ"
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <input
          type="url"
          name="audio_url"
          value={formData.audio_url}
          onChange={handleChange}
          placeholder="URL âm thanh"
          className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition"
        >
          Thêm
        </button>
      </div>
    </div>
  );
};

export default SongForm;
