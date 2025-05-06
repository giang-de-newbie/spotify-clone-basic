from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SongViewSet, ArtistViewSet, AlbumViewSet, register, login, search_music

router = DefaultRouter()
router.register(r'songs', SongViewSet)
router.register(r'artists', ArtistViewSet)
router.register(r'albums', AlbumViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', register, name='register'),
    path('auth/login/', login, name='login'),
    path('search/', search_music, name='search_music')
]