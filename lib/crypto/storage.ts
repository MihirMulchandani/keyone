import { openDB } from "idb";

const DB_NAME = "keyone-db";
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "keyone_private_key_v2";
const PUBLIC_KEY_ID = "keyone_public_key_v2";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveKeyPair(privateKey: CryptoKey, publicJwk: string) {
  const db = await getDb();
  await db.put(STORE_NAME, privateKey, PRIVATE_KEY_ID);
  await db.put(STORE_NAME, publicJwk, PUBLIC_KEY_ID);
}

export async function loadPrivateKey() {
  const db = await getDb();
  return (await db.get(STORE_NAME, PRIVATE_KEY_ID)) as CryptoKey | undefined;
}

export async function loadPublicKey() {
  const db = await getDb();
  return (await db.get(STORE_NAME, PUBLIC_KEY_ID)) as string | undefined;
}

export async function clearKeys() {
  const db = await getDb();
  await db.delete(STORE_NAME, PRIVATE_KEY_ID);
  await db.delete(STORE_NAME, PUBLIC_KEY_ID);
}
