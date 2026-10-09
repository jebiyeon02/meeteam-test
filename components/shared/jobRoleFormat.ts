export function formatJobRole(field?: string | null, position?: string | null) {
  const fieldLabel = field?.trim() ?? '';
  const positionLabel = position?.trim() ?? '';

  if (fieldLabel && positionLabel) {
    return `${fieldLabel}(${positionLabel})`;
  }

  return fieldLabel || positionLabel || '-';
}
