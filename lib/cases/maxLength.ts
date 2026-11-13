/**
 * Field limits of the backend's `cases` models (`cases/models.py`). Django's `URLField` and
 * `EmailField` default to 200 and 254 characters.
 */
export const CASES_MAX_LENGTH = {
  organizationName: 100,
  region: 50,
  providerName: 100,
  website: 200,
  email: 254,
  phone: 20,
} as const;
