import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';
const MEDIA_BASE_URL = '/media';

export const getMediaUrl = (path) => `${MEDIA_BASE_URL}${path}`;

const CancelToken = axios.CancelToken;
let activeRequests = 0;

axios.defaults.timeout = 10000;

// Request Interceptor
axios.interceptors.request.use(config => {
  activeRequests++;
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => {
  activeRequests--;
  return Promise.reject(error);
});

// Response Interceptor
axios.interceptors.response.use(
  response => {
    activeRequests--
    return response
  },
  async error => {
    activeRequests--
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refresh = localStorage.getItem('refresh_token')
        if (!refresh) {
          // Xử lý khi không có refresh token
          localStorage.removeItem('token')
          throw new Error('Session expired. Please login again.')
        }
        
        const { data } = await api.refreshToken(refresh)
        localStorage.setItem('token', data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return axios(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('token')
        localStorage.removeItem('refresh_token')
        throw refreshError
      }
    }

    return Promise.reject(error)
  }
)

const api = {
  // Auth
  login: async (credentials) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login/`, credentials);
      return res.data;
    } catch (error) {
      const msg = error.response?.data?.detail || 'Login failed';
      throw new Error(msg);
    }
  },
  register: (data) => axios.post(`${API_BASE_URL}/auth/register/`, data),
  verifyEmail: (token) => axios.post(`${API_BASE_URL}/auth/verify-email/`, { token }),
  resendVerificationEmail: (email) => axios.post(`${API_BASE_URL}/auth/resend-verification/`, { email }),
  forgotPassword: (email) => axios.post(`${API_BASE_URL}/auth/forgot-password/`, { email }),
  verifyPasswordResetOTP: (data) => axios.post(`${API_BASE_URL}/auth/verify-password-reset-otp/`, data),
  resetPassword: (data) => axios.post(`${API_BASE_URL}/auth/reset-password/`, data),
  sendOTP: (email) => axios.post(`${API_BASE_URL}/auth/send-otp/`, { email }),
  verifyOTP: (data) => axios.post(`${API_BASE_URL}/auth/verify-otp/`, data),
  refreshToken: (refresh) => axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh }),
  socialAuthenticate: (provider, accessToken) => axios.post(`${API_BASE_URL}/auth/social/${provider}/`, { access_token: accessToken }),

  // Songs
  getSongs: () => axios.get(`${API_BASE_URL}/songs/`),
  getSong: (id) => axios.get(`${API_BASE_URL}/songs/${id}/`),
  incrementPlays: (id) => axios.post(`${API_BASE_URL}/songs/${id}/increment_plays/`),
  getRecentlyPlayed: () => axios.get(`${API_BASE_URL}/songs/recent/`),
  getSongFileUrl: (filePath) => getMediaUrl(`/songs/${filePath}`),

  // Videos
  getVideos: () => axios.get(`${API_BASE_URL}/getVideos/`),
  getVideo: (id) => axios.get(`${API_BASE_URL}/videos/${id}/`),

  // Genres
  getGenres: () => axios.get(`${API_BASE_URL}/genres/`),
  getGenre: (id) => axios.get(`${API_BASE_URL}/genres/${id}/`),
  getGenreByArtist: (id) => axios.get(`${API_BASE_URL}/genres/artist/${id}/`),
  getGenreSongs: (id) => axios.get(`${API_BASE_URL}/genres/${id}/songs/`),
  getGenreImageUrl: (path) => getMediaUrl(`/genres/${path}`),
  getTopGenres: () => axios.get(`${API_BASE_URL}/genres/top/`),

  // Albums
  getAlbums: () => axios.get(`${API_BASE_URL}/albums/`),
  getAlbum: (id) => axios.get(`${API_BASE_URL}/albums/${id}/`),
  getAlbumSongs: (id) => axios.get(`${API_BASE_URL}/albums/${id}/songs/`),
  getAlbumByArtist: (id) => axios.get(`${API_BASE_URL}/albums/artist/${id}/`),
  getNewReleases: () => axios.get(`${API_BASE_URL}/albums/new_releases/`),
  getAlbumCoverUrl: (path) => getMediaUrl(`/albums/${path}`),

  // Artists
  getArtists: () => axios.get(`${API_BASE_URL}/artists/`),
  getArtist: (id) => axios.get(`${API_BASE_URL}/artists/${id}/`),
  getArtistAlbums: (id) => axios.get(`${API_BASE_URL}/getArtistAlbums/${id}/`),
  getArtistTopSongs: (id) => axios.get(`${API_BASE_URL}/artists/${id}/top-songs/`),
  getArtistImageUrl: (path) => getMediaUrl(`/artists/${path}`),
  getTopArtists: () => axios.get(`${API_BASE_URL}/artists/top/`),

  // Playlists
  getUserPlaylists: () => axios.get(`${API_BASE_URL}/playlists/`),
  createPlaylist: (data) => axios.post(`${API_BASE_URL}/playlists/`, data),
  getPlaylist: (id) => axios.get(`${API_BASE_URL}/playlists/${id}/`),
  getPlaylistSongs: (id) => axios.get(`${API_BASE_URL}/playlists/${id}/songs/`),
  addSongToPlaylist: (playlistId, songId) => axios.post(`${API_BASE_URL}/playlists/${playlistId}/add_song/`, { song_id: songId }),
  removeSongFromPlaylist: (playlistId, songId) => axios.post(`${API_BASE_URL}/playlists/${playlistId}/remove_song/`, { song_id: songId }),
  getTopPlaylists: () => axios.get(`${API_BASE_URL}/playlists/top/`),

  // User
  getUserProfile: () => axios.get(`${API_BASE_URL}/profile/`),
  updateProfile: (data) => axios.put(`${API_BASE_URL}/profile/`, data),
  changePassword: (data) => axios.post(`${API_BASE_URL}/profile/change-password/`, data),
  addFavoriteSong: (songId) => axios.post(`${API_BASE_URL}/profile/add_favorite_song/`, { song_id: songId }),
  removeFavoriteSong: (songId) => axios.post(`${API_BASE_URL}/profile/remove_favorite_song/`, { song_id: songId }),

  // User Albums
  getUserAlbums: () => axios.get(`${API_BASE_URL}/user-albums/`),
    
  createUserAlbum: (data) =>
    axios.post(`${API_BASE_URL}/user-albums/`, data),

  getSongsUserAlbums: (id) =>
    axios.get(`${API_BASE_URL}/user-albums/${id}/get_songs/`),

  getUserAlbum: (id) =>
    axios.get(`${API_BASE_URL}/user-albums/${id}/`),

  updateUserAlbum: (id, data) =>
    axios.put(`${API_BASE_URL}/user-albums/${id}/`, data),

  deleteUserAlbum: (id) =>
    axios.delete(`${API_BASE_URL}/user-albums/${id}/`),

  addSongToUserAlbum: (albumId, songId) =>
    axios.post(`${API_BASE_URL}/user-albums/${albumId}/add_song/`, {
      song_id: songId,
    }),

  removeSongFromUserAlbum: (albumId, songId) =>
    axios.delete(
      `${API_BASE_URL}/user-albums/${albumId}/remove_song/`,
      {
        params: { song_id: songId },
      }
    ),
  // Favorites
  getFavoriteSongs: () => axios.get(`${API_BASE_URL}/favorites/`),
  addFavoriteSong: (songId,type) => axios.post(`${API_BASE_URL}/favorites/`, { id: songId,type: type }),
  checkFavoriteStatus: (songId, type) => axios.get(`${API_BASE_URL}/favorites/check/`, { params: { id: songId, type: type } }),
  // Search
  search: (query, cancelToken) => axios.get(`${API_BASE_URL}/search/?q=${query}`, {
    cancelToken: cancelToken || CancelToken.source().token
  }),

  // Utils
  createCancelToken: () => CancelToken.source(),

  isCancel: (error) => axios.isCancel(error),

  // ==================== ADMIN ENDPOINTS ====================
  // Users
  adminGetUsers: () => axios.get(`${API_BASE_URL}/admin/users/`),
  adminCreateUser: (data) => axios.post(`${API_BASE_URL}/admin/users/`, data),
  adminUpdateUser: (id, data) => axios.put(`${API_BASE_URL}/admin/users/${id}/`, data),
  adminDeleteUser: (id) => axios.delete(`${API_BASE_URL}/admin/users/${id}/`),

  // Content Management
  adminCreateSong: (data) => axios.post(`${API_BASE_URL}/admin/songs/`, data),
  adminUpdateSong: (id, data) => axios.put(`${API_BASE_URL}/admin/songs/${id}/`, data),
  adminDeleteSong: (id) => axios.delete(`${API_BASE_URL}/admin/songs/${id}/`),

  adminCreateAlbum: (data) => axios.post(`${API_BASE_URL}/admin/albums/`, data),
  adminUpdateAlbum: (id, data) => axios.put(`${API_BASE_URL}/admin/albums/${id}/`, data),
  adminDeleteAlbum: (id) => axios.delete(`${API_BASE_URL}/admin/albums/${id}/`),

  adminCreateArtist: (data) => axios.post(`${API_BASE_URL}/admin/artists/`, data),
  adminUpdateArtist: (id, data) => axios.put(`${API_BASE_URL}/admin/artists/${id}/`, data),
  adminDeleteArtist: (id) => axios.delete(`${API_BASE_URL}/admin/artists/${id}/`),

  adminCreateGenre: (data) => axios.post(`${API_BASE_URL}/admin/genres/`, data),
  adminUpdateGenre: (id, data) => axios.put(`${API_BASE_URL}/admin/genres/${id}/`, data),
  adminDeleteGenre: (id) => axios.delete(`${API_BASE_URL}/admin/genres/${id}/`),

  adminCreateVideo: (data) => axios.post(`${API_BASE_URL}/admin/videos/`, data),
  adminUpdateVideo: (id, data) => axios.put(`${API_BASE_URL}/admin/videos/${id}/`, data),
  adminDeleteVideo: (id) => axios.delete(`${API_BASE_URL}/admin/videos/${id}/`),

  // Stats
  adminGetStats: () => axios.get(`${API_BASE_URL}/admin/stats/`),

  // ==================== UTILITIES ====================
  createCancelToken: () => CancelToken.source(),
  isCancel: (error) => axios.isCancel(error),
  getActiveRequests: () => activeRequests,

};

export default api;
