import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

export function generatePermitHolderPassword() {
  const bytes = randomBytes(8);
  return Array.from(bytes, (byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length]).join("");
}

export async function hashPermitHolderPassword(password: string) {
  if (password.length < 4) throw new Error("Password must be at least 4 characters");
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPermitHolderPassword(password: string, hash: string) {
  const [, salt, stored] = hash.split("$");
  if (!salt || !stored) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const storedBuffer = Buffer.from(stored, "hex");
  return storedBuffer.length === derived.length && timingSafeEqual(storedBuffer, derived);
}
