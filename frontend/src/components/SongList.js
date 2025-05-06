import { useState, useEffect } from "react";
import axios from "axios";

const SongList = ({ songs: propSongs, onPlay }) => {
  const [songs, setSongs] = useState(propSongs || []);

  useEffect(() => {
    if (!propSongs) {
      axios
        .get("http://localhost:8000/api/songs/")
        .then((res) => {
          console.log("SongList data:", res.data);
          setSongs(res.data);
        })
        .catch((err) => console.error("SongList error:", err));
    }
  }, [propSongs]);

  return (
    <div className="song-list">
      <div className="grid gap-2">
        {songs.map((song, index) => (
          <div
            key={song.id}
            className="flex items-center justify-between p-3 transition bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
            onClick={() =>
              onPlay({
                id: song.id,
                title: song.title,
                artist: song.artist.name,
                audio_url: song.audio_file,
                cover: song.cover || "https://via.placeholder.com/48",
                video_url: song.video_file || null,
              })
            }
          >
            <div className="flex items-center space-x-4">
              <span className="w-8 text-center text-gray-400">{index + 1}</span>
              <img
                src={song.cover || "https://via.placeholder.com/48"}
                alt={song.title}
                className="w-12 h-12 rounded"
              />
              <div>
                <h3 className="text-base font-medium text-white">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-400">{song.artist.name}</p>
                {song.video_file && (
                  <p className="text-xs text-green-500">Có video</p>
                )}
              </div>
            </div>
            <button className="p-2 text-white bg-green-500 rounded-full hover:bg-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l4-2a1 1 0 000-1.664l-4-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SongList;
