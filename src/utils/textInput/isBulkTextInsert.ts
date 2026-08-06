/**
 * Detects whether a TextInput change represents a bulk insert (paste / autofill)
 * rather than a normal single-character keystroke.
 *
 * RN does not expose paste events directly; comparing previous and next values
 * lets us reject changes that add more than one character at once. This is a
 * pragmatic guard for "reconfirm" style fields where pasting defeats the purpose.
 */
export function isBulkTextInsert(previousValue: string, nextValue: string): boolean {
  return nextValue.length - previousValue.length > 1;
}
