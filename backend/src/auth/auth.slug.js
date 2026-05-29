/**
 * Slug de tenant: sanitización y generación desde nombre de empresa.
 */

export function slugFromCompanyName(companyName) {
  const slug = String(companyName ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

export function sanitizeTenantSlug(raw) {
  const slug = String(raw ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug;
}

/**
 * @param {string} companyName
 * @param {string} [companySlug]
 * @returns {string}
 */
export function resolveTenantSlug(companyName, companySlug) {
  const explicit = companySlug?.trim() ? sanitizeTenantSlug(companySlug) : "";
  if (explicit) return explicit;
  return slugFromCompanyName(companyName);
}
