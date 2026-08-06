import { apiConfig } from '@/src/config/api';
import { createFetcher } from '@/src/utils/fetcher';

/** Legacy fetcher instance — kept separate from api config to avoid require cycles. */
export const api = createFetcher({
  baseUrl: apiConfig.baseUrl,
});
