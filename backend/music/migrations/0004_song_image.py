# Generated by Django 5.2 on 2025-04-14 02:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0003_playlist_description_song_artists_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='song',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='songs/'),
        ),
    ]
