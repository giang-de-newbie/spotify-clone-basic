from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from music.views import SongViewSet, ArtistViewSet, AlbumViewSet
from user.views import get_user_profile, update_profile, change_password
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'api/music/songs', SongViewSet)
router.register(r'api/music/artists', ArtistViewSet)
router.register(r'api/music/albums', AlbumViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('api/user/me/', get_user_profile, name='user-profile'),
    path('api/user/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/user/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/user/register/', include('user.urls')),
    path('admin/', admin.site.urls),
    path('api/user/', include('user.urls')),
    path('api/songs/', include('songs.urls')),
    path('api/', include('music.urls')),
    path('api/user/update_profile/', update_profile, name='update-profile'),
    path('api/user/change_password/', change_password, name='change-password'),
    path('api/user/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)