import { useState } from "react";
import { useAuth } from "./AuthContext";

const AuthModal = () => {
  const {
    showAuthModal,
    setShowAuthModal,
    authMode,
    setAuthMode,
    login,
    register,
  } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

  if (!showAuthModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (authMode === "login") {
      await login(username, password);
    } else {
      await register(username, password, email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="p-6 bg-gray-800 rounded-lg shadow-lg w-96">
        <h2 className="mb-4 text-2xl text-white">
          {authMode === "login" ? "Đăng Nhập" : "Đăng Ký"}
        </h2>
        <div className="flex justify-around mb-4">
          <button
            onClick={() => setAuthMode("login")}
            className={`px-4 py-2 rounded ${
              authMode === "login"
                ? "bg-green-500 text-white"
                : "bg-gray-600 text-gray-300"
            }`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => setAuthMode("register")}
            className={`px-4 py-2 rounded ${
              authMode === "register"
                ? "bg-green-500 text-white"
                : "bg-gray-600 text-gray-300"
            }`}
          >
            Đăng Ký
          </button>
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-300">Tên người dùng</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 text-white bg-gray-700 rounded"
            placeholder="Nhập tên người dùng"
          />
        </div>
        {authMode === "register" && (
          <div className="mb-4">
            <label className="block mb-2 text-gray-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 text-white bg-gray-700 rounded"
              placeholder="Nhập email"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="block mb-2 text-gray-300">Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 text-white bg-gray-700 rounded"
            placeholder="Nhập mật khẩu"
          />
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => setShowAuthModal(false)}
            className="px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-500"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-400"
          >
            {authMode === "login" ? "Đăng Nhập" : "Đăng Ký"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
