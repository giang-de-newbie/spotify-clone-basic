"use client"

import { createContext, useContext, useState } from "react"

const PlayerContext = createContext()

export const usePlayer = () => {
  return useContext(PlayerContext)
}

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null)
  const [queue, setQueue] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(0.7)

  const playSong = (song, songs = []) => {
    setCurrentSong(song)
    setQueue(songs.filter((t) => t.id !== song.id))
    setIsPlaying(true)
  }

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const nextSong = () => {
    if (queue.length === 0) {
      setIsPlaying(false)
      return
    }

    const nextSong = queue[0]
    setCurrentSong(nextSong)
    setQueue(queue.slice(1))
    setIsPlaying(true)
  }

  const prevSong = () => {
    // This is simplified - a real implementation would need to song history
    if (!currentSong) return

    // For now, just restart the current song
    setProgress(0)
  }

  const addToQueue = (song) => {
    setQueue([...queue, song])
  }

  const clearQueue = () => {
    setQueue([])
  }

  const value = {
    currentSong,
    queue,
    isPlaying,
    progress,
    volume,
    playSong,
    togglePlay,
    nextSong,
    prevSong,
    addToQueue,
    clearQueue,
    setProgress,
    setVolume,
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

