import { useMutation } from '@tanstack/react-query';
import { paymentService } from './paymentService';
import { getApiErrorDisplayMessage } from '@/src/utils/common-helper';
import type {
  CreatePaymentOrderRequest,
  CreatePaymentOrderResponseData,
} from '@/src/types/payment';

/**
 * React Query mutation to create a payment order.
 * On success, use the returned order_id and payment_session_id with Cashfree CFSession.
 */
export function useCreatePaymentOrder() {
  const mutation = useMutation({
    mutationFn: async (
      body: CreatePaymentOrderRequest
    ): Promise<CreatePaymentOrderResponseData> => {
      const response = await paymentService.createPaymentOrder(body);
      if (!response.success) {
        const message =
          getApiErrorDisplayMessage(response.error) ||
          'Failed to create payment order. Please try again.';
        throw new Error(message);
      }
      const data = response.data;
      if (!data?.order_id || !data?.payment_session_id) {
        throw new Error('Invalid payment order response. Please try again.');
      }
      return data;
    },
  });

  return mutation;
}
