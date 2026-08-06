import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LANGUAGE, resolveDeviceLanguage } from '@/src/config/languages';
import hiCommon from './locales/hi/common.json';
import hiAuth from './locales/hi/auth.json';
import hiHome from './locales/hi/home.json';
import hiLoanJourney from './locales/hi/loanJourney.json';
import hiDocuments from './locales/hi/documents.json';
import hiSupport from './locales/hi/support.json';
import hiProducts from './locales/hi/products.json';
import hiPayment from './locales/hi/payment.json';
import hiProfile from './locales/hi/profile.json';
import hiOnboarding from './locales/hi/onboarding.json';
import hiPermissions from './locales/hi/permissions.json';

// Split into one file per screen/domain for reviewability as the dictionary grows; all of
// them merge into a single flat resource bundle, so the t() lookup convention is unaffected.
const hi = {
  ...hiCommon,
  ...hiAuth,
  ...hiHome,
  ...hiLoanJourney,
  ...hiDocuments,
  ...hiSupport,
  ...hiProducts,
  ...hiPayment,
  ...hiProfile,
  ...hiOnboarding,
  ...hiPermissions,
};

// English needs no resource bundle: every t() call uses the English copy itself as the
// key, so an untranslated/missing key falls back to readable English automatically.
i18n.use(initReactI18next).init({
  resources: {
    hi: { translation: hi },
  },
  lng: resolveDeviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
