"use client"

import { useState, useEffect, useRef } from "react"
import { usePlayer } from "../contexts/PlayerContext"
import { Play, Pause, SkipBack, SkipForward, Volume2, Volume1, VolumeX, Repeat, Shuffle } from "lucide-react"

const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong, setProgress, progress } = usePlayer()

  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(false)
  const audioRef = useRef(null)

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch((error) => {
        console.error("Playback failed:", error)
      })
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying, currentSong])

  useEffect(() => {
    if (!audioRef.current) return

    const prevVolume = audioRef.current.volume
    audioRef.current.volume = isMuted ? 0 : volume

    return () => {
      if (audioRef.current) {
        audioRef.current.volume = prevVolume
      }
    }
  }, [volume, isMuted])

  const handleTimeUpdate = () => {
    if (!audioRef.current) return

    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
    setProgress(progress)
  }

  const handleProgressChange = (e) => {
    if (!audioRef.current) return

    const newProgress = Number.parseFloat(e.target.value)
    const newTime = (newProgress / 100) * audioRef.current.duration

    audioRef.current.currentTime = newTime
    setProgress(newProgress)
  }

  const handleVolumeChange = (e) => {
    const newVolume = Number.parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00"

    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const VolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX size={20} />
    if (volume < 0.5) return <Volume1 size={20} />
    return <Volume2 size={20} />
  }

  if (!currentSong) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] px-4 py-3">
      <audio
        ref={audioRef}
        src={currentSong.preview_url || currentSong.audio}
        onTimeUpdate={handleTimeUpdate}
        onEnded={nextSong}
      />

      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        {/* Song info */}
        <div className="flex items-center w-1/4">
          {currentSong.album?.images?.[0]?.url && (
            <img
              src={currentSong.album.images[0].url || "/placeholder.svg"}
              alt={currentSong.name}
              className="w-14 h-14 mr-3 object-cover"
            />
          )}
          <div className="truncate">
            <div className="text-sm font-medium truncate">{currentSong.name}</div>
            <div className="text-xs text-gray-400 truncate">
              {currentSong.artists?.map((artist) => artist.name).join(", ")}
            </div>
          </div>
        </div>

        {/* Player controls */}
        <div className="flex flex-col items-center w-2/4">
          <div className="flex items-center gap-4 mb-2">
            <button
              className={`text-gray-400 hover:text-white ${shuffle ? "text-green-500" : ""}`}
              onClick={() => setShuffle(!shuffle)}
            >
              <Shuffle size={20} />
            </button>
            <button className="text-gray-400 hover:text-white" onClick={prevSong}>
              <SkipBack size={20} />
            </button>
            <button className="bg-white text-black rounded-full p-2 hover:scale-105 transition" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <button className="text-gray-400 hover:text-white" onClick={nextSong}>
              <SkipForward size={20} />
            </button>
            <button
              className={`text-gray-400 hover:text-white ${repeat ? "text-green-500" : ""}`}
              onClick={() => setRepeat(!repeat)}
            >
              <Repeat size={20} />
            </button>
          </div>

          <div className="flex items-center w-full gap-2">
            <span className="text-xs text-gray-400 w-10 text-right">
              {formatTime(audioRef.current?.currentTime || 0)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress || 0}
              onChange={handleProgressChange}
              className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(audioRef.current?.duration || 0)}</span>
          </div>
        </div>

        {/* Volume controls */}
        <div className="flex items-center justify-end w-1/4 gap-2">
          <button className="text-gray-400 hover:text-white" onClick={toggleMute}>
            <VolumeIcon />
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>
      </div>
    </div>
  )
}

export default MusicPlayer

