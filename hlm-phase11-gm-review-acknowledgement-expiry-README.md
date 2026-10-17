# Mission 1187: GM evidence acknowledgement expiry

Adds deterministic expiry checks to explicit, read-only evidence acknowledgements. The caller supplies integer millisecond timestamps; no implicit wall-clock access. The default maximum age is 24 hours and the accepted range is up to 7 days. Stale, future-dated, invalid-clock and unacknowledged evidence fails closed.

Acknowledgement is not GM approval. Experimental only: no production activation, save writes or gameplay authorization.
