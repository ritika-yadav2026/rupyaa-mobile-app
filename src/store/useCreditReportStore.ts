import { create } from 'zustand';
import type { CreditReportData } from '@/src/types/creditScore';

interface CreditReportState {
  report: CreditReportData | null;
  pdfUrl: string | null;
  setReportSession: (report: CreditReportData, pdfUrl: string | null) => void;
  clearReportSession: () => void;
}

export const useCreditReportStore = create<CreditReportState>((set) => ({
  report: null,
  pdfUrl: null,
  setReportSession: (report, pdfUrl) => set({ report, pdfUrl }),
  clearReportSession: () => set({ report: null, pdfUrl: null }),
}));
