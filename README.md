# spotify-clone-basic

Spotify Clone
This is a web-based music application inspired by Spotify, built using Django for the backend and React for the frontend. It allows users to manage songs, create albums, and enjoy a personalized music experience.
Features

User authentication (login/register/logout)
Admin panel to manage songs and artists
User library to create and manage custom albums
Song playback with playlist support
Search functionality
Responsive design

Prerequisites

Python 3.8+
Node.js 14.x+
npm 6.x+
SQLite (default database) or any other database supported by Django

Installation
Backend Setup

Clone the repository:
git clone https://github.com/giang-de-newbie/spotify-clone-basic
cd backend

Create a virtual environment:
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate

Install dependencies:
pip install -r requirements.txt

Set up the database:

Create a superuser for admin access:python manage.py migrate
python manage.py createsuperuser

Run the backend:
python manage.py runserver

Access the API at http://localhost:8000.

Frontend Setup

Navigate to the frontend directory:
cd frontend

Install dependencies:
npm install

Run the frontend:
npm start

Access the app at http://localhost:3000.

Usage

Login/Register: Use the login or register page to access the application.
Admin Panel: Log in with the superuser credentials at /admin to manage songs and artists.
Library: Create albums and add favorite songs at /library.
Playback: Play songs and navigate playlists from the player at the bottom.

API Endpoints

GET /api/music/songs/: List all songs (public access)
GET /api/music/artists/: List all artists (public access)
GET /api/music/albums/: List albums (authenticated)
POST /api/music/albums/: Create a new album (authenticated)
GET /api/user/me/: Get user profile (authenticated)

Contributing

Fork the repository.
Create a new branch: git checkout -b feature-name.
Make your changes and commit: git commit -m "Description of changes".
Push to the branch: git push origin feature-name.
Submit a pull request.

License
This project is licensed under the MIT License - see the LICENSE file for details.
Acknowledgments

Built with Django and React.
Inspired by Spotify's user interface and functionality.
