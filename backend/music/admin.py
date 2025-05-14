from django.contrib import admin
from .models import Genre, Artist, Album, Song, Playlist, UserProfile, Video


@admin.register(Genre)
class GenreAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)
    filter_horizontal = ('genres',)

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'release_date')
    list_filter = ('artist', 'genre')
    search_fields = ('title', 'artist__name')

@admin.register(Song)
class SongAdmin(admin.ModelAdmin):
    list_display = ('title', 'album', 'song_number', 'plays')
    list_filter = ('album',)
    search_fields = ('title', 'album__title')

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'is_public')
    list_filter = ('user', 'is_public')
    search_fields = ('title', 'user__username')
    filter_horizontal = ('songs',)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user',)
    search_fields = ('user__username',)
    filter_horizontal = ('favorite_songs', 'favorite_albums',)

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ('title', 'genre', 'created_at', 'views')
    list_filter = ('genre', 'created_at')
    search_fields = ('title', 'description', 'genre__name', 'album__title', 'artists__name')
    filter_horizontal = ('artists',)
