# KeyOne v2 Architecture

SEND FLOW
---------
[browser] -> generate AES key -> encrypt message -> encrypt AES key with receiver's public RSA key
         -> send {ciphertext, encrypted_key, iv} to Supabase -> stored encrypted

RECEIVE FLOW
------------
[browser] -> fetch message (still encrypted) -> decrypt AES key with private RSA key
          -> decrypt ciphertext with AES key -> display plaintext -> apply destruction rules

KEY STORAGE
-----------
Public key  -> Supabase users table (visible to friends)
Private key -> Browser IndexedDB only (never transmitted)
