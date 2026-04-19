import { loadPrivateKey } from "./storage";

export class DecryptionError extends Error {
  constructor() {
    super("Unable to decrypt message");
    this.name = "DecryptionError";
  }
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function decryptMessage(input: {
  encrypted_key: string;
  ciphertext: string;
  iv: string;
}) {
  try {
    const privateKey = await loadPrivateKey();
    if (!privateKey) {
      throw new DecryptionError();
    }

    const rawAesKey = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      fromBase64(input.encrypted_key),
    );
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      rawAesKey,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );

    const plaintextBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(fromBase64(input.iv)) },
      aesKey,
      fromBase64(input.ciphertext),
    );

    return new TextDecoder().decode(plaintextBuffer);
  } catch {
    throw new DecryptionError();
  }
}
