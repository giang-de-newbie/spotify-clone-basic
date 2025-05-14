import json
import os
import threading
from datetime import datetime

import jwt
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.http import FileResponse, HttpResponse
from urllib.parse import quote
import requests
from io import BytesIO

from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status, permissions, generics
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Genre, Artist, Album, Song, Playlist, UserProfile, PasswordResetOTP, Video, UserAlbum
from .serializers import (
    GenreSerializer, ArtistSerializer, AlbumSerializer,
    SongSerializer, PlaylistSerializer, UserProfileSerializer,
    CustomTokenObtainPairSerializer, ForgotPasswordSerializer, VerifyOTPSerializer,
    ResetPasswordSerializer, VideoSerializer, UserAlbumSerializer, UserSerializer, UserCreateSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from transformers import pipeline
from dotenv import load_dotenv
from django.http import JsonResponse
import google.generativeai as genai

load_dotenv()


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def validate(self, attrs):
        data = super().validate(attrs)
        # Get the access token
        access_token = data['access']

        # Decode the JWT token to get the expiration time
        decoded_access_token = jwt.decode(access_token, options={"verify_exp": False})
        expiration_time = datetime.utcfromtimestamp(decoded_access_token['exp'])

        # Include expiration time in the response
        data['expiration_time'] = expiration_time.strftime('%Y-%m-%d %H:%M:%S')

        return data


class GenreViewSet(viewsets.ModelViewSet):
    queryset = Genre.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['get'])
    def albums(self, request, pk=None):
        artist = self.get_object()
        albums = artist.albums.all()
        serializer = AlbumSerializer(albums, many=True)
        return Response(serializer.data)



class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import AlbumCreateSerializer
            return AlbumCreateSerializer
        return self.serializer_class

    def perform_create(self, serializer):
        # Album sẽ được tạo trong AlbumCreateSerializer
        serializer.save()

    def get_queryset(self):
        queryset = Album.objects.all()
        if self.action == 'my_albums':
            # Chỉ lấy album của người dùng hiện tại
            return queryset.filter(created_by=self.request.user)
        return queryset

    @action(detail=True, methods=['get'])
    def songs(self, request, pk=None):
        album = self.get_object()
        songs = album.songs.all()
        serializer = SongSerializer(songs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def new_releases(self, request):
        albums = Album.objects.order_by('-release_date')[:10]
        serializer = self.get_serializer(albums, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_albums(self, request):
        """Lấy danh sách album do người dùng tạo"""
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)

        albums = self.get_queryset()
        serializer = self.get_serializer(albums, many=True, context={'request': request})
        return Response(serializer.data)

class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    @action(detail=True, methods=['post'])
    def increment_plays(self, request, pk=None):
        song = self.get_object()
        song.plays += 1
        song.save()
        return Response({'status': 'play count incremented'})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        recent_songs = Song.objects.order_by('-created_at')[:20]
        serializer = self.get_serializer(recent_songs, many=True)
        return Response(serializer.data)



class PlaySongView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, song_id):
        song = get_object_or_404(Song, id=song_id)

        # Tăng số lượt phát
        song.plays += 1
        song.save()

        # Nếu có file audio trực tiếp
        if song.audio_file:
            file_path = song.audio_file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Disposition'] = f'attachment; filename="{quote(song.title)}.mp3"'
                return response

        # Nếu có URL audio
        elif song.audio_url:
            try:
                audio_response = requests.get(song.audio_url, stream=True)
                if audio_response.status_code == 200:
                    response = HttpResponse(
                        BytesIO(audio_response.content),
                        content_type=audio_response.headers['Content-Type']
                    )
                    response['Content-Disposition'] = f'attachment; filename="{quote(song.title)}.mp3"'
                    return response
            except Exception:
                pass

        return Response({'error': 'Audio file not available'}, status=404)


class StreamSongView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, song_id):
        song = get_object_or_404(Song, id=song_id)

        # Tăng số lượt phát
        song.plays += 1
        song.save()

        # Nếu có file audio trực tiếp
        if song.audio_file:
            file_path = song.audio_file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Type'] = 'audio/mpeg'
                response['Content-Disposition'] = f'inline; filename="{quote(song.title)}.mp3"'
                return response

        # Nếu có URL audio
        elif song.audio_url:
            try:
                audio_response = requests.get(song.audio_url, stream=True)
                if audio_response.status_code == 200:
                    response = HttpResponse(
                        BytesIO(audio_response.content),
                        content_type='audio/mpeg'
                    )
                    response['Content-Disposition'] = f'inline; filename="{quote(song.title)}.mp3"'
                    return response
            except Exception:
                pass

        return Response({'error': 'Audio file not available'}, status=404)

