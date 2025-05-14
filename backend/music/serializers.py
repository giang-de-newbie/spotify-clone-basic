from rest_framework import serializers
from .models import Genre, Artist, Album, Song, Playlist, UserProfile, PasswordResetOTP, Video, UserAlbum
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from mutagen.mp3 import MP3
from mutagen import MutagenError
from django.core.validators import FileExtensionValidator
from django.utils import timezone
import os


class DynamicFieldsModelSerializer(serializers.ModelSerializer):
    """
    A ModelSerializer that takes an additional `fields` argument that
    controls which fields should be displayed.
    """

    def __init__(self, *args, **kwargs):
        fields = kwargs.pop('fields', None)
        super().__init__(*args, **kwargs)

        if fields is not None:
            allowed = set(fields)
            existing = set(self.fields)
            for field_name in existing - allowed:
                self.fields.pop(field_name)


class GenreSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Genre
        fields = ['id', 'name']
        read_only_fields = ['id']


class ArtistBasicSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Artist
        fields = ['id', 'name', 'image']


class ArtistSerializer(DynamicFieldsModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    albums_count = serializers.SerializerMethodField()
    songs_count = serializers.SerializerMethodField()

    class Meta:
        model = Artist
        fields = ['id', 'name', 'bio', 'image', 'genres', 'albums_count', 'songs_count']
        read_only_fields = ['id', 'albums_count', 'songs_count']

    def get_albums_count(self, obj):
        return obj.albums.count()

    def get_songs_count(self, obj):
        return obj.songs.count()


class AlbumBasicSerializer(DynamicFieldsModelSerializer):
    artist = ArtistBasicSerializer(read_only=True)

    class Meta:
        model = Album
        fields = ['id', 'title', 'artist', 'cover_image', 'release_date']


class AlbumSerializer(DynamicFieldsModelSerializer):
    artist = ArtistBasicSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)
    songs_count = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()  # Thêm trường này
    created_by_username = serializers.SerializerMethodField()  # Thêm trường này


    class Meta:
        model = Album
        fields = ['id', 'title', 'artist', 'genre', 'release_date',
              'cover_image', 'songs_count', 'duration', 'is_favorite',
              'created_by_username', 'is_user_created']
        read_only_fields = ['id', 'songs_count', 'duration', 'is_favorite', 'created_by_username']

    def get_songs_count(self, obj):
        return obj.songs.count()

    def get_duration(self, obj):
        total = sum(song.duration.total_seconds() for song in obj.songs.all())
        minutes = int(total // 60)
        seconds = int(total % 60)
        return f"{minutes}:{seconds:02}"

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False

    def get_created_by_username(self, obj):
        if obj.created_by:
            return obj.created_by.username
        return None


class SongBasicSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Song
        fields = ['id', 'title', 'duration', 'audio_file', 'image']


class SongSerializer(DynamicFieldsModelSerializer):
    album = AlbumBasicSerializer(read_only=True)
    artists = ArtistBasicSerializer(many=True, read_only=True)
    duration_str = serializers.SerializerMethodField()
    is_favorite = serializers.SerializerMethodField()
    image = serializers.ImageField(required=False)
    download_url = serializers.SerializerMethodField()
    class Meta:
        model = Song
        fields = ['id', 'title', 'album', 'artists', 'duration',
                  'duration_str', 'audio_file', 'plays', 'created_at', 'is_favorite', 'image' ,'download_url','lyrics']
        read_only_fields = ['id', 'plays', 'created_at', 'is_favorite']
        extra_kwargs = {
            'audio_file': {
                'validators': [FileExtensionValidator(allowed_extensions=['mp3', 'wav', 'ogg'])]
            }
        }

    def get_download_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.audio_file.url)
        return obj.audio_file.url

    def get_duration_str(self, obj):
        total_seconds = int(obj.duration.total_seconds())
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes}:{seconds:02d}"

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False

    def validate_audio_file(self, value):
        try:
            audio = MP3(value)
            if not audio.info.length:
                raise serializers.ValidationError("Invalid audio file")
        except MutagenError:
            raise serializers.ValidationError("Unsupported audio format")
        return value


class PlaylistBasicSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = Playlist
        fields = ['id', 'title', 'cover_image']


