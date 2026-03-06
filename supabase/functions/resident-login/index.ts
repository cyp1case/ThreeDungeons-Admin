import { createClient } from "npm:@supabase/supabase-js@2";
import { compare } from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { SignJWT } from "https://deno.land/x/jose@v5.2.0/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const jwtSecret = Deno.env.get("JWT_SECRET");
    if (!url || !serviceRoleKey || !jwtSecret) {
      return jsonResponse({ error: "Server error. Please try again." }, 500);
    }

    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return jsonResponse({ error: "Invalid email or password" }, 401);
    }

    const supabase = createClient(url, serviceRoleKey);
    const { data: rows, error } = await supabase
      .from("residents")
      .select("id, program_id, password_hash, active")
      .eq("email", email);

    if (error) {
      console.error("residents query error:", error);
      return jsonResponse({ error: "Server error. Please try again." }, 500);
    }

    if (!rows || rows.length === 0) {
      return jsonResponse({ error: "Invalid email or password" }, 401);
    }

    const hasDeactivated = rows.some((r) => r.active === false);
    if (hasDeactivated) {
      return jsonResponse(
        { error: "Account is deactivated. Contact your program leader." },
        403
      );
    }

    if (rows.length > 1) {
      return jsonResponse(
        { error: "Multiple accounts found. Contact your program leader." },
        409
      );
    }

    const row = rows[0];
    const match = await compare(password, row.password_hash);
    if (!match) {
      return jsonResponse({ error: "Invalid email or password" }, 401);
    }

    const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    const token = await new SignJWT({
      resident_id: row.id,
      program_id: row.program_id,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(exp)
      .sign(new TextEncoder().encode(jwtSecret));

    return jsonResponse(
      {
        token,
        residentId: row.id,
        programId: row.program_id,
      },
      200
    );
  } catch (err) {
    console.error("resident-login error:", err);
    return jsonResponse({ error: "Server error. Please try again." }, 500);
  }
});
