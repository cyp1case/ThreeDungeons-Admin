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

function getAuthPayload(req: Request): Promise<{ residentId: string; programId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return Promise.resolve(null);

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) return Promise.resolve(null);

  return jwtVerify(token, new TextEncoder().encode(jwtSecret))
    .then(({ payload }) => {
      const p = payload as { resident_id?: string; program_id?: string };
      const residentId = p.resident_id;
      const programId = p.program_id;
      if (!residentId || !programId) return null;
      return { residentId, programId };
    })
    .catch(() => null);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) {
    return jsonResponse({ error: "Server error. Please try again." }, 500);
  }

  const auth = await getAuthPayload(req);
  if (!auth) {
    return jsonResponse({ error: "Invalid or expired token" }, 401);
  }

  const { residentId, programId } = auth;
  const supabase = createClient(url, serviceRoleKey);

  if (req.method === "GET") {
    const { data: row, error } = await supabase
      .from("game_saves")
      .select("data, savefile_info_json, timestamp")
      .eq("resident_id", residentId)
      .maybeSingle();

    if (error) {
      console.error("game_saves select error:", error);
      return jsonResponse({ error: "Server error. Please try again." }, 500);
    }

    if (!row) {
      return jsonResponse({ error: "No save found" }, 404);
    }

    return jsonResponse({
      data: row.data,
      savefileInfo: row.savefile_info_json,
      timestamp: row.timestamp,
    }, 200);
  }

  if (req.method === "POST") {
    let body: { data?: string; savefileInfo?: unknown; timestamp?: number };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const data = typeof body?.data === "string" ? body.data : "";
    const savefileInfo = body?.savefileInfo != null ? body.savefileInfo : null;
    const timestamp =
      typeof body?.timestamp === "number" && !Number.isNaN(body.timestamp)
        ? body.timestamp
        : Date.now();

    if (!data || !savefileInfo) {
      return jsonResponse(
        { error: "Missing data or savefileInfo" },
        400
      );
    }

    const { error } = await supabase
      .from("game_saves")
      .upsert(
        {
          resident_id: residentId,
          program_id: programId,
          data,
          savefile_info_json: savefileInfo,
          timestamp,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "resident_id" }
      );

    if (error) {
      console.error("game_saves upsert error:", error);
      return jsonResponse({ error: "Server error. Please try again." }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
