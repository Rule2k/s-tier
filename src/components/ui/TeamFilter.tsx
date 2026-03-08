"use client";

import { useState, useRef, useEffect } from "react";

interface Team {
  name: string;
  imageUrl: string | null;
}

interface TeamFilterProps {
  teams: Team[];
  selectedTeam: string | null;
  onChange: (teamName: string | null) => void;
}

export const TeamFilter = ({ teams, selectedTeam, onChange }: TeamFilterProps) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredTeams = teams.filter((team) => {
    const query = search.toLowerCase();
    return (
      team.name.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (teamName: string) => {
    onChange(teamName);
    setSearch("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-64">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <input
          type="text"
          placeholder={selectedTeam ?? "Filter by team..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`flex-1 bg-transparent text-sm outline-none ${
            selectedTeam && !search ? "text-white placeholder:text-white" : "text-white placeholder:text-gray-500"
          }`}
        />
        {selectedTeam && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-white text-sm"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filteredTeams.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-white/10 bg-gray-900 shadow-lg">
          {filteredTeams.map((team) => (
            <li key={team.name}>
              <button
                type="button"
                onClick={() => handleSelect(team.name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white"
              >
                {team.imageUrl ? (
                  <img src={team.imageUrl} alt="" className="h-5 w-5 rounded object-contain" />
                ) : (
                  <span className="h-5 w-5 rounded bg-white/10" />
                )}
                {team.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
