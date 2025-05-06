import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Settings = ({ user, accessToken, onLogout, updateUser }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    avatar: user?.avatar || "",
    password: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [previewAvatar, setPreviewAvatar] = useState(
    user?.avatar || "https://via.placeholder.com/150"
  );
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "avatar" && files) {
      const file = files[0];
      setFormData({ ...formData, [name]: file });
      setPreviewAvatar(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dataToSend = new FormData();
    dataToSend.append("username", formData.username);
    dataToSend.append("email", formData.email);
    if (formData.avatar instanceof File)
      dataToSend.append("avatar", formData.avatar);
    if (formData.password && formData.newPassword && formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage("Mật khẩu mới và xác nhận mật khẩu không khớp.");
        return;
      }
      dataToSend.append("password", formData.password);
      dataToSend.append("new_password", formData.newPassword);
    }

    try {
      const profileResponse = await axios.put(
        "http://localhost:8000/api/user/profile/",
        dataToSend,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // Cập nhật user thông qua callback
      const updatedUser = {
        ...user,
        username: formData.username,
        email: formData.email,
        avatar: profileResponse.data.avatar,
      };
      updateUser(updatedUser);

      if (formData.password && formData.newPassword) {
        const passwordResponse = await axios.put(
          "http://localhost:8000/api/user/change-password/",
          {
            password: formData.password,
            new_password: formData.newPassword,
            confirm_password: formData.confirmPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        setMessage("Cập nhật thông tin và mật khẩu thành công!");
      } else {
        setMessage("Cập nhật thông tin thành công!");
      }
      navigate("/"); // Điều hướng về trang chủ sau khi cập nhật
    } catch (err) {
      if (err.response) {
        setMessage(
          `Lỗi: ${
            err.response.data.message ||
            err.response.data.detail ||
            "Vui lòng thử lại."
          }`
        );
      } else {
        setMessage("Lỗi kết nối. Vui lòng thử lại.");
      }
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900">
      <h1 className="mb-6 text-4xl font-bold text-white">Cài Đặt</h1>
      <form
        onSubmit={handleSubmit}
        className="max-w-md p-6 mx-auto bg-gray-800 rounded-lg shadow-lg"
      >
        <div className="mb-4">
          <label className="block mb-2 text-white">Ảnh đại diện</label>
          <img
            src={previewAvatar}
            alt="Avatar"
            className="w-32 h-32 mb-2 rounded-full"
          />
          <input
            type="file"
            name="avatar"
            onChange={handleChange}
            className="block w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-white">Tên người dùng</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-white">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-white">Mật khẩu hiện tại</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-white">Mật khẩu mới</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-white">Xác nhận mật khẩu mới</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full p-2 text-white bg-gray-700 rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 text-white bg-green-600 rounded hover:bg-green-500"
        >
          Lưu thay đổi
        </button>
        {message && <p className="mt-4 text-center text-white">{message}</p>}
      </form>
    </div>
  );
};

export default Settings;
