"use client"

import { useCallback, useEffect, useRef, useState, createContext, useContext } from "react"
import api from "../services/api"
import { useAuth } from "./AuthContext" 

const MusicPlayerContext = createContext()

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext)
  if (!context) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider")
  }
  return context
}

export const MusicPlayerProvider = ({ children }) => {
  // Player state
  const { user, showLogin } = useAuth() 
  const [currentSong, setCurrentSong] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [favorites, setFavorites] = useState([])
  const [queue, setQueue] = useState([])
  const [history, setHistory] = useState([])
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState("off") // 'off', 'all', 'one'


  // Audio element reference
  const audioRef = useRef(null)

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        if (!user) return // Không fetch nếu chưa đăng nhập
        
        const response = await api.getFavoriteSongs()
        setFavorites(response.data || [])
      } catch (error) {
        console.error("Error fetching favorites:", error)
        if (error.response?.status === 401) {
          // Xử lý khi token hết hạn
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
    
    if (user) {
      fetchFavorites()
    } else {
      setFavorites([]) // Reset favorites khi đăng xuất
    }
  }, [user])
  
  const toggleFavorite = async (songId) => {
    if (!user) {
      showLogin()
      return
    }

    try {
      if (favorites.some(song => song.id === songId)) {
        await api.removeFavoriteSong(songId)
        setFavorites(favorites.filter(song => song.id !== songId))
      } else {
        await api.addFavoriteSong(songId)
        const songDetail = await api.getSong(songId)
        setFavorites([...favorites, songDetail.data])
      }
    } catch (error) {
      console.error("Error toggling favorite:", error)
      if (error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        showLogin()
      }
    }
  }
  useEffect(() => {
    if (!audioRef.current || !currentSong) return
    
    const playAudio = async () => {
      try {
        setIsLoading(true)
        setError(null)
  
        audioRef.current.src = currentSong.audio || currentSong.preview_url || ""

        audioRef.current.load()
  
        if (isPlaying) {
          await audioRef.current.play()
        }
      } catch (err) {
        setError(err.message)
        setIsPlaying(false)
      } finally {
        setIsLoading(false)
      }
    }
  
    playAudio()
  }, [currentSong])
  // Handle play/pause state changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return

    const handlePlayback = async () => {
      try {
        if (isPlaying) {
          await audioRef.current.play()
        } else {
          audioRef.current.pause()
        }
      } catch (err) {
        setError(err.message)
        setIsPlaying(false)
      }
    }

    handlePlayback()
  }, [isPlaying, currentSong])

  // Handle volume changes
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const togglePlay = () => {
    if (!currentSong) return
    setIsPlaying((prev) => !prev)
  }
  const playSong = useCallback(async (song, songs = []) => {
    if (!user) {
      showLogin() // Hiển thị modal đăng nhập nếu chưa đăng nhập
      return
    }
    try {
      setIsLoading(true)
      setError(null)

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      const audio = new Audio()
      audioRef.current = audio
      
      setCurrentTime(0)
      setProgress(0)

      audio.src = song.audio
      audio.volume = isMuted ? 0 : volume
      audio.load()

      await audio.play()
      
      setCurrentSong({
        ...song,
        contextSongs: songs,
        contextUri: song.contextUri || `player:${song.id}`
      })
      setQueue(songs.slice(songs.findIndex(t => t.id === song.id) + 1))
      setHistory(prev => [currentSong, ...prev].slice(0, 50))
      setIsPlaying(true)

    } catch (err) {
      console.error("Play error:", err)
      setError(err.message)
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }, [currentSong, isMuted, volume, user, showLogin])
  useEffect(() => {
    return () => {
      // Dọn dẹp khi component unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);
  const playNextSong = useCallback(async () => {
    if (queue.length > 0) {
      // Chuyển đến bài tiếp theo trong queue
      await playSong(queue[0], currentSong?.contextSongs);
    } else if (repeat === "all" && currentSong?.contextSongs?.length > 0) {
      // Lặp lại từ đầu danh sách
      await playSong(
        currentSong.contextSongs[0], 
        currentSong.contextSongs
      );
    } else {
      setIsPlaying(false);
    }
  }, [queue, currentSong, repeat, playSong]);
    // Initialize audio element
    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
    
      const handleTimeUpdate = () => {
        if (!isNaN(audio.duration)) {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };
    
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
    
      const handleEnded = () => {
        playNextSong();
      };
    
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
    
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }, [playNextSong]);
  const playPreviousSong = useCallback(async () => {
    // Nếu đang phát >3s thì reset về đầu bài
    if (audioRef.current?.currentTime > 3) {
      audioRef.current.currentTime = 0;
      return;
    }
  
    // Chuyển về bài trước từ history
    if (history.length > 0) {
      await playSong(history[0], currentSong?.contextSongs || []);
    }
  }, [history, currentSong, playSong]);
  useEffect(() => {
    if (shuffle && queue.length > 0) {
      setQueue(prev => shuffleArray([...prev]))
    }
  }, [shuffle])

  const seekToPosition = useCallback((percent) => {
    if (!audioRef.current || isNaN(duration)) return;
    
    const seekTime = (percent / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
    setProgress(percent);
  }, [duration]);

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const changeVolume = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)))
    setIsMuted(newVolume === 0)
  }

  const toggleShuffle = () => {
    setShuffle((prev) => {
      const newShuffle = !prev
      if (newShuffle && queue.length > 0) {
        setQueue(shuffleArray([...queue]))
      }
      return newShuffle
    })
  }

  const toggleRepeat = () => {
    setRepeat((prev) => {
      if (prev === "off") return "all"
      if (prev === "all") return "one"
      return "off"
    })
  }
  useEffect(() => {;
  }, [currentSong, queue, history]);
  const addToQueue = (song) => {
    setQueue((prev) => [...prev, song])
  }

  const clearQueue = () => {
    setQueue([])
  }

  // Helper functions
  const shuffleArray = (array) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00"

    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Context value
  const value = {
    // Current state
    currentSong,
    isPlaying,
    volume,
    isMuted,
    duration,
    currentTime,
    progress,
    queue,
    history,
    shuffle,
    repeat,
    isLoading,
    error,
    favorites,

    // Player controls
    playSong,
    togglePlay,
    playNextSong,
    playPreviousSong,
    seekToPosition,
    toggleMute,
    changeVolume,
    toggleShuffle,
    toggleRepeat,
    addToQueue,
    clearQueue,
    toggleFavorite,

    // Utilities
    formatTime,
  }

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export default MusicPlayerProvider