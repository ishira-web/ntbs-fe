import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck2,
  Plus,
  RotateCw,
  Search,
  X,
  Save,
  Trash2,
  ShieldCheck,
  XCircle,
  Ban,
  Truck,
  Info,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

// --- Config ---
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["WholeBlood", "RBC", "Plasma", "Platelets", "Cryo"];
const STATUSES = ["Pending", "Approved", "Rejected", "Fulfilled", "Cancelled"];

function StatusChip({ value }) {
  const palette = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Approved: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
    Fulfilled: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Cancelled: "bg-slate-100 text-slate-700 border-slate-200",
  };
  const cls = palette[value] || palette.Pending;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${cls}`}>{value}</span>;
}

export default function ManageAppointments() {
  const { authFetch, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState(""); // searches requestID only on client (quick filter)
  const [status, setStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [component, setComponent] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [approveFor, setApproveFor] = useState(null); // row being approved

  const hospitalId = useMemo(() => {
    const u = user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return u?.hospitalId || u?._id || u?.id || null;
  }, [user]);

  const load = async (pageNum = page) => {
    if (!hospitalId) {
      setErr("Hospital id missing in auth");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/requests`);
      url.searchParams.set("hospitalId", hospitalId); // destination filter
      if (status) url.searchParams.set("status", status);
      if (bloodGroup) url.searchParams.set("bloodGroup", bloodGroup);
      if (component) url.searchParams.set("component", component);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-createdAt");

      const res = await authFetch(url.toString());
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load requests");
      }
      const j = await res.json();
      setRows(j.requests || []);
      setTotal(j.total || 0);
      setPage(j.page || 1);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalId]);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (r.requestID || "").toLowerCase().includes(s));
  }, [rows, q]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <CalendarCheck2 size={18} /> Manage Appointments
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpenNew(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black">
            <Plus size={16} /> New Request
          </button>
          <button onClick={() => load(1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 mb-4">
          <div className="lg:col-span-2 flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by Request ID (#REQ1234)" className="w-full px-2 py-2 text-sm outline-none" />
          </div>
          <div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">Any group</option>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <select value={component} onChange={(e) => setComponent(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">Any component</option>
              {COMPONENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => load(1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
            <button onClick={() => { setQ(""); setStatus(""); setBloodGroup(""); setComponent(""); load(1); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Clear</button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <SkeletonTable />
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No requests found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Request</th>
                  <th className="py-2">Blood</th>
                  <th className="py-2">Units</th>
                  <th className="py-2">Preferred</th>
                  <th className="py-2">Source</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2 font-medium">{r.requestID}</td>
                    <td className="py-2">{r.bloodGroup} / {r.component}</td>
                    <td className="py-2">{r.units}</td>
                    <td className="py-2">{r.preferredDate ? new Date(r.preferredDate).toLocaleString() : <span className="text-gray-400">—</span>}</td>
                    <td className="py-2">{r.sourceHospitalId || <span className="text-gray-400">—</span>}</td>
                    <td className="py-2"><StatusChip value={r.status} /></td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        {r.status === "Pending" && (
                          <button onClick={() => setApproveFor(r)} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"><ShieldCheck size={14} /> Approve</button>
                        )}
                        {r.status === "Pending" && (
                          <button onClick={() => rejectReq(r)} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600"><XCircle size={14} /> Reject</button>
                        )}
                        {r.status === "Pending" && (
                          <button onClick={() => cancelReq(r)} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"><Ban size={14} /> Cancel</button>
                        )}
                        {r.status === "Approved" && (
                          <button onClick={() => fulfillReq(r)} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"><Truck size={14} /> Fulfill</button>
                        )}
                        {/* Optional admin delete */}
                        <button onClick={() => deleteReq(r)} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600"><Trash2 size={14} /> Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-600">Page {page} of {pages} • {total} total</span>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50">Prev</button>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openNew && (
        <CreateRequestModal
          onClose={() => setOpenNew(false)}
          onSaved={() => { setOpenNew(false); load(1); }}
          hospitalId={hospitalId}
          authFetch={authFetch}
        />
      )}

      {approveFor && (
        <ApproveModal
          request={approveFor}
          onClose={() => setApproveFor(null)}
          onSaved={() => { setApproveFor(null); load(page); }}
          authFetch={authFetch}
        />
      )}
    </div>
  );

  // --- actions ---
  async function rejectReq(row) {
    try {
      const res = await authFetch(`${API_BASE}/api/requests/${row._id}/reject`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Reject failed");
      toast.success("Rejected");
      load(page);
    } catch (e) {
      toast.error(e.message || "Reject failed");
    }
  }
  async function cancelReq(row) {
    try {
      const res = await authFetch(`${API_BASE}/api/requests/${row._id}/cancel`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Cancel failed");
      toast.success("Cancelled");
      load(page);
    } catch (e) {
      toast.error(e.message || "Cancel failed");
    }
  }
  async function fulfillReq(row) {
    try {
      const res = await authFetch(`${API_BASE}/api/requests/${row._id}/fulfill`, { method: "PATCH" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Fulfill failed");
      toast.success("Fulfilled & transferred");
      load(page);
    } catch (e) {
      toast.error(e.message || "Fulfill failed");
    }
  }
  async function deleteReq(row) {
    if (!confirm("Delete this request?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/requests/${row._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Delete failed");
      toast.success("Deleted");
      load(page);
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  }
}

function SkeletonTable() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
      <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
      <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
      <div className="h-10 w-2/3 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

/* ===========================
   Create Request Modal (POST /api/requests)
   =========================== */
function CreateRequestModal({ onClose, onSaved, hospitalId, authFetch }) {
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [component, setComponent] = useState("WholeBlood");
  const [units, setUnits] = useState(1);
  const [preferredDate, setPreferredDate] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!hospitalId) return toast.error("Hospital id missing");
    if (units < 1) return toast.error("Units must be >= 1");
    setBusy(true);
    try {
      const payload = {
        hospitalId,
        bloodGroup,
        component,
        units: Number(units),
        preferredDate: preferredDate ? new Date(preferredDate).toISOString() : null,
        note,
      };
      const res = await authFetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Create failed");
      toast.success("Request created");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><CalendarCheck2 size={18} /><h3 className="font-semibold">New Request</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
            <select value={component} onChange={(e) => setComponent(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {COMPONENTS.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input type="number" min={1} value={units} onChange={(e) => setUnits(+e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date/Time</label>
            <input type="datetime-local" value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="Optional" />
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60">
              <Save size={16} />{busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===========================
   Approve Modal (PATCH /:id/approve)
   =========================== */
function ApproveModal({ request, onClose, onSaved, authFetch }) {
  const [sourceHospitalId, setSourceHospitalId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!sourceHospitalId) return toast.error("Source hospital id required");
    setBusy(true);
    try {
      const res = await authFetch(`${API_BASE}/api/requests/${request._id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceHospitalId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Approve failed");
      toast.success("Approved");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><ShieldCheck size={18} /><h3 className="font-semibold">Approve Request</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 gap-4">
          <div className="text-sm text-gray-600 flex items-start gap-2">
            <Info size={16} className="mt-0.5" />
            <p>
              Enter the <b>source hospital ObjectId</b> that will fulfill this request. The backend will check
              availability of {request.units} unit(s) of {request.bloodGroup}/{request.component} before approving.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Hospital ID</label>
            <input value={sourceHospitalId} onChange={(e) => setSourceHospitalId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" placeholder="e.g., 66d3e..." />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60">
              <ShieldCheck size={16} />{busy ? "Approving..." : "Approve"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
