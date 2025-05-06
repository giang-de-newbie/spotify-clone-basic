from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import CustomUserSerializer, UserChangePasswordSerializer  # Sử dụng CustomUserSerializer
import json

@csrf_exempt
@api_view(['POST'])
def user_login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'message': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return Response({'message': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Tìm user dựa trên email
        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        # Xác thực user với username và password
        user = authenticate(request, username=user.username, password=password)
        if user is not None:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'username': user.username,
                'email': user.email,
                'avatar': user.avatar.url if user.avatar else None,
                'message': 'Login successful',
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)
        else:
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
    return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def user_register(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return Response({'message': 'Invalid JSON data'}, status=status.HTTP_400_BAD_REQUEST)

        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        if not username or not password or not email:
            return Response({'message': 'Username, password, and email are required'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(username=username).exists():
            return Response({'message': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)

        if CustomUser.objects.filter(email=email).exists():
            return Response({'message': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

        user = CustomUser.objects.create_user(username=username, email=email, password=password)
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'username': user.username,
            'email': user.email,
            'avatar': user.avatar.url if user.avatar else None,
            'message': 'Registration successful',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)
    return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@csrf_exempt
@api_view(['POST'])
def user_logout(request):
    if request.method == 'POST':
        logout(request)
        return Response({'message': 'Logout successful'}, status=status.HTTP_200_OK)
    return Response({'message': 'Method not allowed'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    try:
        data = request.data
    except Exception as e:
        return Response({'message': 'Invalid data format'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = CustomUserSerializer(user, data=data, partial=True)  # Sử dụng CustomUserSerializer
    if serializer.is_valid():
        serializer.save()
        return Response({
            'username': user.username,
            'email': user.email,
            'avatar': user.avatar.url if user.avatar else None,
            'message': 'Profile updated successfully',
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    serializer = UserChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        old_password = serializer.validated_data['password']
        new_password = serializer.validated_data['new_password']

        if not check_password(old_password, user.password):
            return Response({"message": "Mật khẩu hiện tại không đúng."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    user = request.user
    serializer = CustomUserSerializer(user)
    return Response(serializer.data)