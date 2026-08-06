import { useEffect, useState } from 'react';
import {
  getDevToggleState,
  loadDevToggleStateFromStorage,
  setStagingApiOverrideToggle,
  setUseAmanNgrokApiBaseUrlToggle,
  setUseBankStatementUploaderToggle,
  setUseNgrokApiBaseUrlToggle,
} from '@/src/services/devToggles/devTogglesService';
import { STAGING_API_OVERRIDE } from '@/src/services/devToggles/apiBaseUrlResolver';

export const useDeveloperSettingsToggles = () => {
  const [useNgrokApiBaseUrl, setUseNgrokApiBaseUrl] = useState(
    () => getDevToggleState().useNgrokApiBaseUrl,
  );
  const [useAmanNgrokApiBaseUrl, setUseAmanNgrokApiBaseUrl] = useState(
    () => getDevToggleState().useAmanNgrokApiBaseUrl,
  );
  const [useBankStatementUploader, setUseBankStatementUploader] = useState(
    () => getDevToggleState().useBankStatementUploader,
  );
  const [stagingApiOverride, setStagingApiOverride] = useState(
    () => getDevToggleState().stagingApiOverride,
  );

  useEffect(() => {
    let isMounted = true;

    const loadDevToggles = async () => {
      const state = await loadDevToggleStateFromStorage();
      if (!isMounted) {
        return;
      }
      setUseNgrokApiBaseUrl(state.useNgrokApiBaseUrl);
      setUseAmanNgrokApiBaseUrl(state.useAmanNgrokApiBaseUrl);
      setUseBankStatementUploader(state.useBankStatementUploader);
      setStagingApiOverride(state.stagingApiOverride);
    };

    void loadDevToggles();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearStagingOverride = () => {
    setStagingApiOverride(STAGING_API_OVERRIDE.none);
    void setStagingApiOverrideToggle(STAGING_API_OVERRIDE.none);
  };

  const clearNgrokToggles = () => {
    setUseNgrokApiBaseUrl(false);
    setUseAmanNgrokApiBaseUrl(false);
    void setUseNgrokApiBaseUrlToggle(false);
    void setUseAmanNgrokApiBaseUrlToggle(false);
  };

  const handleToggleNgrokBaseUrl = (value: boolean) => {
    // Only one API base URL source can stay active at a time.
    if (value) {
      setUseAmanNgrokApiBaseUrl(false);
      void setUseAmanNgrokApiBaseUrlToggle(false);
      clearStagingOverride();
    }
    setUseNgrokApiBaseUrl(value);
    void setUseNgrokApiBaseUrlToggle(value);
  };

  const handleToggleAmanNgrokBaseUrl = (value: boolean) => {
    if (value) {
      setUseNgrokApiBaseUrl(false);
      void setUseNgrokApiBaseUrlToggle(false);
      clearStagingOverride();
    }
    setUseAmanNgrokApiBaseUrl(value);
    void setUseAmanNgrokApiBaseUrlToggle(value);
  };

  const handleToggleBankStatementUploader = (value: boolean) => {
    setUseBankStatementUploader(value);
    void setUseBankStatementUploaderToggle(value);
  };

  const handleToggleStaging2ApiBaseUrl = (value: boolean) => {
    const nextValue = value ? STAGING_API_OVERRIDE.staging2 : STAGING_API_OVERRIDE.none;
    if (value) {
      clearNgrokToggles();
    }
    setStagingApiOverride(nextValue);
    void setStagingApiOverrideToggle(nextValue);
  };

  const handleToggleStagingApiV1BaseUrl = (value: boolean) => {
    const nextValue = value ? STAGING_API_OVERRIDE.staging : STAGING_API_OVERRIDE.none;
    if (value) {
      clearNgrokToggles();
    }
    setStagingApiOverride(nextValue);
    void setStagingApiOverrideToggle(nextValue);
  };

  return {
    useNgrokApiBaseUrl,
    useAmanNgrokApiBaseUrl,
    useBankStatementUploader,
    stagingApiOverride,
    handleToggleNgrokBaseUrl,
    handleToggleAmanNgrokBaseUrl,
    handleToggleBankStatementUploader,
    handleToggleStaging2ApiBaseUrl,
    handleToggleStagingApiV1BaseUrl,
  };
};
