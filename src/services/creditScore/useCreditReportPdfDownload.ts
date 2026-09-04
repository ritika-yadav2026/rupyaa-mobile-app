import { useState } from 'react';
import { Linking, Platform } from 'react-native';

const ERROR = 'Could not download your credit report. Please try again.';

export function useCreditReportPdfDownload(pdfUrl: string | null) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [status, setStatus] = useState('');
  const download = async () => {
    const url = pdfUrl?.trim();
    if (!url) { setStatus(ERROR); return; }
    setIsDownloading(true); setStatus('');
    try {
      const nativeModuleAvailable = Platform.OS !== 'web' && Boolean((globalThis as { __turboModuleProxy?: unknown }).__turboModuleProxy);
      if (!nativeModuleAvailable) { await Linking.openURL(url); setStatus('PDF opened successfully.'); return; }
      const BlobUtil = (await import('react-native-blob-util')).default;
      if (Platform.OS === 'android') {
        await BlobUtil.config({ addAndroidDownloads: { useDownloadManager: true, notification: true, mediaScannable: true, storeInDownloads: true, title: 'rupyaa-credit-report.pdf', description: 'Rupyaa credit report', mime: 'application/pdf' } }).fetch('GET', url, { Accept: 'application/pdf,*/*' });
      } else {
        const path = `${BlobUtil.fs.dirs.DocumentDir}/rupyaa-credit-report.pdf`;
        await BlobUtil.config({ path, overwrite: true }).fetch('GET', url, { Accept: 'application/pdf,*/*' });
        await BlobUtil.ios.openDocument(path);
      }
      setStatus('PDF downloaded successfully.');
    } catch { setStatus(ERROR); } finally { setIsDownloading(false); }
  };
  return { download, isDownloading, status };
}
