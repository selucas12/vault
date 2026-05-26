import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { code_id?: string; action?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { code_id, action, note } = body;
  if (!code_id || !action || !["helpful", "error"].includes(action)) {
    return NextResponse.json({ error: "Invalid body: need code_id and action (helpful|error)" }, { status: 400 });
  }

  if (action === "helpful") {
    const { error } = await supabase.rpc("increment_guide_helpful", { row_id: code_id });
    if (error) {
      // Fallback: direct update if RPC doesn't exist
      const { data: current } = await supabase
        .from("codes")
        .select("install_guide_helpful_count, install_guide_status")
        .eq("id", code_id)
        .single();
      if (!current) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

      const newCount = (current.install_guide_helpful_count ?? 0) + 1;
      const updates: Record<string, unknown> = { install_guide_helpful_count: newCount };
      if (newCount >= 5 && current.install_guide_status === "draft") {
        updates.install_guide_status = "verified";
      }
      await supabase.from("codes").update(updates).eq("id", code_id);
    }
  } else {
    const { data: current } = await supabase
      .from("codes")
      .select("install_guide_error_reports, install_guide_status")
      .eq("id", code_id)
      .single();
    if (!current) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const newCount = (current.install_guide_error_reports ?? 0) + 1;
    const updates: Record<string, unknown> = { install_guide_error_reports: newCount };
    if (newCount >= 3 && current.install_guide_status === "verified") {
      updates.install_guide_status = "broken";
    }
    await supabase.from("codes").update(updates).eq("id", code_id);

    if (note) {
      await supabase.from("install_guide_feedback").insert({
        code_id,
        user_id: user.id,
        note,
      }).then(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
