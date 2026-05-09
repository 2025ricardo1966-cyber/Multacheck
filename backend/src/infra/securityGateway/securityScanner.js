/**
 * Escaneo recursivo de JSON ya parseado (post express.json + mongo-sanitize).
 *
 * @typedef {{ maxJsonDepth: number, maxStringLength: number, maxObjectKeysPerLevel: number, stringPatterns: { id: string, pattern: RegExp }[], routeAllowlistPrefixes: string[] }} GatewayRules
 */

/**
 * @param {unknown} value
 * @param {GatewayRules} rules
 * @param {string[]} flagsOut
 * @param {number} [depth]
 * @param {WeakSet<object>} [visited]
 */
export function scanJsonBody(value, rules, flagsOut, depth = 0, visited = new WeakSet()) {
  if (depth > rules.maxJsonDepth) {
    flagsOut.push("json_depth_exceeded");
    return;
  }

  if (typeof value === "string") {
    if (value.length > rules.maxStringLength) {
      flagsOut.push("string_length_exceeded");
      return;
    }
    for (const { id, pattern } of rules.stringPatterns) {
      try {
        if (pattern.test(value)) {
          flagsOut.push(`pattern:${id}`);
        }
      } catch {
        /* regex runtime edge — ignorar */
      }
    }
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  if (visited.has(value)) {
    flagsOut.push("circular_structure");
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    if (value.length > rules.maxObjectKeysPerLevel) {
      flagsOut.push("array_length_exceeded");
    }
    for (let i = 0; i < value.length; i++) {
      scanJsonBody(value[i], rules, flagsOut, depth + 1, visited);
    }
    return;
  }

  const keys = Object.keys(value);
  if (keys.length > rules.maxObjectKeysPerLevel) {
    flagsOut.push("object_keys_exceeded");
    return;
  }

  for (const k of keys) {
    scanJsonBody(value[k], rules, flagsOut, depth + 1, visited);
  }
}
