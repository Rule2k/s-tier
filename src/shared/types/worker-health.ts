export interface WorkerHealth {
  workerAlive: boolean;
  staleData: boolean;
  lastHeartbeat: string | null;
  lastDiscovery: string | null;
}
