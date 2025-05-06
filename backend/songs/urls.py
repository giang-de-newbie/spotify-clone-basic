from django.urls import path
from .views import SongListCreateView

urlpatterns = [
    path('songs/', SongListCreateView.as_view(), name='song-list-create'),
]