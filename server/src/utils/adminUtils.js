export const normalizeEmergencyStatus = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  switch (normalized) {
    case 'pending':
    case 'active':
    case 'fulfilled':
    case 'cancelled':
      return normalized;
    default:
      return null;
  }
};
