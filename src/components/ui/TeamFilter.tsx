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
    return team.name.toLowerCase().includes(query);
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
      <div className="flex items-center gap-2 border-2 border-rule bg-newsprint px-3 py-1.5">
        <input
          type="text"
          placeholder={selectedTeam ?? "Filter by team..."}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className={`flex-1 bg-transparent font-mono text-sm outline-none ${
            selectedTeam && !search ? "text-foreground placeholder:text-foreground" : "text-foreground placeholder:text-muted"
          }`}
        />
        {selectedTeam && (
          <button
            type="button"
            onClick={handleClear}
            className="text-muted hover:text-foreground text-sm font-mono"
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && filteredTeams.length > 0 && (
        <ul className="absolute z-20 mt-0 max-h-60 w-full overflow-auto bg-newsprint border-2 border-rule border-t-0 shadow-lg">
          {filteredTeams.map((team) => (
            <li key={team.name}>
              <button
                type="button"
                onClick={() => handleSelect(team.name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-mono text-foreground hover:bg-newsprint-hover"
              >
                {team.imageUrl ? (
                  <img src={team.imageUrl} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span className="h-5 w-5 bg-muted/20" />
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