class PlaylistViewSet(viewsets.ModelViewSet):
    queryset = Playlist.objects.all()
    serializer_class = PlaylistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Playlist.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def add_song(self, request, pk=None):
        playlist = self.get_object()
        song_id = request.data.get('song_id')
        song = get_object_or_404(Song, id=song_id)
        playlist.songs.add(song)
        return Response({'status': 'song added to playlist'})

    @action(detail=True, methods=['post'])
    def remove_song(self, request, pk=None):
        playlist = self.get_object()
        song_id = request.data.get('song_id')
        try:
            song = Song.objects.get(id=song_id)
            playlist.songs.remove(song)
            return Response({'status': 'song removed'})
        except Song.DoesNotExist:
            return Response({'error': 'Song not found'}, status=404)

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)
        created_albums = Album.objects.filter(created_by=request.user)
        serializer = UserProfileSerializer(profile, context={'request': request})
        response_data = serializer.data
        response_data['created_albums'] = AlbumSerializer(created_albums, many=True, context={'request': request}).data

        return Response(response_data)

    def put(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, song_id=None):
        if 'remove' in request.path:
            return self.remove_favorite_song(request, song_id)
        return self.add_favorite_song(request, song_id)

    def add_favorite_song(self, request, song_id):
        profile = get_object_or_404(UserProfile, user=request.user)
        song = get_object_or_404(Song, id=song_id)
        profile.favorite_songs.add(song)
        return Response({'status': 'song added to favorites'}, status=status.HTTP_200_OK)

    def remove_favorite_song(self, request, song_id):
        profile = get_object_or_404(UserProfile, user=request.user)
        song = get_object_or_404(Song, id=song_id)
        profile.favorite_songs.remove(song)
        return Response({'status': 'song removed from favorites'}, status=status.HTTP_200_OK)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')

        if not all([username, email, password]):
            return Response(
                {'error': 'Username, email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        # Create user profile
        UserProfile.objects.create(user=user)

        return Response(
            {'message': 'User created successfully'},
            status=status.HTTP_201_CREATED
        )


class ForgotPasswordView(APIView):
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Email không tồn tại trong hệ thống'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Tạo OTP và gửi email (chạy trong thread riêng)
        def send_otp_email():
            otp_obj = PasswordResetOTP.objects.create(user=user)
            subject = 'Mã OTP đặt lại mật khẩu'
            message = f'Mã OTP của bạn là: {otp_obj.otp}. Mã có hiệu lực trong 15 phút.'
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )

        threading.Thread(target=send_otp_email).start()

        return Response(
            {'message': 'Mã OTP đã được gửi đến email của bạn'},
            status=status.HTTP_200_OK
        )


class VerifyOTPView(APIView):
    def post(self, request):
        serializer = VerifyOTPSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']

        try:
            user = User.objects.get(email=email)
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=otp,
                is_used=False
            ).latest('created_at')
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response(
                {'error': 'Mã OTP không hợp lệ'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp_obj.is_valid():
            return Response(
                {'error': 'Mã OTP đã hết hạn hoặc đã sử dụng'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {'message': 'Mã OTP hợp lệ'},
            status=status.HTTP_200_OK
        )


class ResetPasswordView(APIView):
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        otp = serializer.validated_data['otp']
        new_password = serializer.validated_data['new_password']

        try:
            user = User.objects.get(email=email)
            otp_obj = PasswordResetOTP.objects.filter(
                user=user,
                otp=otp,
                is_used=False
            ).latest('created_at')
        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response(
                {'error': 'Mã OTP không hợp lệ'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp_obj.is_valid():
            return Response(
                {'error': 'Mã OTP đã hết hạn hoặc đã sử dụng'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Cập nhật mật khẩu mới
        user.set_password(new_password)
        user.save()

        # Đánh dấu OTP đã sử dụng
        otp_obj.is_used = True
        otp_obj.save()

        return Response(
            {'message': 'Đặt lại mật khẩu thành công'},
            status=status.HTTP_200_OK
        )


class PlaylistSongsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, playlist_id):
        playlist = get_object_or_404(Playlist, id=playlist_id, user=request.user)
        songs = playlist.songs.all()
        serializer = SongSerializer(songs, many=True)
        return Response({
            'songs': serializer.data,
            'total': songs.count()
        })

class AlbumSongsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, album_id):
        album = get_object_or_404(Album, id=album_id)
        songs = album.songs.all()

        album_data = AlbumSerializer(album).data  # serialize album info
        songs_data = SongSerializer(songs, many=True).data

        return Response({
            'album': album_data,
            'songs': songs_data,
            'total': songs.count()
        })


class ArtistTopSongsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, artist_id):
        artist = get_object_or_404(Artist, id=artist_id)
        songs = Song.objects.filter(artists=artist).order_by('-plays')[:10]
        serializer = SongSerializer(songs, many=True)
        return Response({
            'songs': serializer.data,
            'total': len(songs)
        })

class SearchView(APIView):
    def get(self, request):
        q = request.GET.get('q', '').strip()

        if not q:
            return Response({'songs': [], 'albums': [], 'artists': []})

        songs = Song.objects.filter(title__icontains=q)[:10]
        albums = Album.objects.filter(title__icontains=q)[:10]
        artists = Artist.objects.filter(name__icontains=q)[:10]

        return Response({
            'songs': SongSerializer(songs, many=True, context={'request': request}).data,
            'albums': AlbumSerializer(albums, many=True, context={'request': request}).data,
            'artists': ArtistSerializer(artists, many=True, context={'request': request}).data
        })

class VideoSongsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        video_songs = Song.objects.exclude(video_file='').exclude(video_file__isnull=True)
        serializer = SongSerializer(video_songs, many=True)
        return Response(serializer.data)

class StreamVideoView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, song_id):
        song = get_object_or_404(Song, id=song_id)

        if song.video_file:
            file_path = song.video_file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Type'] = 'video/mp4'
                response['Content-Disposition'] = f'inline; filename="{quote(song.title)}.mp4"'
                return response

        return Response({'error': 'Video file not available'}, status=404)

class DownloadVideoView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request, song_id):
        song = get_object_or_404(Song, id=song_id)

        if song.video_file:
            file_path = song.video_file.path
            if os.path.exists(file_path):
                response = FileResponse(open(file_path, 'rb'))
                response['Content-Type'] = 'video/mp4'
                response['Content-Disposition'] = f'attachment; filename="{quote(song.title)}.mp4"'
                return response

        return Response({'error': 'Video file not available'}, status=404)

class MultiMediaSongsView(APIView):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get(self, request):
        songs = Song.objects.all()
        data = []
        for song in songs:
            data.append({
                'id': song.id,
                'title': song.title,
                'has_audio': bool(song.audio_file or song.audio_url),
                'has_video': bool(song.video_file),
                'audio_url': song.audio_file.url if song.audio_file else song.audio_url,
                'video_url': song.video_file.url if song.video_file else None
            })
        return Response(data)

class VideoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoSerializer

    @action(detail=True, methods=['get'])
    def info(self, request, pk=None):
        video = self.get_object()
        serializer = self.get_serializer(video)
        return Response(serializer.data)


class FavoriteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        item_id = request.data.get('id')
        item_type = request.data.get('type')  # 'song' hoặc 'album'

        profile = get_object_or_404(UserProfile, user=request.user)

        if item_type == 'song':
            song = get_object_or_404(Song, id=item_id)
            if song in profile.favorite_songs.all():
                profile.favorite_songs.remove(song)
                return Response({'status': 'removed', 'message': 'Đã xóa bài hát khỏi danh sách yêu thích'})
            else:
                profile.favorite_songs.add(song)
                return Response({'status': 'added', 'message': 'Đã thêm bài hát vào danh sách yêu thích'})

        elif item_type == 'album':
            album = get_object_or_404(Album, id=item_id)
            if album in profile.favorite_albums.all():
                profile.favorite_albums.remove(album)
                return Response({'status': 'removed', 'message': 'Đã xóa album khỏi danh sách yêu thích'})
            else:
                profile.favorite_albums.add(album)
                return Response({'status': 'added', 'message': 'Đã thêm album vào danh sách yêu thích'})

        return Response({'error': 'Invalid item type'}, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        profile = get_object_or_404(UserProfile, user=request.user)

        favorite_songs = profile.favorite_songs.all()
        favorite_albums = profile.favorite_albums.all()

        songs_serializer = SongSerializer(favorite_songs, many=True, context={'request': request})
        albums_serializer = AlbumSerializer(favorite_albums, many=True, context={'request': request})

        return Response({
            'songs': songs_serializer.data,
            'albums': albums_serializer.data
        })


class AddSongToAlbumView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, album_id):
        album = get_object_or_404(Album, id=album_id)

        # Kiểm tra quyền sở hữu
        if album.created_by != request.user:
            return Response({'error': 'You do not have permission to modify this album'},
                            status=status.HTTP_403_FORBIDDEN)

        # Sử dụng serializer để validate và tạo bài hát
        from .serializers import SongCreateSerializer

        serializer = SongCreateSerializer(
            data=request.data,
            context={'request': request, 'album_id': album_id}
        )

        if serializer.is_valid():
            song = serializer.save()
            return Response(
                SongSerializer(song, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CheckFavoriteStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        item_id = request.query_params.get('id')
        item_type = request.query_params.get('type')  # 'song' hoặc 'album'

        if not item_id or not item_type:
            return Response({'error': 'id and type parameters are required'},
                            status=status.HTTP_400_BAD_REQUEST)

        profile = get_object_or_404(UserProfile, user=request.user)

        if item_type == 'song':
            song = get_object_or_404(Song, id=item_id)
            is_favorite = song in profile.favorite_songs.all()
        elif item_type == 'album':
            album = get_object_or_404(Album, id=item_id)
            is_favorite = album in profile.favorite_albums.all()
        else:
            return Response({'error': 'Invalid item type'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'is_favorite': is_favorite})


class UserAlbumViewSet(viewsets.ModelViewSet):
    queryset = UserAlbum.objects.all()
    serializer_class = UserAlbumSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Chỉ lấy albums của user hiện tại"""
        return self.queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Tự động gán user hiện tại khi tạo album"""
        serializer.save(user=self.request.user)

    # @action(detail=False, methods=['get'])
    # def my_albums(self, request):
    #     """Lấy tất cả albums của user (tương tự list view)"""
    #     albums = self.get_queryset()
    #     serializer = self.get_serializer(albums, many=True)
    #     return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_song(self, request, pk=None):
        """Thêm song vào album"""
        album = self.get_object()
        song_id = request.data.get('song_id')

        if not song_id:
            return Response(
                {'error': 'song_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            song = Song.objects.get(id=song_id)
            album.songs.add(song)
            song_serializer = SongSerializer(song)
            return Response(
                {'status': 'Song added to album', 'song': song_serializer.data},
                status=status.HTTP_200_OK
            )
        except Song.DoesNotExist:
            return Response(
                {'error': 'Song not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['delete'])
    def remove_song(self, request, pk=None):
        """Xóa song khỏi album"""
        album = self.get_object()
        song_id = request.query_params.get('song_id')

        if not song_id:
            return Response(
                {'error': 'song_id is required as query parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            song = Song.objects.get(id=song_id)
            album.songs.remove(song)
            return Response(
                {'status': 'Song removed from album'},
                status=status.HTTP_200_OK
            )
        except Song.DoesNotExist:
            return Response(
                {'error': 'Song not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def get_songs(self, request, pk=None):
        """Lấy tất cả bài hát của album theo id album"""
        album = self.get_object()  # Lấy album từ pk
        songs = album.songs.all()  # Lấy tất cả bài hát trong album
        album_serializer = UserAlbumSerializer(album)
        return Response(album_serializer.data)


class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer


class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        stats = {
            'total_users': User.objects.count(),
            'total_songs': Song.objects.count(),
            'total_albums': Album.objects.count(),
            'total_artists': Artist.objects.count(),
            'total_plays': sum(song.plays for song in Song.objects.all()),
            'recent_users': UserSerializer(User.objects.order_by('-date_joined')[:5], many=True).data,
            'popular_songs': SongSerializer(Song.objects.order_by('-plays')[:5], many=True).data
        }
        return Response(stats)

