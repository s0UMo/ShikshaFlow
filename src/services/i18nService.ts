export type LanguageCode =
  | 'en' | 'hi' | 'bn' | 'ml' | 'ta' | 'te' | 'mr' | 'gu' | 'kn' | 'pa' | 'or' | 'as' | 'ur';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  native: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English',   native: 'English (EN)' },
  { code: 'hi', name: 'Hindi',     native: 'हिंदी (HI)' },
  { code: 'bn', name: 'Bengali',   native: 'বাংলা (BN)' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം (ML)' },
  { code: 'ta', name: 'Tamil',     native: 'தமிழ் (TA)' },
  { code: 'te', name: 'Telugu',    native: 'తెలుగు (TE)' },
  { code: 'mr', name: 'Marathi',   native: 'मराठी (MR)' },
  { code: 'gu', name: 'Gujarati',  native: 'ગુજરાતી (GU)' },
  { code: 'kn', name: 'Kannada',   native: 'ಕನ್ನಡ (KN)' },
  { code: 'pa', name: 'Punjabi',   native: 'ਪੰਜਾਬੀ (PA)' },
  { code: 'or', name: 'Odia',      native: 'ଓଡ଼ିଆ (OR)' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া (AS)' },
  { code: 'ur', name: 'Urdu',      native: 'اردو (UR)' },
];

export function getSelectedLanguage(): LanguageCode {
  try {
    return (localStorage.getItem('shiksha_lang') as LanguageCode) || 'en';
  } catch {
    return 'en';
  }
}

export function setSelectedLanguage(lang: LanguageCode): void {
  try {
    localStorage.setItem('shiksha_lang', lang);
    window.dispatchEvent(new Event('shiksha_lang_changed'));
  } catch (e) {
    console.error('Error setting language:', e);
  }
}
