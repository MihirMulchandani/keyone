"use client";

import { useQuery } from "@tanstack/react-query";
import { loadPrivateKey, loadPublicKey } from "@/lib/crypto/storage";

export function useKeyPair() {
  return useQuery({
    queryKey: ["keypair"],
    queryFn: async () => {
      const [privateKey, publicJwk] = await Promise.all([
        loadPrivateKey(),
        loadPublicKey(),
      ]);
      return { privateKey, publicJwk };
    },
  });
}
