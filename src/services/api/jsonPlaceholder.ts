import { useQuery } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/src/config/api';
import { devConfig } from '@/src/config/dev';
import { REACT_QUERY_KEYS } from '@/src/constants/data';

export type JsonPlaceholderUser = {
  id: number;
  name: string;
  username: string;
  email: string;
  phone: string;
  website: string;
};

export const fetchJsonPlaceholderUsers = async (): Promise<JsonPlaceholderUser[]> => {
  if (devConfig.enableDebugLogs) {
    console.log('[jsonPlaceholder] GET users');
  }
  const response = await fetch(API_ENDPOINTS.external.jsonPlaceholderUsers, {
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as JsonPlaceholderUser[];
};

export const useJsonPlaceholderUsers = () =>
  useQuery({
    queryKey: REACT_QUERY_KEYS.JSON_PLACEHOLDER_USERS,
    queryFn: fetchJsonPlaceholderUsers,
    // staleTime: 60_000,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
