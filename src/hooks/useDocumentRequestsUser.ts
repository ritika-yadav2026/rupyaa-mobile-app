import { useQuery } from "@tanstack/react-query";
import { GetDocumentRequestsResponse } from "../services/user/userService";
import { API_ENDPOINTS } from "../config/api";
import { api } from "../services/api/legacyFetcherApi";
import { REACT_QUERY_KEYS } from "../constants/data";
import { useAuthStore, selectIsAuthenticated } from "../store/useAuthStore";

const fetchDocumentRequestsUser = async (): Promise<GetDocumentRequestsResponse> => {
  try {
    const response = await api.request<GetDocumentRequestsResponse>(API_ENDPOINTS.user.getDocumentRequests);
    return response;
  } catch (error) {
    console.error('Error fetching document requests', error);
    throw error;
  }
};

export function useDocumentRequestsUser() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  const query = useQuery({
    queryKey: REACT_QUERY_KEYS.DOCUMENT_REQUESTS_USER,
    queryFn: fetchDocumentRequestsUser,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });

  return query;
}