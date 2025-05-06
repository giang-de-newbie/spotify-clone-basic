import { NavLink } from "react-router-dom";
import { HomeIcon, SearchIcon, LibraryIcon } from "@heroicons/react/outline";

const Sidebar = () => {
  const playlists = [
    { id: 1, name: "Chill Hits" },
    { id: 2, name: "Top 50" },
    { id: 3, name: "Workout" },
  ];

  return (
    <div className="flex flex-col w-64 p-4 space-y-4 bg-gray-800">
      <NavLink to="/">
        <div className="text-2xl font-bold text-green-500">Spotify Clone</div>
      </NavLink>
      <nav className="space-y-2">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? "flex items-center space-x-2 text-green-500"
              : "flex items-center space-x-2 text-gray-300 hover:text-white"
          }
        >
          <HomeIcon className="w-6 h-6" />
          <span>Home</span>
        </NavLink>
        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive
              ? "flex items-center space-x-2 text-green-500"
              : "flex items-center space-x-2 text-gray-300 hover:text-white"
          }
        >
          <SearchIcon className="w-6 h-6" />
          <span>Search</span>
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            isActive
              ? "flex items-center space-x-2 text-green-500"
              : "flex items-center space-x-2 text-gray-300 hover:text-white"
          }
        >
          <LibraryIcon className="w-6 h-6" />
          <span>Your Library</span>
        </NavLink>
      </nav>
      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-gray-400">Playlists</h3>
        <ul className="space-y-2">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <NavLink
                to={`/playlist/${playlist.id}`}
                className={({ isActive }) =>
                  isActive ? "text-green-500" : "text-gray-300 hover:text-white"
                }
              >
                {playlist.name}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
