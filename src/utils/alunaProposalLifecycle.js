// One generation per context/intent/review. No provider can issue approval permits.
export function createProposalLifecycle() {
  let generation = 0;
  let pending = false;
  const consumed = new Set();
  return {
    snapshot: () => generation,
    replace: () => ++generation,
    isCurrent: (ticket) => ticket === generation,
    canApprove: (ticket) => ticket === generation && !pending && !consumed.has(ticket),
    async execute(ticket, operation) {
      if (ticket !== generation || pending || consumed.has(ticket)) return false;
      // Consume synchronously, before React renders or any network request starts.
      consumed.add(ticket);
      pending = true;
      try { await operation(() => ticket === generation); }
      finally { pending = false; }
      return true;
    },
  };
}
