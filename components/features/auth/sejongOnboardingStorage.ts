export const SEJONG_ONBOARDING_CODE_STORAGE_KEY = 'meeteam-sejong-onboarding-code';

function canUseSessionStorage() {
  return typeof window !== 'undefined';
}

export function saveSejongOnboardingCode(code: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(SEJONG_ONBOARDING_CODE_STORAGE_KEY, code);
}

export function readSejongOnboardingCode() {
  if (!canUseSessionStorage()) {
    return '';
  }

  return window.sessionStorage.getItem(SEJONG_ONBOARDING_CODE_STORAGE_KEY) ?? '';
}

export function clearSejongOnboardingCode() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(SEJONG_ONBOARDING_CODE_STORAGE_KEY);
}
