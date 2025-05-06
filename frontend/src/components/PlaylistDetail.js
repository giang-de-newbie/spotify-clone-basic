import { useParams } from "react-router-dom";
import SongList from "./SongList";

const PlaylistDetail = () => {
  const { id } = useParams();
  const playlists = {
    1: { name: "Chill Hits", description: "Relax with these chill tracks." },
    2: { name: "Top 50", description: "The most popular songs right now." },
    3: { name: "Workout", description: "Get pumped with these tracks." },
  };

  const playlist = playlists[id] || {
    name: "Unknown Playlist",
    description: "",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-4xl font-bold">{playlist.name}</h1>
        <p className="text-gray-400 mt-2">{playlist.description}</p>
      </div>
      <SongList
        onPlay={(song) =>
          (document.querySelector("audio").src = song.audio_url)
        }
      />
    </div>
  );
};

export default PlaylistDetail;
