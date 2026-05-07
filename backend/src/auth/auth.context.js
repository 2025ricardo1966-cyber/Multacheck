/**
 * @typedef {Object} AuthContext
 * @property {string} userId
 * @property {string} tenantId
 * @property {"jwt"} authType
 */

/**
 * Valida contrato mínimo de autenticación desacoplado de Express.
 * @param {AuthContext} authContext
 * @returns {AuthContext}
 */
export function assertAuthContext(authContext) {
  const userId =
    typeof authContext?.userId === "string" ? authContext.userId.trim() : "";
  const tenantId =
    typeof authContext?.tenantId === "string"
      ? authContext.tenantId.trim()
      : "";
  const authType = authContext?.authType;

  if (!userId || !tenantId || authType !== "jwt") {
    throw new Error("Missing authenticated user context");
  }

  return { userId, tenantId, authType: "jwt" };
}
