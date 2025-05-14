from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views
from .views import (
    GenreViewSet, ArtistViewSet, AlbumViewSet,
    SongViewSet, PlaylistViewSet, UserProfileView,
    CustomTokenObtainPairView, RegisterView,
    ForgotPasswordView, VerifyOTPView, ResetPasswordView,
    PlaylistSongsView, AlbumSongsView, ArtistTopSongsView, SearchView, StreamVideoView, DownloadVideoView,
    VideoViewSet, UserAlbumViewSet, AdminDashboardStatsView
)

router = DefaultRouter()
router.register(r'genres', GenreViewSet)
router.register(r'artists', ArtistViewSet)
router.register(r'albums', AlbumViewSet)
router.register(r'songs', SongViewSet)
router.register(r'videos', VideoViewSet)
router.register(r'user-albums', UserAlbumViewSet, basename='user-album')


urlpatterns = [
    # Router URLs
    path('', include(router.urls)),

    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),

    # Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('auth/verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset-password'),

    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/favorite/song/<int:song_id>/', UserProfileView.as_view(), name='add-favorite-song'),
    path('profile/favorite/song/<int:song_id>/remove/', UserProfileView.as_view(), name='remove-favorite-song'),

    # Music Resources (for frontend use)
    path('getGenres/', GenreViewSet.as_view({'get': 'list'}), name='get-genres'),
    path('getArtists/', ArtistViewSet.as_view({'get': 'list'}), name='get-artists'),
    path('getAlbums/', AlbumViewSet.as_view({'get': 'list'}), name='get-albums'),
    path('getSongs/', SongViewSet.as_view({'get': 'list'}), name='get-songs'),
    path('getPlaylists/', PlaylistViewSet.as_view({'get': 'list'}), name='get-playlists'),

    # Playlist / Album / Artist Detail
    path('playlists/<int:playlist_id>/songs/', PlaylistSongsView.as_view(), name='playlist-songs'),
    path('albums/<int:album_id>/songs/', AlbumSongsView.as_view(), name='album-songs'),
    path('artists/<int:artist_id>/top-songs/', ArtistTopSongsView.as_view(), name='artist-top-songs'),

    # Artist detail & albums
    path('getArtist/<int:artist_id>/', ArtistViewSet.as_view({'get': 'retrieve'}), name='get-artist'),
    path('getArtistAlbums/<int:pk>/', ArtistViewSet.as_view({'get': 'albums'}), name='get-artist-albums'),


    path('stream-video/<int:song_id>/', StreamVideoView.as_view(), name='stream_video'),
    path('download-video/<int:song_id>/', DownloadVideoView.as_view(), name='download_video'),

    path('favorites/', views.FavoriteView.as_view(), name='favorites'),
    path('favorites/check/', views.CheckFavoriteStatusView.as_view(), name='check_favorite'),
    path('albums/<int:album_id>/add-song/', views.AddSongToAlbumView.as_view(), name='add_song_to_album'),

    path('getVideos/', VideoViewSet.as_view({'get': 'list'}), name='get-videos'),

    # Others
    path('search/', SearchView.as_view(), name='search'),
]
