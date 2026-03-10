import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { SummaryCard } from "../components/SummaryCard";
import { Card } from "../components/Card";

export function SuperadminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    programCount: 0,
    leaderCount: 0,
    residentCount: 0,
    activeInviteCount: 0,
    attempts7d: 0,
    attempts30d: 0,
    activePrograms7d: 0,
    activePrograms30d: 0,
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        { count: programCount },
        { count: leaderCount },
        { count: residentCount },
        { count: activeInviteCount },
        { data: attempts7d },
        { data: attempts30d },
      ] = await Promise.all([
        supabase.from("programs").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "leader"),
        supabase.from("residents").select("*", { count: "exact", head: true }),
        supabase
          .from("invite_codes")
          .select("*", { count: "exact", head: true })
          .is("used_at", null),
        supabase
          .from("attempts")
          .select("program_id")
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase
          .from("attempts")
          .select("program_id")
          .gte("created_at", thirtyDaysAgo.toISOString()),
      ]);

      const programIds7d = new Set(attempts7d?.map((a) => a.program_id) ?? []);
      const programIds30d = new Set(
        attempts30d?.map((a) => a.program_id) ?? [],
      );

      setStats({
        programCount: programCount ?? 0,
        leaderCount: leaderCount ?? 0,
        residentCount: residentCount ?? 0,
        activeInviteCount: activeInviteCount ?? 0,
        attempts7d: attempts7d?.length ?? 0,
        attempts30d: attempts30d?.length ?? 0,
        activePrograms7d: programIds7d.size,
        activePrograms30d: programIds30d.size,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-border-dark border-t-royal-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-7"
        style={{ textShadow: "0 0 12px rgba(244,196,48,0.3)" }}
      >
        ADMIN DASHBOARD
      </h1>
      <p className="text-text-muted text-sm -mt-5 mb-7">
        Network overview and activity.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Programs" value={stats.programCount} color="blue" />
        <SummaryCard label="Leaders" value={stats.leaderCount} color="green" />
        <SummaryCard
          label="Residents"
          value={stats.residentCount}
          color="yellow"
        />
        <SummaryCard
          label="Active Invites"
          value={stats.activeInviteCount}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          label="Attempts (7d)"
          value={stats.attempts7d}
          color="blue"
        />
        <SummaryCard
          label="Attempts (30d)"
          value={stats.attempts30d}
          color="blue"
        />
        <SummaryCard
          label="Active Programs (7d)"
          value={stats.activePrograms7d}
          color="green"
        />
        <SummaryCard
          label="Active Programs (30d)"
          value={stats.activePrograms30d}
          color="green"
        />
      </div>

      <Card>
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">
          Quick Links
        </p>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/admin/programs"
            className="text-royal-blue-light hover:text-royal-blue hover:underline font-medium"
          >
            Programs
          </Link>
          <Link
            to="/admin/invites"
            className="text-royal-blue-light hover:text-royal-blue hover:underline font-medium"
          >
            Invites
          </Link>
          <Link
            to="/admin/game-settings"
            className="text-royal-blue-light hover:text-royal-blue hover:underline font-medium"
          >
            Game Settings
          </Link>
        </div>
      </Card>
    </>
  );
}
