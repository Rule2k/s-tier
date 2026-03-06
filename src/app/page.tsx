"use client";

import { useSeries } from "@/hooks/useSeries";
import { TournamentTimeline } from "@/components/tournament/TournamentTimeline";
import { Spinner } from "@/components/ui/Spinner";

export default function Home() {
  const { data: series, isLoading, error } = useSeries();

  if (isLoading) return <Spinner />;
  if (error) return <p className="text-red-400">Failed to load matches.</p>;
  if (!series?.length) return <p className="text-gray-500">No matches found.</p>;

  return <TournamentTimeline series={series} />;
}
