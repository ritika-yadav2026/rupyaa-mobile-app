import type { SupportIssueValue } from '@/src/config/supportIssueOptions';
import type { DocumentFile } from '@/src/utils/documentFilePicker';

/** Scalar fields sent to POST /tickets/customer. */
export interface CreateCustomerTicketRequest {
  phoneNumber: string;
  subject: string;
  description?: string;
  issueCategory?: SupportIssueValue;
  applicationNumber?: string;
}

/** Params for creating a ticket including optional file attachments. */
export interface CreateCustomerTicketParams extends CreateCustomerTicketRequest {
  files?: DocumentFile[];
}

export interface CreateCustomerTicketResponse {
  message?: string;
  [key: string]: unknown;
}
