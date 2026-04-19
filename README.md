# KeyOne v2

end-to-end encrypted ephemeral messaging.

## how it works

Client encrypts -> Server stores ciphertext -> Client decrypts
The server never sees your messages.

## features

- end-to-end encryption (AES-GCM + RSA-OAEP)
- zero-trust backend - server stores only ciphertext
- four message destruction modes
- friend-only messaging
- key export and import
- no message previews on server

## tech stack

Next.js 14 · Supabase · Web Crypto API · Framer Motion · TypeScript

## setup

See /itd/ for complete deployment instructions.

## security model

Your private key is generated in your browser and never transmitted.
Losing your private key means losing access to all encrypted messages.
See SECURITY.md for the full threat model.

## demo

[add your Vercel URL here]
