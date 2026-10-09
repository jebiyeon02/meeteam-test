export const PROJECT_CARD_FALLBACK_IMAGE_SRC = '/brand/meeteam_character_fallback.png';
export const PROJECT_DETAIL_FALLBACK_IMAGE_SRC = '/brand/project_fallback.png';

export function getProjectImageSrc(src?: string | null) {
  return src?.trim() || PROJECT_CARD_FALLBACK_IMAGE_SRC;
}

export function getProjectDetailImageSrc(src?: string | null) {
  return src?.trim() || PROJECT_DETAIL_FALLBACK_IMAGE_SRC;
}
