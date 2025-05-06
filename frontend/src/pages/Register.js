import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/user/register/", formData);
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="mb-6 text-3xl font-bold text-center text-white">
          Đăng Ký
        </h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-gray-400">Tên Người Dùng</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 text-white placeholder-gray-400 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nhập tên người dùng"
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-400">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 text-white placeholder-gray-400 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nhập email của bạn"
            />
          </div>
          <div>
            <label className="block mb-2 text-gray-400">Mật Khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 text-white placeholder-gray-400 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full p-3 text-white transition bg-green-500 rounded-full hover:bg-green-600"
          >
            Đăng Ký
          </button>
        </div>
        <p className="mt-4 text-center text-gray-400">
          Đã có tài khoản?{" "}
          <a href="/login" className="text-green-500 hover:underline">
            Đăng Nhập
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
