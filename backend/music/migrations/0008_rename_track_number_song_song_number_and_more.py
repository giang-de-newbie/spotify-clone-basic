# Generated by Django 5.2 on 2025-04-26 13:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('music', '0007_useralbum'),
    ]

    operations = [
        migrations.RenameField(
            model_name='song',
            old_name='track_number',
            new_name='song_number',
        ),
        migrations.RenameField(
            model_name='useralbum',
            old_name='tracks',
            new_name='songs',
        ),
    ]
