const PROTECTED_PATH_PATTERNS = [
  /^\/notifications(?:\/|$)/,
  /^\/projects\/create(?:\/|$)/,
  /^\/projects\/[^/]+\/apply(?:\/|$)/,
  /^\/projects\/[^/]+\/manage(?:\/|$)/,
  /^\/profile\/?$/,
  /^\/settings(?:\/|$)/,
];

export function normalizeProtectedPath(path: string) {
  return path.split(/[?#]/, 1)[0] || '/';
}

export function isProtectedPath(path: string) {
  const normalizedPath = normalizeProtectedPath(path);

  return PROTECTED_PATH_PATTERNS.some((pattern) => pattern.test(normalizedPath));
}

export function getLoginPromptCopy(_path?: string) {
  return {
    title: '로그인이 필요한 기능입니다',
  };
}
