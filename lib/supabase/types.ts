export type DeleteMode = "view_once" | "timed" | "hybrid" | "persistent";

export type UserRow = {
  id: string;
  username: string;
  public_key: string;
  is_searchable: boolean;
  created_at: string;
  updated_at: string;
  username_changed_at: string | null;
};

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  ciphertext: string;
  encrypted_key: string;
  iv: string;
  delete_mode: DeleteMode;
  expires_at: string;
  is_opened: boolean;
  opened_at: string | null;
  created_at: string;
};
