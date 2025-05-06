import { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập khi tải trang
    const token = localStorage.getItem("token"); // Giả sử dùng token (cần triển khai backend)
    if (token) {
      // Gọi API để xác thực token (chưa triển khai, chỉ là ví dụ)
      setUser({ username: "testuser" }); // Placeholder
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/api/user/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ username: data.username });
        setShowAuthModal(false);
        // Lưu token nếu backend trả về (chưa triển khai)
        return true;
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(error.message);
      return false;
    }
  };

  const register = async (username, password, email) => {
    try {
      const response = await fetch("http://localhost:8000/api/user/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser({ username: data.username });
        setShowAuthModal(false);
        return true;
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error:", error);
      alert(error.message);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    // Xóa token nếu có
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        showAuthModal,
        setShowAuthModal,
        authMode,
        setAuthMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
