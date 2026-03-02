"use client";

import { useMatches } from "@/hooks/useMatches";
import { MatchTimeline } from "@/components/timeline/MatchTimeline";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const { data: matches, isLoading, error } = useMatches();

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400">Failed to load matches.</p>;
  if (!matches?.length) return <p className="text-gray-500">No matches found.</p>;

  return <MatchTimeline matches={matches} />;
}
