/**
 * Generic document file picker for document requests.
 * Supports PDF, JPG, PNG, DOC, DOCX (max 10MB per file in UI hint; actual enforcement is backend).
 */

export type DocumentFile = {
  uri: string;
  name: string;
  mimeType: string;
};

type DocumentPickerAsset = {
  uri: string;
  name?: string;
  mimeType?: string;
};

type DocumentPickerResult = {
  canceled: boolean;
  assets?: DocumentPickerAsset[];
};

type DocumentPickerOptions = {
  type?: string | string[];
  copyToCacheDirectory?: boolean;
  multiple?: boolean;
};

type DocumentPickerModule = {
  getDocumentAsync: (options?: DocumentPickerOptions) => Promise<DocumentPickerResult>;
};

declare const require: (moduleName: string) => unknown;

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

function getDocumentPickerModule(): DocumentPickerModule {
  try {
    return require('expo-document-picker') as DocumentPickerModule;
  } catch {
    throw new Error(
      'Document picker is unavailable. Install expo-document-picker to upload documents.'
    );
  }
}

function normalizePickedFile(asset: DocumentPickerAsset): DocumentFile {
  const fallbackName = `document-${Date.now()}`;
  const name = asset.name ?? fallbackName;
  const mimeType = asset.mimeType ?? 'application/pdf';

  return {
    uri: asset.uri,
    name,
    mimeType,
  };
}

/**
 * Opens the system document picker for a single file.
 * Allowed types: PDF, JPG, PNG, DOC, DOCX.
 */
export async function pickDocumentFile(): Promise<DocumentFile | null> {
  const documentPicker = getDocumentPickerModule();
  const result = await documentPicker.getDocumentAsync({
    type: SUPPORTED_MIME_TYPES,
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  const selectedAsset = result.assets?.[0];
  if (!selectedAsset?.uri) {
    throw new Error('Unable to read selected file. Please try again.');
  }

  return normalizePickedFile(selectedAsset);
}

/**
 * Opens the system document picker for multiple files.
 * Allowed types: PDF, JPG, PNG, DOC, DOCX.
 * Returns empty array if user cancels.
 */
export async function pickMultipleDocumentFiles(): Promise<DocumentFile[]> {
  const documentPicker = getDocumentPickerModule();
  const result = await documentPicker.getDocumentAsync({
    type: SUPPORTED_MIME_TYPES,
    copyToCacheDirectory: true,
    multiple: true,
  });

  if (result.canceled || !result.assets?.length) {
    return [];
  }

  return result.assets
    .filter((asset): asset is DocumentPickerAsset => Boolean(asset?.uri))
    .map(normalizePickedFile);
}
