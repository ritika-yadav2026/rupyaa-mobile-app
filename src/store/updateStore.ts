import { create } from 'zustand';

export interface UpdateModalState {
  visible: boolean;
  force: boolean;
  releaseNotes: string;
  storeUrl: string;
  version: string;
  showForceUpdate: (params: { releaseNotes: string; storeUrl: string; version: string }) => void;
  showOptionalUpdate: (params: { releaseNotes: string; storeUrl: string; version: string }) => void;
  hideUpdate: () => void;
}

export const useUpdateStore = create<UpdateModalState>((set) => ({
  visible: false,
  force: false,
  releaseNotes: '',
  storeUrl: '',
  version: '',
  showForceUpdate: ({ releaseNotes, storeUrl, version }) =>
    set({ visible: true, force: true, releaseNotes, storeUrl, version }),
  showOptionalUpdate: ({ releaseNotes, storeUrl, version }) =>
    set({ visible: true, force: false, releaseNotes, storeUrl, version }),
  hideUpdate: () => set({ visible: false }),
}));


