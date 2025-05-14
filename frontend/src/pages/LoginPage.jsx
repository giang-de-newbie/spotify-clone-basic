"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./LoginPage.css"
import api from "../services/api" // Import API service
import { useAuth } from "../contexts/AuthContext"

const LoginPage = ({ onClose }) => {
  const { login } = useAuth()
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot' | 'otp' | 'reset' | 'success'
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    otp: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      switch (view) {
        case 'login':
          await handleLogin(e);
          break;
        case 'signup':
          await handleSignup();
          break;
        case 'forgot':
          await handleForgotPassword();
          break;
        case 'otp':
          await handleVerifyOTP();
          break;
        case 'reset':
          await handleResetPassword();
          break;
      }
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await login(formData.username, formData.password)
      onClose()
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    setLoading(true)
    setError('')
    try {
      await api.register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      setSuccessMessage('Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.')
      setView('success')
    } catch (err) {
      setError(err.response?.data?.detail || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.forgotPassword({ email: formData.email });
      if (response.status === 200) {
        setView('otp');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.resetPassword({ 
        newPassword: formData.newPassword, 
        confirmPassword: formData.confirmPassword 
      });
      if (response.status === 200) {
        setSuccessMessage('Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.')
        setView('success');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.verifyOTP({ otp: formData.otp });
      if (response.status === 200) {
        setView('reset');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.resendOTP({ email: formData.email });
      if (response.status === 200) {
        setError('Mã OTP đã được gửi lại đến email của bạn.');
      } else {
        setError('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setView('login');
    setFormData({
      username: '',
      password: '',
      email: '',
      newPassword: '',
      confirmPassword: '',
      otp: ''
    });
    setLoading(false);
    setError('');
    setSuccessMessage('');
    onClose();
  };

  const handleBack = () => {
    switch (view) {
      case 'signup':
      case 'forgot':
      case 'success':
        setView('login');
        break;
      case 'otp':
        setView('signup');
        break;
      case 'reset':
        setView('otp');
        break;
      default:
        handleClose();
    }
  };

  const renderForm = () => {
    switch (view) {
      case 'login':
        return (
          <>
            <h2 className="modal-title">Đăng nhập vào Spotify</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Nhập tên đăng nhập"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  Ghi nhớ đăng nhập
                </label>
                <a
                  type="button"
                  className="text-button"
                  onClick={() => setView('forgot')}
                >
                  Quên mật khẩu?
                </a>
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            <div className="divider">hoặc</div>

            <button
              className="secondary-button"
              onClick={() => setView('signup')}
            >
              Đăng ký tài khoản Spotify
            </button>
          </>
        );

      case 'signup':
        return (
          <>
            <h2 className="modal-title">Đăng ký Spotify</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email của bạn"
                  required
                />
              </div>

              <div className="form-group">
                <label>Tên đăng nhập</label>
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Tạo tên đăng nhập"
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu</label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tạo mật khẩu"
                  required
                />
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng ký'}
              </button>
            </form>

            <div className="divider">hoặc</div>

            <a
              className="text-button"
              onClick={() => setView('login')}
            >
              Đã có tài khoản? Đăng nhập
            </a>
          </>
        );

      case 'success':
        return (
          <>
            <h2 className="modal-title">Thành công!</h2>
            <div className="success-message">{successMessage}</div>
            
            <button 
              className="primary-button"
              onClick={() => setView('login')}
            >
              Quay lại đăng nhập
            </button>
          </>
        );

      case 'forgot':
        return (
          <>
            <h2 className="modal-title">Quên mật khẩu</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Nhập email"
                  required
                />
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
              </button>
            </form>

            <a
              className="text-button"
              onClick={() => setView('login')}
            >
              Quay lại đăng nhập
            </a>
          </>
        );

      case 'otp':
        return (
          <>
            <h2 className="modal-title">Xác thực OTP</h2>
            {error && <div className="error-message">{error}</div>}

            <p className="instruction">Chúng tôi đã gửi mã OTP đến email của bạn. Vui lòng kiểm tra và nhập mã bên dưới.</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Mã OTP</label>
                <input
                  name="otp"
                  type="text"
                  value={formData.otp}
                  onChange={handleChange}
                  placeholder="Nhập 6 chữ số"
                  required
                />
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </form>

            <div className="resend-otp">
              <span>Không nhận được mã?</span>
              <a type="button" className="text-button" onClick={handleResendOTP}>Gửi lại</a>
            </div>
          </>
        );

      case 'reset':
        return (
          <>
            <h2 className="modal-title">Thiết lập mật khẩu mới</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  name="newPassword"
                  type="password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu mới"
                  required
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu</label>
                <input
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                />
              </div>

              <button type="submit" className="primary-button" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          </>
        );
    }
  };

  return (
    <div className="login-modal">
      <div className="login-container">

        <div className="login-card">
          

          {renderForm()}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;