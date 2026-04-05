export function ensureSkuIsUnique(conflicts: any[]) {
  if (conflicts.length > 0) {
    const err = new Error("SKU already exists");
    (err as any).statusCode = 409;
    throw err;
  }
}
