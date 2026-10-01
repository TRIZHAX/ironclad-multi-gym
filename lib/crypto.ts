import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

function key() {
  const encoded = process.env.QR_ENCRYPTION_KEY;
  if (!encoded) throw new Error("QR_ENCRYPTION_KEY is required");
  const value = Buffer.from(encoded, "base64");
  if (value.length !== 32) throw new Error("QR_ENCRYPTION_KEY must be 32 bytes encoded as base64");
  return value;
}
export function encryptToken(value: string) {
  const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key(), iv); const encrypted = Buffer.concat([cipher.update(value,"utf8"),cipher.final()]); const tag=cipher.getAuthTag();
  return [iv,tag,encrypted].map(x=>x.toString("base64url")).join(".");
}
export function decryptToken(value: string) {
  const [iv,tag,encrypted]=value.split(".").map(x=>Buffer.from(x,"base64url")); const cipher=createDecipheriv("aes-256-gcm",key(),iv);cipher.setAuthTag(tag);return Buffer.concat([cipher.update(encrypted),cipher.final()]).toString("utf8");
}
