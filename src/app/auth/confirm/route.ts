import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the email confirmation callback from Supabase.
 * Supabase appends ?token_hash=...&type=signup to the emailRedirectTo URL.
 * This route verifies the OTP, sets the session cookie, then hands off to
 * /auth/complete which runs client-side and finishes org creation from localStorage.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      // Session is now set via cookie — hand off to the client page that
      // reads localStorage and finishes org creation.
      return NextResponse.redirect(`${origin}/auth/complete`);
    }
  }

  // Something went wrong — send back to login with an error hint
  return NextResponse.redirect(
    `${origin}/login?error=confirmation_failed`
  );
}
