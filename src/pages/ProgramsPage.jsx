import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useToast } from "../contexts/ToastContext";
import { Modal } from "flowbite-react";
import { Card } from "../components/Card";

export function ProgramsPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [leaderCounts, setLeaderCounts] = useState({});
  const [residentCounts, setResidentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    const { data: progData } = await supabase
      .from("programs")
      .select("*")
      .order("name");
    setPrograms(progData ?? []);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("program_id")
      .eq("role", "leader");
    const lc = {};
    profiles?.forEach((p) => {
      if (p.program_id) {
        lc[p.program_id] = (lc[p.program_id] ?? 0) + 1;
      }
    });
    setLeaderCounts(lc);

    const { data: residents } = await supabase
      .from("residents")
      .select("program_id");
    const rc = {};
    residents?.forEach((r) => {
      rc[r.program_id] = (rc[r.program_id] ?? 0) + 1;
    });
    setResidentCounts(rc);
    setLoading(false);
  }

  useEffect(() => {
    fetchData(); // eslint-disable-line react-hooks/set-state-in-effect -- data fetch
  }, []);

  return (
    <>
      <h1
        className="font-pixel text-base text-flag-yellow mb-6"
        style={{ textShadow: "0 0 12px rgba(244,196,48,0.3)" }}
      >
        PROGRAMS
      </h1>

      <div className="flex justify-end mb-4">
        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-b from-royal-blue-light to-royal-blue border-2 border-royal-blue-dark rounded-sm font-bold uppercase tracking-wider text-xs"
        >
          Create Program
        </button>
      </div>

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
                <th className="px-3.5 py-2.5">Program Name</th>
                <th className="px-3.5 py-2.5">Leaders</th>
                <th className="px-3.5 py-2.5">Residents</th>
                <th className="px-3.5 py-2.5 w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border-dark hover:bg-[rgba(29,59,142,0.1)]"
                >
                  <td className="px-3.5 py-2.5 font-bold text-text-bright">
                    {p.name}
                  </td>
                  <td className="px-3.5 py-2.5">{leaderCounts[p.id] ?? 0}</td>
                  <td className="px-3.5 py-2.5">{residentCounts[p.id] ?? 0}</td>
                  <td className="px-3.5 py-2.5">
                    <button
                      onClick={() =>
                        navigate(`/admin/programs/${p.id}/dashboard`)
                      }
                      className="px-3 py-1.5 text-white bg-gradient-to-b from-fantasy-green-light to-fantasy-green border-2 border-[#4A8A2C] rounded-sm shadow-[0_0_8px_rgba(92,161,54,0.3)] uppercase tracking-wider text-xs font-bold whitespace-nowrap"
                    >
                      View Program
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CreateProgramModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          fetchData();
          setCreateModalOpen(false);
          showToast("Program created", "success");
        }}
        showToast={showToast}
      />
    </>
  );
}

function CreateProgramModal({ open, onClose, onSuccess, showToast }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("programs")
      .insert({ name: name.trim() });
    setLoading(false);
    if (error) {
      showToast(error.message, "error");
      return;
    }
    onSuccess();
  }

  if (!open) return null;
  return (
    <Modal show={open} onClose={onClose}>
      <Modal.Header>Create Program</Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Program Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., General Surgery Residency"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5"
              required
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
