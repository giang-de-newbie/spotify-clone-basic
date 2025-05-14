"use client"

import { useState } from "react"
import { useMusicPlayer } from "../contexts/MusicPlayerContext"

const SongList = ({ songs, showAlbum = true, showDateAdded = true, showDuration = true }) => {
  const { currentSong, isPlaying, playSong, formatTime } = useMusicPlayer()

  const [hoveredIndex, setHoveredIndex] = useState(null)

  const handlePlaySong = (song, index) => {
    // Play the clicked song and add the rest to the queue
    const songsAfterCurrent = songs.slice(index + 1)
    const songsBeforeCurrent = songs.slice(0, index)

    // Combine songs to create a queue that starts from the clicked song
    // and continues with the rest of the songs in order
    playSong(song, [...songsAfterCurrent, ...songsBeforeCurrent])
  }

  return (
    <div className="song-list">
      <table className="w-full text-left">
        <thead className="border-b border-[#282828] text-gray-400 text-sm">
          <tr>
            <th className="pb-2 w-12">#</th>
            <th className="pb-2">Title</th>
            {showAlbum && <th className="pb-2">Album</th>}
            {showDateAdded && <th className="pb-2">Date added</th>}
            {showDuration && (
              <th className="pb-2 text-right pr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {songs.map((song, index) => (
            <tr
              key={song.id}
              className={`hover:bg-[#282828] group ${currentSong?.id === song.id ? "text-green-500" : ""}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <td className="py-2 px-2">
                <div className="relative w-4 h-4 flex items-center justify-center">
                  {hoveredIndex === index ? (
                    <button className="text-white" onClick={() => handlePlaySong(song, index)}>
                      {currentSong?.id === song.id && isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                      )}
                    </button>
                  ) : (
                    <span className={currentSong?.id === song.id ? "text-green-500" : ""}>
                      {currentSong?.id === song.id && isPlaying ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-4 h-4 text-green-500"
                        >
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      ) : (
                        index + 1
                      )}
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2">
                <div className="flex items-center">
                  <img
                    src={song.album?.images?.[0]?.url || "/placeholder.svg"}
                    alt={song.name}
                    className="w-10 h-10 mr-3 object-cover"
                  />
                  <div>
                    <div className={`font-medium ${currentSong?.id === song.id ? "text-green-500" : ""}`}>
                      {song.name}
                    </div>
                    <div className="text-sm text-gray-400">
                      {song.artists?.map((artist) => artist.name).join(", ")}
                    </div>
                  </div>
                </div>
              </td>
              {showAlbum && <td className="py-2 text-gray-400">{song.album?.name}</td>}
              {showDateAdded && (
                <td className="py-2 text-gray-400">
                  {song.added_at ? new Date(song.added_at).toLocaleDateString() : ""}
                </td>
              )}
              {showDuration && (
                <td className="py-2 text-gray-400 text-right pr-4">{formatTime(song.duration_ms / 1000)}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default SongList

