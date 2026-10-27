/* Block L experimental browser command boundary. No network or storage unless explicitly enabled. */
(function (root) {
  "use strict";
  function createGMReviewAdapter(options) {
    options = options || {};
    const enabled = options.enabled === true;
    const transport = options.transport;
    const identity = options.identity;
    if (enabled && (typeof transport !== "function" || typeof identity !== "function")) {
      throw new Error("Experimental transport and authenticated identity provider required");
    }
    let pending = false;
    async function invoke(action, request) {
      if (!enabled) throw new Error("Experimental GM review integration disabled");
      if (!["review", "recover", "approve", "decline"].includes(action)) throw new Error("Invalid GM action");
      if (pending) throw new Error("GM decision already in progress");
      if (!request || typeof request !== "object" || Array.isArray(request)) throw new Error("Invalid request");
      pending = true;
      try {
      const session = await identity();
      if (!session || session.authenticated !== true || !session.gm) throw new Error("Authenticated GM required");
      if (!request.franchise || !Number.isSafeInteger(request.revision) || request.revision < 0) throw new Error("Franchise revision required");
      if ((action === "approve" || action === "decline" || action === "recover") && !request.review_id) throw new Error("Review ID required");
      if (action === "approve" && !request.decision_id) throw new Error("Decision ID required");
        // Transport must enforce authorization, CSRF/origin policy, atomicity, and replay protection server-side.
        return await transport(Object.freeze({ ...request, action, gm: session.gm }));
      } finally { pending = false; }
    }
    return Object.freeze({
      enabled,
      review: request => invoke("review", request),
      recover: request => invoke("recover", request),
      approve: request => invoke("approve", request),
      decline: request => invoke("decline", request)
    });
  }
  if (typeof module !== "undefined" && module.exports) module.exports = { createGMReviewAdapter };
  else root.HLMExperimentalGMReviewAdapter = Object.freeze({ createGMReviewAdapter });
})(typeof globalThis !== "undefined" ? globalThis : this);
