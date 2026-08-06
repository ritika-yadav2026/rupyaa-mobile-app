import { API_ENDPOINTS, BANK_STATEMENT_UPLOAD_TIMEOUT_MS } from '@/src/config/api';
import { apiClient } from '@/src/services/api/apiClient';
import type { ApiResponse } from '@/src/types/api';
import type {
  CreateCustomerTicketParams,
  CreateCustomerTicketRequest,
  CreateCustomerTicketResponse,
} from '@/src/types/support';
import type { DocumentFile } from '@/src/utils/documentFilePicker';

function buildJsonBody(
  params: CreateCustomerTicketParams
): CreateCustomerTicketRequest {
  const body: CreateCustomerTicketRequest = {
    phoneNumber: params.phoneNumber,
    subject: params.subject,
  };

  const description = params.description?.trim();
  if (description) {
    body.description = description;
  }

  if (params.issueCategory) {
    body.issueCategory = params.issueCategory;
  }

  const applicationNumber = params.applicationNumber?.trim();
  if (applicationNumber) {
    body.applicationNumber = applicationNumber;
  }

  return body;
}

function appendScalarFields(formData: FormData, params: CreateCustomerTicketParams): void {
  formData.append('phoneNumber', params.phoneNumber);
  formData.append('subject', params.subject);

  const description = params.description?.trim();
  if (description) {
    formData.append('description', description);
  }

  if (params.issueCategory) {
    formData.append('issueCategory', params.issueCategory);
  }

  const applicationNumber = params.applicationNumber?.trim();
  if (applicationNumber) {
    formData.append('applicationNumber', applicationNumber);
  }
}

function appendFiles(formData: FormData, files: DocumentFile[]): void {
  for (const file of files) {
    formData.append(
      'files',
      {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      } as unknown as Blob
    );
  }
}

/**
 * Creates a customer support ticket (POST /tickets/customer).
 * Uses multipart FormData when files are present; otherwise JSON.
 */
export async function createCustomerTicket(
  params: CreateCustomerTicketParams
): Promise<ApiResponse<CreateCustomerTicketResponse>> {
  const files = params.files ?? [];

  if (files.length > 0) {
    const formData = new FormData();
    appendScalarFields(formData, params);
    appendFiles(formData, files);

    return apiClient.post<CreateCustomerTicketResponse>(
      API_ENDPOINTS.tickets.createCustomerTicket,
      formData,
      { timeoutMs: BANK_STATEMENT_UPLOAD_TIMEOUT_MS }
    );
  }

  return apiClient.post<CreateCustomerTicketResponse>(
    API_ENDPOINTS.tickets.createCustomerTicket,
    buildJsonBody(params)
  );
}
