export interface CreditScorePullRequest {
  fullName: string;
  panNumber: string;
  dob: string; // yyyy-mm-dd
  mobileNumber: string;
  consent: boolean;
}

export interface CreditScorePullResponse {
  success?: boolean;
  message?: string;
  pdfUrl?: string;
}
