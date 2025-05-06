from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


class Artist(models.Model):
    name = models.CharField(max_length=100)
    image = models.FileField(upload_to='artists/', blank=True, null=True)

    def __str__(self):
        return self.name

class Album(models.Model):
    title = models.CharField(max_length=100)
    artist = models.ForeignKey('Artist', on_delete=models.CASCADE)
    cover = models.FileField(upload_to='albums/', blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    song_ids = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return self.title

class Song(models.Model):
    title = models.CharField(max_length=100)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    album = models.ForeignKey(Album, on_delete=models.CASCADE, blank=True, null=True)
    audio_file = models.FileField(upload_to='songs/')
    cover = models.FileField(upload_to='song_covers/', blank=True, null=True) 
    video_file = models.FileField(upload_to='song_videos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title