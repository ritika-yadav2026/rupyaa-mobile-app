/**
 * Payment order types for create-payment-order API.
 */

export interface CreatePaymentOrderRequest {
  loanId: string;
  amount: number;
}

export interface CreatePaymentOrderResponseData {
  order_id: string;
  payment_session_id: string;
  [key: string]: unknown;
}

/** Cashfree order statuses returned by GET /payment/order-status/:orderId (decrypted body). */
export type PaymentOrderStatus = 'SUCCESS' | 'PENDING' | 'FAILED';

/** Decrypted payload from order-status API (wrapped in ApiResponse.data by apiClient). */
export interface OrderStatusResponseData {
  success: boolean;
  orderId: string;
  status: PaymentOrderStatus;
}
