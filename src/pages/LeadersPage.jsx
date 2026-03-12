import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { useAuth } from "../contexts/AuthContext";
import { useSelectedProgram } from "../contexts/SelectedProgramContext";
import { Modal } from "flowbite-react";
import { Card } from "../components/Card";

export function LeadersPage() {
  const { showToast } = useToast();
  const { profile } = useAuth();
  const { effectiveProgramId } = useSelectedProgram();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [leaderToRemove, setLeaderToRemove] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  async function fetchData() {
    if (!effectiveProgramId) {
      setLeaders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, email, created_at")
      .eq("role", "leader")
      .eq("program_id", effectiveProgramId)
      .order("email");
    setLeaders(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
  }, [effectiveProgramId]); // eslint-disable-line react-hooks/exhaustive-deps -- fetchData depends on effectiveProgramId

  async function handleRemoveConfirm() {
    if (!leaderToRemove) return;
    setRemoveLoading(true);
    const { error } = await supabase.rpc("remove_leader_from_program", {
      target_profile_id: leaderToRemove.id,
    });
    setRemoveLoading(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    setRemoveModalOpen(false);
    setLeaderToRemove(null);
    fetchData();
    showToast("Leader removed from program", "success");
  }

  const isSelf = (leader) => profile?.id === leader.id;

  if (!effectiveProgramId) {
    return (
      <div className="text-sm text-text-muted">
        Select a program to view leaders.
      </div>
    );
  }

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-6"
        style={{ textShadow: "0 0 12px rgba(244,196,48,0.3)" }}
      >
        LEADERS
      </h1>

      <Card className="overflow-hidden !p-0">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-4 bg-surface-inner rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <table className="w-full text-sm text-left text-text-primary">
            <thead className="text-[10px] text-text-muted uppercase tracking-wider bg-surface-inner font-bold">
              <tr>
                <th className="px-3.5 py-2.5">Email</th>
                <th className="px-3.5 py-2.5">Joined</th>
                <th className="px-3.5 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((leader) => (
                <tr
                  key={leader.id}
                  className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]"
                >
                  <td className="px-3.5 py-2.5 font-bold text-text-bright">
                    {leader.email}
                  </td>
                  <td className="px-3.5 py-2.5 text-text-muted">
                    {leader.created_at
                      ? new Date(leader.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )
                      : "—"}
                  </td>
                  <td className="px-3.5 py-2.5">
                    <button
                      onClick={() => {
                        setLeaderToRemove(leader);
                        setRemoveModalOpen(true);
                      }}
                      disabled={isSelf(leader)}
                      className="px-3 py-1.5 text-white bg-gradient-to-b from-roof-red-light to-roof-red border-2 border-[#A82518] rounded-sm uppercase tracking-wider text-xs font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {leaders.length === 0 && !loading && (
        <p className="mt-4 text-sm text-text-muted">
          No leaders in this program yet.
        </p>
      )}

      <Modal
        show={removeModalOpen}
        onClose={() => {
          setRemoveModalOpen(false);
          setLeaderToRemove(null);
        }}
      >
        <Modal.Header>Remove Leader</Modal.Header>
        <Modal.Body>
          {leaderToRemove && (
            <p className="text-sm text-gray-600">
              Remove <strong>{leaderToRemove.email}</strong> from this program?
              They will no longer have access to this program&apos;s data.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={() => {
              setRemoveModalOpen(false);
              setLeaderToRemove(null);
            }}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemoveConfirm}
            disabled={removeLoading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            {removeLoading ? "Removing..." : "Remove"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
