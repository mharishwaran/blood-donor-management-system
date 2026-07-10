const normalizeEmail = (value = '') => value.toString().trim().toLowerCase();

export const isAdminEmail = (email = '', configuredEmail = '') => {
  const normalizedEmail = normalizeEmail(email);
  const normalizedConfiguredEmail = normalizeEmail(configuredEmail);
  return Boolean(normalizedEmail && normalizedConfiguredEmail && normalizedEmail === normalizedConfiguredEmail);
};

export const getJwtSecret = () => process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || '';
