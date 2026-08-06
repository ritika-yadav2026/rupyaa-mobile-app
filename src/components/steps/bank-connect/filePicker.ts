export type BankStatementFile = {
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
  getDocumentAsync: (
    options?: DocumentPickerOptions
  ) => Promise<DocumentPickerResult>;
};

declare const require: (moduleName: string) => unknown;

function getDocumentPickerModule(): DocumentPickerModule {
  try {
    return require('expo-document-picker') as DocumentPickerModule;
  } catch {
    throw new Error(
      'Document picker is unavailable. Install expo-document-picker to upload PDF statements.'
    );
  }
}

function normalizePickedFile(asset: DocumentPickerAsset): BankStatementFile {
  const fallbackName = `statement-${Date.now()}.pdf`;

  return {
    uri: asset.uri,
    name: asset.name ?? fallbackName,
    mimeType: asset.mimeType ?? 'application/pdf',
  };
}

export async function pickBankStatementPdf(): Promise<BankStatementFile | null> {
  const documentPicker = getDocumentPickerModule();
  const result = await documentPicker.getDocumentAsync({
    type: 'application/pdf',
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (result.canceled) {
    return null;
  }

  const selectedAsset = result.assets?.[0];
  if (!selectedAsset?.uri) {
    throw new Error('Unable to read selected PDF file. Please try again.');
  }

  return normalizePickedFile(selectedAsset);
}
