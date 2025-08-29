import React, { useEffect, useMemo, useState } from "react";
import {
  Megaphone,
  Plus,
  RotateCw,
  Search,
  CalendarDays,
  MapPin,
  X,
  Save,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

// --- Config ---
const API_BASE = "http://localhost:5000";
const PAGE_SIZE = 10;
const CAMP_STATUSES = ["planned", "scheduled", "ongoing", "completed", "cancelled"];

function StatusChip({ value }) {
  const palette = {
    planned: "bg-slate-100 text-slate-700 border-slate-200",
    scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
    ongoing: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = palette[value] || palette.planned;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${cls}`}>{value}</span>;
}

export default function ManageCampaigns() {
  const { authFetch, user } = useAuth();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState(null); // a camp dto

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const hospitalId = useMemo(() => {
    const localUser =
      user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return localUser?.hospitalId || localUser?._id || localUser?.id || null;
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
      const url = new URL(`${API_BASE}/api/camps`);
      url.searchParams.set("hospitalId", hospitalId);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      if (from) url.searchParams.set("from", from);
      if (to) url.searchParams.set("to", to);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-startAt");

      const res = await authFetch(url.toString());
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load campaigns");
      }
      const j = await res.json();
      setRows(j.camps || []);
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

  const onCreate = () => setOpenNew(true);
  const onEdit = (row) => setEditing(row);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Megaphone size={18} /> Manage Campaigns
        </h1>
        <div className="flex items-center gap-2">
          <button onClick={onCreate} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black">
            <Plus size={16} /> New Campaign
          </button>
          <button onClick={() => load(1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, organizer, city, district" className="w-full px-2 py-2 text-sm outline-none" />
          </div>
          <div>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              <option value="">All statuses</option>
              {CAMP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => load(1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
          <button onClick={() => { setQ(""); setStatus(""); setFrom(""); setTo(""); load(1); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Clear</button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <SkeletonTable />
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">No campaigns found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Title</th>
                  <th className="py-2">Organizer</th>
                  <th className="py-2">Location</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">End</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.organizer || "-"}</td>
                    <td className="py-2">
                      {r.location?.addressLine1 ? `${r.location.addressLine1}, ` : ""}
                      {r.location?.city || ""}
                    </td>
                    <td className="py-2">{new Date(r.startAt).toLocaleString()}</td>
                    <td className="py-2">{new Date(r.endAt).toLocaleString()}</td>
                    <td className="py-2"><StatusChip value={r.status} /></td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1" onClick={() => onEdit(r)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <PublishButton row={r} authFetch={authFetch} onDone={() => load(page)} />
                        <DeleteButton row={r} authFetch={authFetch} onDone={() => load(page)} />
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
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50"><ChevronLeft size={16} /> Prev</button>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50">Next <ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openNew && (
        <UpsertModal
          title="New Campaign"
          initial={{ name: "", organizer: "", status: "planned", startAt: "", endAt: "", location: {}, expectedDonors: 0, capacity: 0, notes: "" }}
          onClose={() => setOpenNew(false)}
          onSaved={() => { setOpenNew(false); load(1); }}
          hospitalId={hospitalId}
          authFetch={authFetch}
        />
      )}

      {editing && (
        <UpsertModal
          title="Edit Campaign"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(page); }}
          hospitalId={hospitalId}
          authFetch={authFetch}
        />
      )}
    </div>
  );
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
   Publish / Delete actions
   =========================== */
function PublishButton({ row, authFetch, onDone }) {
  const publish = async () => {
    try {
      const next = row.status === "planned" ? "scheduled" : row.status === "scheduled" ? "ongoing" : "completed";
      const res = await authFetch(`${API_BASE}/api/camps/${row._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to update status");
      }
      toast.success(`Status → ${next}`);
      onDone?.();
    } catch (e) {
      toast.error(e.message || "Failed to publish");
    }
  };
  return (
    <button onClick={publish} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
      <BadgeCheck size={14} /> {row.status === "planned" ? "Publish" : row.status === "scheduled" ? "Start" : "Complete"}
    </button>
  );
}

function DeleteButton({ row, authFetch, onDone }) {
  const del = async () => {
    if (!confirm("Delete this campaign?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/camps/${row._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete");
      }
      toast.success("Deleted");
      onDone?.();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    }
  };
  return (
    <button onClick={del} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600">
      <Trash2 size={14} /> Delete
    </button>
  );
}

/* ===========================
   Upsert Modal
   =========================== */
function UpsertModal({ title, initial, onClose, onSaved, hospitalId, authFetch }) {
  const [name, setName] = useState(initial.name || "");
  const [organizer, setOrganizer] = useState(initial.organizer || "");
  const [status, setStatus] = useState(initial.status || "planned");
  const [startAt, setStartAt] = useState(initial.startAt ? toLocal(initial.startAt) : "");
  const [endAt, setEndAt] = useState(initial.endAt ? toLocal(initial.endAt) : "");
  const [addressLine1, setAddressLine1] = useState(initial.location?.addressLine1 || "");
  const [city, setCity] = useState(initial.location?.city || "");
  const [district, setDistrict] = useState(initial.location?.district || "");
  const [expectedDonors, setExpectedDonors] = useState(initial.expectedDonors ?? 0);
  const [capacity, setCapacity] = useState(initial.capacity ?? 0);
  const [notes, setNotes] = useState(initial.notes || "");

  const [busy, setBusy] = useState(false);

  const isEdit = Boolean(initial && initial._id);

  const submit = async (e) => {
    e.preventDefault();
    if (!name) return toast.error("Name is required");
    if (!startAt || !endAt) return toast.error("Start and end times are required");
    setBusy(true);
    try {
      const payload = {
        hospitalId,
        name,
        organizer,
        status,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        location: { addressLine1, city, district },
        expectedDonors: Number(expectedDonors) || 0,
        capacity: Number(capacity) || 0,
        notes,
      };
      let res;
      if (isEdit) {
        // exclude hospitalId on edit
        const { hospitalId: _omit, ...patch } = payload;
        res = await authFetch(`${API_BASE}/api/camps/${initial._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      } else {
        res = await authFetch(`${API_BASE}/api/camps`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Save failed");
      }
      toast.success(isEdit ? "Updated" : "Created");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><Megaphone size={18} /><h3 className="font-semibold">{title}</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organizer</label>
            <input value={organizer} onChange={(e) => setOrganizer(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {CAMP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={14} /> Start</label>
            <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={14} /> End</label>
            <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Location</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Address line" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              <input placeholder="District" value={district} onChange={(e) => setDistrict(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Donors</label>
            <input type="number" min={0} value={expectedDonors} onChange={(e) => setExpectedDonors(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
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

// Helpers
function toLocal(value) {
  // value may be ISO string; produce yyyy-MM-ddThh:mm
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