class PlaylistSerializer(DynamicFieldsModelSerializer):
    songs = SongBasicSerializer(many=True, read_only=True)
    user = serializers.StringRelatedField()
    songs_count = serializers.SerializerMethodField()
    total_duration = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ['id', 'title', 'user', 'description', 'songs',
                  'songs_count', 'total_duration', 'cover_image',
                  'is_public', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    def get_songs_count(self, obj):
        return obj.songs.count()

    def get_total_duration(self, obj):
        total = sum(song.duration.total_seconds() for song in obj.songs.all())
        minutes = int(total // 60)
        seconds = int(total % 60)
        return f"{minutes}:{seconds:02}"


class UserSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        extra_kwargs = {
            'email': {'required': True},
            'username': {'read_only': True}
        }


class UserProfileSerializer(DynamicFieldsModelSerializer):
    user = UserSerializer(read_only=True)
    favorite_songs = SongBasicSerializer(many=True, read_only=True)
    favorite_albums = AlbumBasicSerializer(many=True, read_only=True)
    created_albums = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'profile_picture', 'favorite_songs', 'favorite_albums', 'created_albums']

    def get_created_albums(self, obj):
        # Lấy album do người dùng tạo
        user_albums = Album.objects.filter(created_by=obj.user)
        return AlbumBasicSerializer(user_albums, many=True, context=self.context).data

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = self.get_token(self.user)

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        data['user'] = UserSerializer(self.user).data

        return data





class PasswordResetOTPSerializer(DynamicFieldsModelSerializer):
    class Meta:
        model = PasswordResetOTP
        fields = ['id', 'otp', 'created_at', 'expires_at', 'is_used']
        read_only_fields = ['id', 'created_at', 'expires_at', 'is_used']


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class VerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)
    new_password = serializers.CharField(min_length=6, required=True)
    confirm_password = serializers.CharField(min_length=6, required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match")
        return data
class VideoSerializer(serializers.ModelSerializer):
    artists = serializers.StringRelatedField(many=True)
    album = serializers.StringRelatedField()
    genre = serializers.StringRelatedField()

    class Meta:
        model = Video
        fields = '__all__'


class AlbumCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['title', 'release_date', 'cover_image', 'genre']

    def create(self, validated_data):
        user = self.context['request'].user
        # Tạo hoặc lấy nghệ sĩ tương ứng với người dùng
        artist, created = Artist.objects.get_or_create(
            name=f"{user.username}'s Collection"
        )

        album = Album.objects.create(
            title=validated_data['title'],
            artist=artist,
            release_date=validated_data.get('release_date', timezone.now().date()),
            cover_image=validated_data.get('cover_image'),
            genre=validated_data.get('genre'),
            created_by=user,
            is_user_created=True
        )

        return album


class SongCreateSerializer(serializers.ModelSerializer):
    duration_str = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Song
        fields = ['title', 'audio_file', 'image', 'duration_str']

    def validate(self, data):
        audio_file = data.get('audio_file')

        if audio_file:
            # Kiểm tra file audio
            try:
                from mutagen.mp3 import MP3
                from datetime import timedelta

                audio = MP3(audio_file)
                duration = timedelta(seconds=int(audio.info.length))
                data['duration'] = duration
            except Exception as e:
                # Nếu không thể tự động tính thời gian, dùng giá trị người dùng nhập
                if 'duration_str' in data:
                    try:
                        minutes, seconds = map(int, data['duration_str'].split(':'))
                        data['duration'] = timedelta(minutes=minutes, seconds=seconds)
                    except:
                        raise serializers.ValidationError("Invalid duration format. Use mm:ss")
                else:
                    raise serializers.ValidationError("Could not determine song duration")

        return data

    def create(self, validated_data):
        album_id = self.context.get('album_id')
        if not album_id:
            raise serializers.ValidationError("Album ID is required")

        try:
            album = Album.objects.get(id=album_id)
        except Album.DoesNotExist:
            raise serializers.ValidationError("Album not found")

        user = self.context['request'].user
        if album.created_by != user:
            raise serializers.ValidationError("You don't have permission to add songs to this album")

        if 'duration_str' in validated_data:
            validated_data.pop('duration_str')

        # Lấy số song tiếp theo
        song_number = album.songs.count() + 1

        # Tạo bài hát mới
        song = Song.objects.create(
            title=validated_data['title'],
            album=album,
            duration=validated_data['duration'],
            audio_file=validated_data['audio_file'],
            image=validated_data.get('image'),
            song_number=song_number
        )

        # Thêm nghệ sĩ cho bài hát
        song.artists.add(album.artist)

        return song


class FavoritesSerializer(serializers.Serializer):
    favorite_songs = serializers.SerializerMethodField()
    favorite_albums = serializers.SerializerMethodField()

    def get_favorite_songs(self, obj):
        user = self.context['request'].user
        try:
            user_profile = UserProfile.objects.get(user=user)
            favorite_songs = user_profile.favorite_songs.all()
            return SongSerializer(favorite_songs, many=True, context=self.context).data
        except UserProfile.DoesNotExist:
            return []

    def get_favorite_albums(self, obj):
        user = self.context['request'].user
        try:
            user_profile = UserProfile.objects.get(user=user)
            favorite_albums = user_profile.favorite_albums.all()
            return AlbumSerializer(favorite_albums, many=True, context=self.context).data
        except UserProfile.DoesNotExist:
            return []

class UserAlbumSerializer(serializers.ModelSerializer):
    songs = SongSerializer(many=True, read_only=True)
    class Meta:
        model = UserAlbum
        fields = ['id', 'user', 'title', 'description', 'cover_image', 'songs', 'created_at']
        read_only_fields = ['user', 'created_at']
        extra_kwargs = {
            'songs': {'required': False}
        }

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user