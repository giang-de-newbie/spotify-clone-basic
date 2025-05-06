import React, { useState, useEffect } from "react";
import axios from "axios";
import SearchBar from "../components/SearchBar";
import { useNavigate } from "react-router-dom";

const Search = ({ accessToken }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
    songs: [],
    artists: [],
    albums: [],
    songsFromSongsApp: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Gọi API khi query thay đổi
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setResults({
          songs: [],
          artists: [],
          albums: [],
          songsFromSongsApp: [],
        });
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Gọi API từ app music
        const musicResponse = await axios.get(
          `http://localhost:8000/api/search/?search=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }
        );
        const musicData = musicResponse.data;

        // Gọi API từ app songs
        const songsResponse = await axios.get(
          `http://localhost:8000/api/songs/`,
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }
        );
        const allSongs = songsResponse.data;
        const filteredSongsFromSongsApp = allSongs.filter(
          (song) =>
            song.title.toLowerCase().includes(query.toLowerCase()) ||
            song.artist.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          songs: musicData.songs || [],
          artists: musicData.artists || [],
          albums: musicData.albums || [],
          songsFromSongsApp: filteredSongsFromSongsApp,
        });
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Không thể tải kết quả tìm kiếm. Vui lòng thử lại sau.");
        if (err.response && err.response.status === 401) {
          setError("Vui lòng đăng nhập để thực hiện tìm kiếm.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, accessToken]);

  // Xử lý khi người dùng tìm kiếm
  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
  };

  const handleSongClick = (songId) => {
    navigate(`/songs/${songId}`);
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="mb-6 text-4xl font-bold text-white">Tìm Kiếm</h1>
      <SearchBar onSearch={handleSearch} />

      {loading && <p className="text-white">Đang tải...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {query && !loading && !error && (
        <div className="mt-6">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Kết quả tìm kiếm cho: "{query}"
          </h2>
          <div className="space-y-6">
            {results.songs.length > 0 && (
              <div>
                <h3 className="mb-2 text-xl font-semibold text-green-500">
                  Bài Hát (từ Music)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {results.songs.map((song) => (
                    <div
                      key={song.id}
                      className="overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSongClick(song.id)}
                    >
                      <img
                        src={song.cover || "https://via.placeholder.com/150"}
                        alt={song.title}
                        className="object-cover w-full h-40"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-white truncate">
                          {song.title}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.artists.length > 0 && (
              <div>
                <h3 className="mb-2 text-xl font-semibold text-green-500">
                  Nghệ Sĩ
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {results.artists.map((artist) => (
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
                        <h4 className="font-medium text-white truncate">
                          {artist.name}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.albums.length > 0 && (
              <div>
                <h3 className="mb-2 text-xl font-semibold text-green-500">
                  Album
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {results.albums.map((album) => (
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
                        <h4 className="font-medium text-white truncate">
                          {album.title}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {album.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.songsFromSongsApp.length > 0 && (
              <div>
                <h3 className="mb-2 text-xl font-semibold text-green-500">
                  Bài Hát (từ Songs App)
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                  {results.songsFromSongsApp.map((song) => (
                    <div
                      key={song.id}
                      className="overflow-hidden transition bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSongClick(song.id)}
                    >
                      <img
                        src={"https://via.placeholder.com/150"} // App songs không có cover, dùng placeholder
                        alt={song.title}
                        className="object-cover w-full h-40"
                      />
                      <div className="p-3">
                        <h4 className="font-medium text-white truncate">
                          {song.title}
                        </h4>
                        <p className="text-sm text-gray-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.songs.length === 0 &&
              results.artists.length === 0 &&
              results.albums.length === 0 &&
              results.songsFromSongsApp.length === 0 && (
                <p className="text-white">Không tìm thấy kết quả nào.</p>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
