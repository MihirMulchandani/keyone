CREATE TYPE delete_mode AS ENUM ('view_once', 'timed', 'hybrid', 'persistent');
CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'rejected');

CREATE TABLE users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username             TEXT UNIQUE NOT NULL,
  public_key           TEXT NOT NULL,
  is_searchable        BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  username_changed_at  TIMESTAMPTZ,
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

CREATE TABLE friends (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        friend_status DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK(requester_id != addressee_id)
);

CREATE TABLE messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ciphertext     TEXT NOT NULL,
  encrypted_key  TEXT NOT NULL,
  iv             TEXT NOT NULL,
  delete_mode    delete_mode NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL,
  is_opened      BOOLEAN DEFAULT false,
  opened_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rate_limits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT now(),
  count         INTEGER DEFAULT 1
);

CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_expires_at  ON messages(expires_at);
CREATE INDEX idx_friends_requester    ON friends(requester_id);
CREATE INDEX idx_friends_addressee    ON friends(addressee_id);
CREATE INDEX idx_rate_limits_lookup   ON rate_limits(user_id, action, window_start);
CREATE INDEX idx_users_username       ON users(username);

ALTER TABLE users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends     ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages    ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select" ON users FOR SELECT
  USING (id = auth.uid() OR is_searchable = true);

CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update" ON users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "friends_select" ON friends FOR SELECT
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "friends_insert" ON friends FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "friends_update" ON friends FOR UPDATE
  USING (addressee_id = auth.uid());

CREATE POLICY "friends_delete" ON friends FOR DELETE
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());

CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (receiver_id = auth.uid());

CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM friends
      WHERE status = 'accepted'
      AND (
        (requester_id = auth.uid() AND addressee_id = messages.receiver_id)
        OR
        (addressee_id = auth.uid() AND requester_id = messages.receiver_id)
      )
    )
  );

CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (receiver_id = auth.uid());

CREATE POLICY "messages_delete" ON messages FOR DELETE
  USING (receiver_id = auth.uid() OR sender_id = auth.uid());

CREATE POLICY "rate_limits_select" ON rate_limits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "rate_limits_insert" ON rate_limits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "rate_limits_update" ON rate_limits FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  event      TEXT NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (user_id = auth.uid());
