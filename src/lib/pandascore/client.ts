const PANDASCORE_API_KEY = process.env.PANDASCORE_API_KEY!;
const BASE_URL = "https://api.pandascore.co";

export const pandascoreGet = async <T>(path: string, params?: Record<string, string>): Promise<T> => {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${PANDASCORE_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`PandaScore API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
