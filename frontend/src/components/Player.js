import { useState, useEffect, useRef } from "react";

const Player = ({ currentSong, onNext, onPrevious, playlist }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [repeatMode, setRepeatMode] = useState("off"); // 'off', 'all', 'single'
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMetadataLoaded, setIsMetadataLoaded] = useState(false); // Thêm trạng thái để kiểm tra metadata
  const audioRef = useRef(null);

  // Cập nhật bài hát mới
  useEffect(() => {
    if (currentSong && audioRef.current) {
      setIsMetadataLoaded(false); // Reset trạng thái metadata
      audioRef.current.src = currentSong.audio_url || "";
      audioRef.current.load();
      setProgress(0);
      setDuration(0);
      setIsPlaying(false);
    }
  }, [currentSong]);

  // Cập nhật thanh tiến trình và thời gian
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      if (repeatMode === "single") {
        audio.currentTime = 0;
        audio.play();
        setIsPlaying(true);
      } else if (repeatMode === "all") {
        if (isShuffle) {
          const randomIndex = Math.floor(Math.random() * playlist.length);
          onNext(randomIndex);
        } else {
          onNext();
        }
      } else if (onNext) {
        onNext();
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadedmetadata", () => {
      setIsMetadataLoaded(true);
      setDuration(audio.duration || 0);
    });

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadedmetadata", () => {});
    };
  }, [repeatMode, isShuffle, onNext, playlist]);

  // Điều khiển phát/tạm dừng
  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Play error:", err));
    }
  };

  // Tua tùy ý
  const handleProgressChange = (e) => {
    if (!audioRef.current || !isMetadataLoaded || !isFinite(duration)) return;
    const newTime = Math.min(Math.max(parseFloat(e.target.value), 0), duration); // Giới hạn trong [0, duration]
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  // Tua nhanh hoặc tua lại 10 giây
  const skipForward = () => {
    if (!audioRef.current || !isMetadataLoaded || !isFinite(duration)) return;
    const currentTime = audioRef.current.currentTime;
    const newTime = Math.min(currentTime + 10, duration); // Không vượt quá duration
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  const skipBackward = () => {
    if (!audioRef.current || !isMetadataLoaded || !isFinite(duration)) return;
    const currentTime = audioRef.current.currentTime;
    const newTime = Math.max(currentTime - 10, 0); // Không nhỏ hơn 0
    audioRef.current.currentTime = newTime;
    setProgress(newTime);
  };

  // Điều chỉnh âm lượng
  const handleVolumeChange = (e) => {
    if (!audioRef.current) return;
    const newVolume = parseFloat(e.target.value);
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
  };

  // Chuyển đổi shuffle
  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  // Chuyển đổi repeat mode (off -> all -> single)
  const toggleRepeat = () => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "single" : "off"
    );
  };

  // Định dạng thời gian (mm:ss)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed bottom-0 left-0 flex items-center justify-between w-full p-4 bg-gray-800 border-t border-gray-700">
      {/* Thông tin bài hát (bên trái) */}
      <div className="flex items-center w-1/4 space-x-4">
        {currentSong && (
          <>
            <img
              src={currentSong.cover || "https://via.placeholder.com/48"}
              alt={currentSong.title}
              className="w-12 h-12 rounded"
            />
            <div>
              <h3 className="font-medium text-white truncate">
                {currentSong.title}
              </h3>
              <p className="text-sm text-gray-400 truncate">
                {currentSong.artist}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Điều khiển phát nhạc (giữa) */}
      <div className="flex flex-col items-center w-2/4">
        <div className="flex items-center space-x-4">
          {/* Shuffle (bên trái) */}
          <button
            onClick={toggleShuffle}
            className={`text-gray-400 hover:text-white transition ${
              isShuffle ? "text-green-500" : ""
            }`}
            disabled={!playlist || playlist.length === 0}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M14.83 4.83a1 1 0 00-1.41 0L10 8.24 6.59 4.83a1 1 0 10-1.41 1.41L8.59 10l-3.41 3.41a1 1 0 101.41 1.41L10 11.41l3.41 3.41a1 1 0 101.41-1.41L11.41 10l3.41-3.41a1 1 0 000-1.41z" />
            </svg>
          </button>

          {/* Next (biểu tượng mũi tên phải, bên trái Play/Pause) */}
          <button
            onClick={() => onNext()}
            disabled={!onNext || !playlist || playlist.length === 0}
            className="text-gray-400 transition hover:text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 6v8l7-4-7-4zM13 6v8h2V6h-2z" />
            </svg>
          </button>

          {/* Rewind */}
          <button
            onClick={skipBackward}
            disabled={!currentSong || !isMetadataLoaded || !isFinite(duration)}
            className="text-gray-400 transition hover:text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M5 5l5 5-5 5V5zm5 0h2v10h-2V5zm5 0h2v10h-2V5z"
                transform="rotate(180 10 10)"
              />
            </svg>
          </button>

          {/* Play/Pause (lớn hơn) */}
          <button
            onClick={togglePlay}
            disabled={!currentSong}
            className="p-3 text-black transition bg-white rounded-full hover:bg-gray-200 disabled:opacity-50"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 4h2v12H6V4zm4 0h2v12h-2V4z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l4-2a1 1 0 000-1.664l-4-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Fast Forward */}
          <button
            onClick={skipForward}
            disabled={!currentSong || !isMetadataLoaded || !isFinite(duration)}
            className="text-gray-400 transition hover:text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 5l5 5-5 5V5zm5 0h2v10h-2V5zm5 0h2v10h-2V5z" />
            </svg>
          </button>

          {/* Previous (biểu tượng mũi tên trái, bên phải Play/Pause) */}
          <button
            onClick={onPrevious}
            disabled={!onPrevious || !playlist || playlist.length === 0}
            className="text-gray-400 transition hover:text-white disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6v8l-7-4 7-4zM5 6v8H3V6h2z" />
            </svg>
          </button>

          {/* Repeat (bên phải) */}
          <button
            onClick={toggleRepeat}
            className={`text-gray-400 hover:text-white transition ${
              repeatMode !== "off" ? "text-green-500" : ""
            }`}
            disabled={!currentSong}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3a7 7 0 00-7 7h1.5a5.5 5.5 0 0111 0h1.5a7 7 0 00-7-7zm0 14a7 7 0 007-7h-1.5a5.5 5.5 0 01-11 0H3a7 7 0 007 7z" />
              {repeatMode === "single" && (
                <circle
                  cx="10"
                  cy="10"
                  r="2"
                  fill="currentColor"
                  className="absolute inset-0 m-auto"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Thanh tiến trình */}
        <div className="flex items-center w-full mt-2 space-x-2">
          <span className="text-sm text-gray-400">{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={handleProgressChange}
            disabled={!currentSong || !isMetadataLoaded || !isFinite(duration)}
            className="w-full h-1 bg-gray-600 rounded-full appearance-none cursor-pointer disabled:opacity-50"
            style={{
              background:
                duration && isFinite(duration)
                  ? `linear-gradient(to right, #1db954 ${
                      (progress / duration) * 100
                    }%, #4b5563 ${(progress / duration) * 100}%)`
                  : "linear-gradient(to right, #4b5563 0%, #4b5563 100%)",
            }}
          />
          <span className="text-sm text-gray-400">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Điều chỉnh âm lượng (bên phải) */}
      <div className="flex items-center justify-end w-1/4 space-x-2">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9 4H7v2H5v2H3v4h2v2h2v2h2v-2h2v-2h2V8h-2V6H9V4zm5 2a4 4 0 013 1.62v-1.5a5.5 5.5 0 00-2-.37V4h-2v2h2v.13A4 4 0 0114 6zm0 8a4 4 0 01-3-1.62v1.5a5.5 5.5 0 002 .37V16h2v-2h-2v-.13A4 4 0 0114 14z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          disabled={!currentSong}
          className="w-24 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer disabled:opacity-50"
          style={{
            background: `linear-gradient(to right, #1db954 ${
              volume * 100
            }%, #4b5563 ${volume * 100}%)`,
          }}
        />
      </div>

      {/* Audio element ẩn */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default Player;
