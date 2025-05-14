from django.urls import re_path
from . import consumers

# from django.urls import path
# from music.consumers import ChatConsumer
websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
    # path("ws/chat/", ChatConsumer.as_asgi()),
]