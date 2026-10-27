/* Experimental HTTPS command transport. No automatic activation or production storage. */
(function (root) {
  "use strict";
  function createServiceTransport(config) {
    config = config || {};
    if (config.enabled !== true) throw new Error("Experimental service disabled");
    if (typeof config.fetchImpl !== "function" || typeof config.credentials !== "function") throw new Error("Explicit fetch and credentials providers required");
    const endpoint = new URL(config.endpoint);
    if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || !endpoint.pathname.endsWith("/gm-review")) throw new Error("Dedicated HTTPS GM endpoint required");
    const allowedOrigin = config.allowedOrigin;
    if (!allowedOrigin || new URL(allowedOrigin).origin !== allowedOrigin) throw new Error("Exact allowed origin required");
    // The service must validate Origin and CSRF itself; browser-supplied values are not authorization.
    if (config.currentOrigin !== allowedOrigin) throw new Error("Experimental browser origin mismatch");
    return async function transport(command) {
      const credential = await config.credentials();
      if (!credential || typeof credential.csrf !== "string" || !credential.csrf || typeof credential.bearer !== "string" || !credential.bearer) throw new Error("Session and CSRF credentials required");
      const response = await config.fetchImpl(endpoint.href, {
        method: "POST", mode: "cors", credentials: "omit", cache: "no-store", redirect: "error",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + credential.bearer, "X-CSRF-Token": credential.csrf },
        body: JSON.stringify(command)
      });
      if (!response.ok) throw new Error("Experimental GM service rejected request");
      const result = await response.json();
      if (!result || typeof result !== "object" || typeof result.committed !== "boolean") throw new Error("Invalid GM service response");
      return result;
    };
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { createServiceTransport };
  else root.HLMExperimentalGMServiceTransport = Object.freeze({ createServiceTransport });
})(typeof globalThis !== "undefined" ? globalThis : this);
