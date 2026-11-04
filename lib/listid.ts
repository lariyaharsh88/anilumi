import { createHash } from "node:crypto";

/**
 * Database id of a synced list: a SHA-256 of its code, so the database alone can't open anyone's list.
 * Server-only (app/api/sync, app/api/lead); the code itself never leaves the visitor's devices otherwise.
 */
export const listIdOf = (code: string) => createHash("sha256").update(`anilumi-sync:${code}`).digest("hex");
