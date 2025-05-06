from django.contrib.auth.models import User
from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .models import Song, Artist, Album
from .serializers import SongSerializer, ArtistSerializer, AlbumSerializer
from rest_framework_simplejwt.tokens import RefreshToken

class SongViewSet(viewsets.ModelViewSet):
    queryset = Song.objects.all()
    serializer_class = SongSerializer
    permission_classes = [AllowAny]  # Tạm thời cho phép tất cả

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [AllowAny]

class AlbumViewSet(viewsets.ModelViewSet):
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Chỉ trả về album của user hiện tại
        return self.queryset.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AlbumDetailSerializer
        return AlbumSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if not all([username, email, password]):
        return Response({'message': 'Vui lòng cung cấp đầy đủ thông tin'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'message': 'Email đã tồn tại'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = User.objects.create_user(username=username, email=email, password=password)
    user.is_staff = False  # Người dùng thông thường
    user.save()
    
    refresh = RefreshToken.for_user(user)
    return Response({
        'token': str(refresh.access_token),
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'is_admin': user.is_staff}
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    user = User.objects.filter(email=email).first()
    
    if user and user.check_password(password):
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'user': {'id': user.id, 'username': user.username, 'email': user.email, 'is_admin': user.is_staff}
        })
    return Response({'message': 'Thông tin đăng nhập không hợp lệ'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_music(request):
    query = request.query_params.get('search', None)
    results = {
        'songs': [],
        'artists': [],
        'albums': [],
    }
    if query:
        songs = Song.objects.filter(title__icontains=query) | Song.objects.filter(artist__name__icontains=query)
        artists = Artist.objects.filter(name__icontains=query)
        albums = Album.objects.filter(title__icontains=query) | Album.objects.filter(artist__name__icontains=query)
        results['songs'] = SongSerializer(songs, many=True).data
        results['artists'] = ArtistSerializer(artists, many=True).data
        results['albums'] = AlbumSerializer(albums, many=True).data
    return Response(results)