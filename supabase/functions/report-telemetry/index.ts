import { createClient } from "npm:@supabase/supabase-js@2";
import { jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

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

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    if (!token) {
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    let payload: { resident_id?: string; program_id?: string };
    try {
      const { payload: p } = await jwtVerify(
        token,
        new TextEncoder().encode(jwtSecret)
      );
      payload = p as { resident_id?: string; program_id?: string };
    } catch {
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    const residentId = payload.resident_id;
    const programId = payload.program_id;
    if (!residentId || !programId) {
      return jsonResponse({ error: "Invalid or expired token" }, 401);
    }

    const body = await req.json();
    const moduleId =
      typeof body?.module_id === "string" ? body.module_id.trim() : "";
    const action = typeof body?.action === "string" ? body.action.trim() : "";
    const outcome =
      typeof body?.outcome === "string" ? body.outcome.trim() : "";
    const score =
      typeof body?.score === "number" && !Number.isNaN(body.score)
        ? body.score
        : null;

    if (!moduleId || !action || !outcome) {
      return jsonResponse(
        { error: "Missing module_id, action, or outcome" },
        400
      );
    }

    const supabase = createClient(url, serviceRoleKey);
    const { data: inserted, error } = await supabase
      .from("attempts")
      .insert({
        resident_id: residentId,
        program_id: programId,
        module_id: moduleId,
        action,
        outcome,
        score,
      })
      .select("id")
      .single();

    if (error) {
      console.error("attempts insert error:", error);
      return jsonResponse({ error: "Server error. Please try again." }, 500);
    }

    return jsonResponse({ id: inserted.id }, 201);
  } catch (err) {
    console.error("report-telemetry error:", err);
    return jsonResponse({ error: "Server error. Please try again." }, 500);
  }
});
