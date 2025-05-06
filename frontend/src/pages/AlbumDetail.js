import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const AlbumDetail = ({ user, accessToken }) => {
  const { id } = useParams();
  const [album, setAlbum] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!user || !accessToken) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:8000/api/albums/${id}/`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setAlbum(response.data);
      } catch (err) {
        console.error(
          "Error fetching album:",
          err.response?.data || err.message
        );
        if (err.response) {
          if (err.response.status === 401) {
            setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
            navigate("/login");
          } else if (err.response.status === 403) {
            setError("Bạn không có quyền truy cập album này.");
          } else if (err.response.status === 404) {
            setError("Album không tồn tại.");
          } else {
            setError(
              `Lỗi từ server: ${err.response.status} - ${JSON.stringify(
                err.response.data
              )}`
            );
          }
        } else {
          setError("Không thể kết nối đến server. Vui lòng kiểm tra lại.");
        }
      }
    };
    fetchAlbum();
  }, [id, user, accessToken, navigate]);

  if (!user) return <p className="text-white">Vui lòng đăng nhập.</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!album) return <p className="text-white">Đang tải...</p>;

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="mb-6 text-4xl font-bold text-white">
        Album: {album.title}
      </h1>
      <div className="mb-6">
        <img
          src={album.cover || "https://via.placeholder.com/300"}
          alt={album.title}
          className="object-cover rounded-lg w-72 h-72"
        />
        <p className="mt-4 text-white">Người tạo: {user.username}</p>
        <p className="text-gray-400">
          Ngày tạo: {new Date(album.created_at).toLocaleDateString()}
        </p>
      </div>
      <h2 className="mb-4 text-2xl font-semibold text-white">
        Danh sách bài hát
      </h2>
      {album.songs && album.songs.length > 0 ? (
        <ul className="space-y-2">
          {album.songs.map((song) => (
            <li key={song.id} className="p-2 bg-gray-800 rounded-lg">
              <span className="text-white">{song.title}</span>
              <span className="ml-2 text-gray-400">
                {" "}
                - {song.artist_name || "Không rõ"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-white">Không có bài hát trong album này.</p>
      )}
    </div>
  );
};

export default AlbumDetail;
