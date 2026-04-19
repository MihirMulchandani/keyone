function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export async function encryptMessage(plaintext: string, receiverPublicKeyJwkString: string) {
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(plaintext);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    data,
  );

  const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
  const receiverPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(receiverPublicKeyJwkString) as JsonWebKey,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"],
  );

  const encryptedKey = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    receiverPublicKey,
    rawAesKey,
  );

  return {
    ciphertext: toBase64(ciphertext),
    encrypted_key: toBase64(encryptedKey),
    iv: toBase64(iv.buffer),
  };
}
