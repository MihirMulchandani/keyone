# KeyOne v2 Security Model

## Database attacker can get

- sender_id
- receiver_id
- ciphertext
- encrypted_key
- iv
- timestamps

They cannot read plaintext from this data.

## Database attacker cannot get

- plaintext messages
- private keys
- decrypted content

## Network attacker can get

Only encrypted transport and encrypted payloads, equivalent to ciphertext metadata in storage.

## Limitations

- private key loss means permanent message loss
- no forward secrecy per long-term RSA key reuse
- no screenshot prevention
- no protection against full physical compromise of the device
