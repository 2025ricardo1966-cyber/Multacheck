import {
  findTenantByIdPersisted,
  findTenantBySlugPersisted,
  updateTenantSettingsPersisted,
} from "./tenant.persistence.js";

export function slugify(input) {
  const raw = String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return raw.slice(0, 48) || "empresa";
}

export async function findTenantBySlug(slug) {
  return findTenantBySlugPersisted(slug);
}

export async function ensureUniqueSlug(baseSlug) {
  let slug = slugify(baseSlug);
  let n = 0;
  while (await findTenantBySlugPersisted(slug)) {
    n += 1;
    slug = `${slugify(baseSlug)}-${n}`;
  }
  return slug;
}

export async function updateTenantSettings(tenantId, patch) {
  const t = await findTenantByIdPersisted(tenantId);
  if (!t) throw new Error("Tenant no encontrado");
  const current =
    typeof t.settings === "object" && t.settings !== null ? t.settings : {};
  const next = {
    ...current,
    ...patch,
    featureFlags: {
      ...(current.featureFlags || {}),
      ...(patch.featureFlags || {}),
    },
    experiments: {
      ...(current.experiments || {}),
      ...(patch.experiments || {}),
    },
    onboarding: {
      ...(current.onboarding || {}),
      ...(patch.onboarding || {}),
    },
  };

  return updateTenantSettingsPersisted(tenantId, next);
}
