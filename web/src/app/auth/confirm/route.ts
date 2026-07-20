import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/env";

// Email-confirmation callback (#74). When email confirmations are ON (prod),
// the link Supabase mails carries a token_hash; verify it, set the session
// cookie, and bounce home. (Locally confirmations are off, so updateUser
// applies immediately and this route isn't hit — but prod needs it.)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/rooms";

  const redirect = NextResponse.redirect(new URL(next, url.origin));
  if (!token_hash || !type) return redirect;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(list) {
        list.forEach(({ name, value, options }) =>
          redirect.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.verifyOtp({
    type: type as "email" | "email_change",
    token_hash,
  });
  return redirect;
}
