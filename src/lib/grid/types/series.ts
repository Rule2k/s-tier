export interface GridSeriesEdge {
  node: GridSeries;
  cursor: string;
}

export interface GridSeries {
  id: string;
  startTimeScheduled: string;
  format: {
    nameShortened: string;
  };
  tournament: {
    id: string;
    name: string;
    nameShortened: string;
    logoUrl: string;
  };
  teams: {
    baseInfo: {
      id: string;
      name: string;
      nameShortened?: string;
      logoUrl: string;
    };
  }[];
}

export interface GridAllSeriesResponse {
  allSeries: {
    edges: GridSeriesEdge[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  };
}
