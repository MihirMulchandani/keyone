import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { error } = await supabase
    .from("messages")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) {
    return new Response("cleanup failed", { status: 500 });
  }
  return new Response("ok");
});
