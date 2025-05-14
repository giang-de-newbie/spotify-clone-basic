"use client"

import { useState, useEffect } from "react"
import { useMusicPlayer } from "../contexts/MusicPlayerContext"
import "./Player.css"

const Player = () => {
  const {
    queue,
    history,
    currentSong,
    isPlaying,
    volume,
    isMuted,
    duration,
    currentTime,
    progress,
    shuffle,
    repeat,
    togglePlay,
    playNextSong,
    playPreviousSong,
    seekToPosition,
    toggleMute,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    formatTime,
  } = useMusicPlayer()

  const [showVolume, setShowVolume] = useState(false)
  const [showQueue, setShowQueue] = useState(false)
  useEffect(() => {
  }, [currentTime, duration, progress]);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault()
        togglePlay()
      }

      if (e.code === "ArrowRight" && e.ctrlKey) {
        e.preventDefault()
        playNextSong()
      }

      if (e.code === "ArrowLeft" && e.ctrlKey) {
        e.preventDefault()
        playPreviousSong()
      }

      if (e.code === "KeyM" && e.ctrlKey) {
        e.preventDefault()
        toggleMute()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [togglePlay, playNextSong, playPreviousSong, toggleMute])
  if (!currentSong) {
    return (
      <div className="player-container empty">
        <div className="player-placeholder">
          <p>Select a song to play</p>
        </div>
      </div>
    )
  }

  const handleProgressChange = (e) => {
    const newProgress = Number(e.target.value);
    if (!isNaN(newProgress)) {
      seekToPosition(newProgress);
    }
  };
  const renderQueueButton = () => (
    <button 
      className={`queue-button ${showQueue ? 'active' : ''}`}
      onClick={() => setShowQueue(!showQueue)}
      title="Show queue"
    >
      <svg viewBox="0 0 24 24">
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      {queue.length > 0 && <span className="queue-count">{queue.length}</span>}
    </button>
  )
  const handleVolumeChange = (e) => {
    const newVolume = Number.parseFloat(e.target.value)
    changeVolume(newVolume)
  }

  return (
    <div className="player-container">
      <div className="player-left">
        <div className="now-playing">
          {currentSong.image && (
            <img
              src={currentSong.image || "/placeholder.svg"}
              alt={currentSong.name}
              className="song-artwork"
            />
          )}
          <div className="song-info">
            <div className="song-name">{currentSong.name}</div>
            <div className="song-artist">{currentSong.artists?.map((artist) => artist.name).join(", ")}</div>
          </div>
          <a className="like-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={currentSong.is_favorite ? "#1db954" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </a>
        </div>
      </div>

      <div className="player-center">
        <div className="player-controls">
        {renderQueueButton()}
          <button
            className={`shuffle-button ${shuffle ? "active" : ""}`}
            onClick={toggleShuffle}
            title="Enable shuffle"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
          </button>

          <button className="prev-button" onClick={playPreviousSong} title="Previous">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="19 20 9 12 19 4 19 20"></polygon>
              <line x1="5" y1="19" x2="5" y2="5"></line>
            </svg>
          </button>

          <button className="play-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            )}
          </button>

          <button className="next-button" onClick={playNextSong} title="Next">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>

          <button
            className={`repeat-button ${repeat !== "off" ? "active" : ""} ${repeat === "one" ? "repeat-one" : ""}`}
            onClick={toggleRepeat}
            title={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                <text x="11" y="14" fontSize="8" fontWeight="bold">
                  1
                </text>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="17 1 21 5 17 9"></polyline>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <polyline points="7 23 3 19 7 15"></polyline>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            )}
          </button>
        </div>
        {showQueue && (
          <div className="queue-panel">
            <div className="queue-header">
              <h4>Next in queue</h4>
              <button onClick={() => setShowQueue(false)}>×</button>
            </div>
            <div className="queue-list">
              {queue.map((song, index) => (
                <div key={`${song.id}-${index}`} className="queue-item">
                  <span className="queue-index">{index + 1}</span>
                  <img 
                    src={song.image || '/placeholder.svg'} 
                    alt={song.name}
                    className="queue-artwork"
                  />
                  <div className="queue-info">
                    <div className="queue-name">{song.name}</div>
                    <div className="queue-artist">
                      {song.artists?.map(a => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
              {queue.length === 0 && (
                <div className="queue-empty">Queue is empty</div>
              )}
            </div>
          </div>
        )}

        <div className="progress-container">
          <span className="time current">{formatTime(currentTime)}</span>
          <div className="progress-bar">
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleProgressChange}
              className="progress-slider"
            />
            <div className="progress-filled" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="time total">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-right">
        <div className="volume-container">
          <button
            className="volume-button"
            onClick={toggleMute}
            onMouseEnter={() => setShowVolume(true)}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <line x1="23" y1="9" x2="17" y2="15"></line>
                <line x1="17" y1="9" x2="23" y2="15"></line>
              </svg>
            ) : volume < 0.5 ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
              </svg>
            )}
          </button>

          <div
            className={`volume-slider-container ${showVolume ? "show" : ""}`}
            onMouseLeave={() => setShowVolume(false)}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player

