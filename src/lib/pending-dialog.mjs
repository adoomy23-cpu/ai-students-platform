// Reject stale dialog events and cancel operations when authority changes.
export function cancelDialogScope(holder, scopeKey) {
  const pending = holder.current;
  if (!pending || pending.scopeKey === scopeKey) return false;
  holder.current = null;
  pending.resolve(null);
  return true;
}
export function settleDialog(holder, id, scopeKey, value) {
  const pending = holder.current;
  if (!pending || pending.id !== id || pending.scopeKey !== scopeKey) return false;
  holder.current = null;
  pending.resolve(value);
  return true;
}
