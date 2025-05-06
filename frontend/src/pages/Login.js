import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:8000/api/user/login/",
        formData
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-lg">
        <h2 className="mb-6 text-3xl font-bold text-center text-white">
          Đăng Nhập
        </h2>
        {error && <p className="mb-4 text-red-500">{error}</p>}
        <div className="space-y-6">
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
            Đăng Nhập
          </button>
        </div>
        <p className="mt-4 text-center text-gray-400">
          Chưa có tài khoản?{" "}
          <a href="/register" className="text-green-500 hover:underline">
            Đăng Ký
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
