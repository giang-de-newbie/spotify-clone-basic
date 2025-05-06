import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AllSongs = ({ setCurrentSong, accessToken }) => {
  const [songs, setSongs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/songs/", {
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        });
        setSongs(response.data);
      } catch (err) {
        console.error("Error fetching songs:", err);
      }
    };
    fetchSongs();
  }, [accessToken]);

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

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white">Tất Cả Bài Hát</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
        >
          Quay lại
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {songs.map((song) => (
          <div
            key={song.id}
            className="overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
            onClick={() => handleSongClick(song)}
          >
            <img
              src={song.cover || "https://via.placeholder.com/150"}
              alt={song.title}
              className="object-cover w-full h-40"
            />
            <div className="p-3">
              <h3 className="font-medium text-white truncate">{song.title}</h3>
              <p className="text-sm text-gray-400 truncate">
                {song.artist_name || "Không rõ nghệ sĩ"}
              </p>
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

export default AllSongs;
