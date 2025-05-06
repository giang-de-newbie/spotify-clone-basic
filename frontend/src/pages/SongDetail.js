import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const SongDetail = ({ accessToken }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadMessage, setDownloadMessage] = useState(null);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/songs/${id}/`,
          {
            headers: {
              Authorization: accessToken ? `Bearer ${accessToken}` : "",
            },
          }
        );
        setSong(response.data);
      } catch (err) {
        console.error("Error fetching song details:", err);
        setError("Không thể tải chi tiết bài hát. Vui lòng thử lại sau.");
        if (err.response && err.response.status === 401) {
          setError("Vui lòng đăng nhập để xem chi tiết.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [id, accessToken]);

  const handleDownload = async () => {
    if (song && song.audio_file) {
      try {
        const response = await fetch(song.audio_file, {
          headers: {
            Authorization: accessToken ? `Bearer ${accessToken}` : "",
          },
        });

        if (!response.ok) {
          throw new Error("Không thể tải file âm thanh.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const fileName = `${song.title.replace(/\s+/g, "_")}.mp3`;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setDownloadMessage(`Đã tải "${song.title}" thành công!`);
        setTimeout(() => setDownloadMessage(null), 3000);
      } catch (err) {
        console.error("Download error:", err);
        setDownloadMessage("Lỗi khi tải file. Vui lòng thử lại.");
        setTimeout(() => setDownloadMessage(null), 3000);
      }
    } else {
      setDownloadMessage("Không có file âm thanh để tải xuống!");
      setTimeout(() => setDownloadMessage(null), 3000);
    }
  };

  if (loading) return <p className="text-white">Đang tải...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!song) return <p className="text-white">Không tìm thấy bài hát.</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 mb-4 text-white bg-gray-600 rounded hover:bg-gray-500"
      >
        Quay lại
      </button>

      <div className="max-w-2xl p-6 mx-auto bg-gray-800 rounded-lg shadow-lg">
        <img
          src={song.cover || "https://via.placeholder.com/300"}
          alt={song.title}
          className="object-cover w-full h-64 rounded-t-lg"
        />
        <div className="p-4">
          <h1 className="mb-2 text-3xl font-bold text-white">{song.title}</h1>
          <p className="mb-4 text-xl text-gray-300">
            Nghệ sĩ: {song.artist_name || "Không rõ nghệ sĩ"}
          </p>

          {song.audio_file && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 mb-4 text-white bg-blue-500 rounded hover:bg-blue-400"
            >
              Tải xuống
            </button>
          )}

          {downloadMessage && (
            <p
              className={`mb-4 ${
                downloadMessage.includes("Lỗi")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {downloadMessage}
            </p>
          )}

          {song.video_file && (
            <div className="mb-4">
              <h2 className="mb-2 text-xl font-semibold text-white">Video:</h2>
              <video
                controls
                className="w-full rounded-lg"
                poster={song.cover || "https://via.placeholder.com/300"}
              >
                <source src={song.video_file} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            </div>
          )}

          {!song.video_file && (
            <p className="text-gray-400">Không có video cho bài hát này.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SongDetail;
