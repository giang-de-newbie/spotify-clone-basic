import os
import shutil
import string
import uuid
from datetime import datetime, timedelta
import random

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import User
from django.core.files import File
from urllib.request import urlretrieve


class Genre(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name


class Artist(models.Model):
    name = models.CharField(max_length=100)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='artists/', null=True, blank=True)
    genres = models.ManyToManyField(Genre, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Album(models.Model):
    title = models.CharField(max_length=100)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='albums')
    release_date = models.DateField()
    cover_image = models.ImageField(upload_to='albums/', null=True, blank=True)
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='created_albums')
    is_user_created = models.BooleanField(default=False)
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.title} - {self.artist.name}"

    @property
    def total_duration(self):
        return sum((song.duration for song in self.songs.all()), timedelta())


def validate_audio_file(value):
    valid_extensions = ['.mp3', '.wav', '.ogg']
    ext = os.path.splitext(value.name)[1]
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported file extension.')

class Song(models.Model):
    title = models.CharField(max_length=100)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='songs')
    duration = models.DurationField()
    audio_file = models.FileField(
        upload_to='songs/',
        validators=[
            FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'ogg']),
            validate_audio_file
        ]
    )
    image = models.ImageField(upload_to='songs/', null=True, blank=True)
    artists = models.ManyToManyField(Artist, related_name='songs')
    song_number = models.PositiveIntegerField()
    plays = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    lyrics = models.TextField(null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
    @property
    def duration_str(self):
        total_seconds = int(self.duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"
    def __str__(self):
        return f"{self.title} ({self.album.title})"


class Playlist(models.Model):
    title = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    songs = models.ManyToManyField(Song, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=True)
    cover_image = models.ImageField(upload_to='playlists/', null=True, blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    def get_cover_image(self):
        if self.cover_image:
            return self.cover_image.url
        if self.songs.exists():
            return self.songs.first().album.cover_image.url
        return f"{settings.STATIC_URL}images/default_playlist.png"


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    favorite_songs = models.ManyToManyField(Song, blank=True, related_name='favorited_by')
    favorite_albums = models.ManyToManyField(Album, blank=True, related_name='favorited_by')
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return self.user.username

class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.pk:  # Chỉ tạo OTP khi tạo mới
            self.otp = ''.join(random.choices(string.digits, k=6))
            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    def is_valid(self):
        return not self.is_used and timezone.now() < self.expires_at

def validate_video_file(value):
    valid_extensions = ['.mp4', '.mov', '.avi', '.mkv']
    ext = os.path.splitext(value.name)[1]
    if not ext.lower() in valid_extensions:
        raise ValidationError('Unsupported video file extension.')

class Video(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    video_file = models.FileField(
        upload_to='videos/',
        validators=[
            FileExtensionValidator(allowed_extensions=['mp4', 'mov', 'avi', 'mkv']),
            validate_video_file
        ]
    )
    thumbnail = models.ImageField(upload_to='videos/thumbnails/', null=True, blank=True)
    duration = models.DurationField()
    artists = models.ManyToManyField(Artist, related_name='videos')
    genre = models.ForeignKey(Genre, on_delete=models.SET_NULL, null=True, blank=True)
    album = models.ForeignKey(Album, on_delete=models.SET_NULL, null=True, blank=True, related_name='videos')
    created_at = models.DateTimeField(auto_now_add=True)
    views = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.title

    @property
    def duration_str(self):
        total_seconds = int(self.duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"

class UserAlbum(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    cover_image = models.ImageField(upload_to='user_albums/', blank=True, null=True)
    songs = models.ManyToManyField('Song', related_name='user_albums')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} (by {self.user.username})"
