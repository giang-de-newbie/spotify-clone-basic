from rest_framework import serializers
from .models import Song, Artist, Album
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ArtistSerializer(serializers.ModelSerializer):
    image = serializers.FileField(required=False)

    class Meta:
        model = Artist
        fields = '__all__'

class AlbumSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'user', 'artist', 'song_ids', 'cover', 'created_at']

    def create(self, validated_data):
        # Tự động gán user từ request
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class AlbumDetailSerializer(serializers.ModelSerializer):
    songs = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'user', 'song_ids', 'cover', 'created_at', 'songs']

    def get_songs(self, obj):
        song_ids = obj.song_ids
        songs = Song.objects.filter(id__in=song_ids)
        return SongSerializer(songs, many=True).data

class SongSerializer(serializers.ModelSerializer):
    audio_file = serializers.FileField()
    cover = serializers.FileField(required=False)
    video_file = serializers.FileField(required=False)
    artist_name = serializers.CharField(source='artist.name', read_only=True)

    class Meta:
        model = Song
        fields = '__all__'