'use strict';
if (typeof module === 'object' && module.exports) module.exports = (function () {
  const DISABLED = 'disabled-by-default';
  const UNAVAILABLE = 'trusted-server-authority-unavailable';

  function createEntry({enabled = false, provider, onChange = () => {}} = {}) {
    if (enabled !== false && enabled !== true) throw new TypeError('Invalid experimental feature flag');
    if (typeof onChange !== 'function') throw new TypeError('Entry state callback required');

    let coordinator = null;
    let pending = false;
    let busy = false;
    let generation = 0;
    let state = Object.freeze({
      code: enabled ? (providerReady() ? 'ready' : UNAVAILABLE) : DISABLED,
      pending: false,
      busy: false,
      saved: false
    });

    function publish(next) {
      state = Object.freeze({...next, pending, busy});
      onChange(state);
      return state;
    }

    function blocked(code) {
      pending = false;
      coordinator = null;
      return publish({code, saved: false});
    }

    function providerReady() {
      return enabled &&
        provider &&
        typeof provider.createCoordinator === 'function' &&
        typeof provider.getReviewRequest === 'function';
    }

    async function review() {
      if (!enabled) return blocked(DISABLED);
      if (busy) return state;
      if (!providerReady()) return blocked(UNAVAILABLE);
      const operation = ++generation;
      busy = true;
      publish({code: 'review-in-progress', saved: false});
      try {
        coordinator = await provider.createCoordinator();
        if (operation !== generation) return state;
        if (!coordinator || coordinator.enabled !== true ||
            typeof coordinator.review !== 'function' ||
            typeof coordinator.decide !== 'function') {
          return blocked(UNAVAILABLE);
        }
        const request = await provider.getReviewRequest();
        if (operation !== generation) return state;
        if (!request || typeof request.proposalId !== 'string' ||
            !request.proposalId || !request.proposal ||
            typeof request.proposal !== 'object' || Array.isArray(request.proposal)) {
          return blocked('authoritative-review-request-unavailable');
        }
        const result = await coordinator.review(request.proposalId, request.proposal);
        if (operation !== generation) return state;
        if (result?.status === 'awaiting-human-gm-approval' &&
            result.saved === false && result.settlementAuthorized === false) {
          pending = true;
          return publish({code: result.status, saved: false});
        }
        if (result?.status === 'isolated-trade-candidate-committed' &&
            result.saved === true && result.settlementAuthorized === false &&
            result.atomicSettlementVerified === false) {
          pending = false;
          return publish({
            code: result.replayed ? 'completed-trade-recovered' : 'trade-already-completed',
            saved: true,
            replayed: result.replayed === true
          });
        }
        return blocked(result?.code || 'review-blocked');
      } catch {
        if (operation !== generation) return state;
        return blocked('trusted-authority-request-failed');
      } finally {
        if (operation === generation) {
          busy = false;
          state = Object.freeze({...state, busy: false});
          onChange(state);
        }
      }
    }

    async function decide(action) {
      if (!['approve', 'decline', 'cancel'].includes(action)) {
        throw new TypeError('Explicit human GM decision required');
      }
      if (!enabled) return blocked(DISABLED);
      if (!pending || !coordinator) return blocked('review-required');
      if (busy) return state;
      const operation = ++generation;
      busy = true;
      publish({code: 'decision-in-progress', saved: false});
      try {
        const result = await coordinator.decide(action);
        if (operation !== generation) return state;
        if (action === 'approve' &&
            result?.status === 'isolated-trade-candidate-committed' &&
            result.saved === true && result.settlementAuthorized === false &&
            result.atomicSettlementVerified === false) {
          pending = false;
          return publish({
            code: result.replayed ? 'completed-trade-recovered' : 'trade-settled-isolated',
            saved: true,
            replayed: result.replayed === true
          });
        }
        if (action !== 'approve' && result?.saved === false &&
            result?.settlementAuthorized === false) {
          pending = false;
          coordinator = null;
          return publish({code: action, saved: false});
        }
        return blocked(result?.code || 'decision-blocked');
      } catch {
        if (operation !== generation) return state;
        return blocked('human-decision-failed');
      } finally {
        if (operation === generation) {
          busy = false;
          state = Object.freeze({...state, busy: false});
          onChange(state);
        }
      }
    }

    function reload() {
      generation += 1;
      busy = false;
      pending = false;
      coordinator = null;
      return publish({
        code: enabled ? (providerReady() ? 'ready' : UNAVAILABLE) : DISABLED,
        saved: false
      });
    }

    function getState() {
      return state;
    }

    return Object.freeze({enabled, review, decide, reload, getState});
  }

  function mount(root, options = {}) {
    if (!root || typeof root.querySelector !== 'function') {
      throw new TypeError('Experimental CPU trade entry root required');
    }
    const status = root.querySelector('[data-trade-status]');
    const reviewButton = root.querySelector('[data-trade-review]');
    const decisionButtons = Array.from(root.querySelectorAll('[data-trade-decision]'));
    const clearButton = root.querySelector('[data-trade-clear]');
    if (!status || !reviewButton || !decisionButtons.length || !clearButton) {
      throw new TypeError('Experimental CPU trade entry controls are incomplete');
    }

    const labels = {
      [DISABLED]: 'Experimental CPU trading is OFF. No authority was contacted and no action was taken.',
      [UNAVAILABLE]: 'Trusted server authority unavailable. No action was taken.',
      ready: 'Experimental adapter configured. Consent is not verified until authoritative review succeeds.',
      'trusted-authority-request-failed': 'Trusted authority request failed. No action was taken.',
      'human-decision-failed': 'GM decision could not be completed. Verify isolated status before retrying.',
      'authoritative-review-request-unavailable': 'No authoritative proposal is available. No action was taken.',
      'awaiting-human-gm-approval': 'CPU consent verified. Explicit human GM approval is required; nothing is saved yet.',
      'trade-settled-isolated': 'Trade completed in isolated experimental storage only.',
      'completed-trade-recovered': 'Previously completed isolated trade and receipt recovered.',
      'trade-already-completed': 'This isolated trade is already completed.',
      approve: 'Trade approval did not settle. No success reported.',
      decline: 'Declined. No save or settlement.',
      cancel: 'Cancelled. No save or settlement.',
      'review-in-progress': 'Checking trusted authority and isolated proposal…',
      'decision-in-progress': 'Applying your explicit GM decision…'
    };

    function render(state) {
      status.textContent = labels[state.code] || `Experimental trade blocked: ${state.code}. No action taken.`;
      status.dataset.code = state.code;
      reviewButton.disabled = !entry.enabled || state.pending || state.busy ||
        (!options.provider || typeof options.provider.createCoordinator !== 'function' ||
          typeof options.provider.getReviewRequest !== 'function');
      for (const button of decisionButtons) {
        button.disabled = !state.pending || state.busy;
      }
      clearButton.disabled = state.busy;
    }

    const entry = createEntry({...options, onChange: render});
    reviewButton.addEventListener('click', () => { entry.review(); });
    for (const button of decisionButtons) {
      button.addEventListener('click', () => { entry.decide(button.dataset.tradeDecision); });
    }
    clearButton.addEventListener('click', () => { entry.reload(); });
    render(entry.getState());
    return entry;
  }

  return Object.freeze({createEntry, mount});
})();
