/** Deeply reactive props object for components mounted from plain .ts files. */
export function reactive<T extends object>(initial: T): T {
  const s = $state(initial);
  return s;
}
