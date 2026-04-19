export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const publicJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicJwk: JSON.stringify(publicJwk),
    privateJwk,
  };
}

export async function downloadPrivateKeyBackup(privateKey: CryptoKey) {
  const warning =
    "Anyone with this file can read all your messages. Store it offline. Do not share it.";
  if (!window.confirm(warning)) {
    return;
  }

  const privateJwk = await window.crypto.subtle.exportKey("jwk", privateKey);
  const blob = new Blob([JSON.stringify(privateJwk)], { type: "application/json" });
  const date = new Date().toISOString().slice(0, 10);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `keyone-backup-${date}.keyone`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importPrivateKeyFromText(text: string): Promise<CryptoKey> {
  const parsed = JSON.parse(text) as JsonWebKey;
  return window.crypto.subtle.importKey(
    "jwk",
    parsed,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"],
  );
}
