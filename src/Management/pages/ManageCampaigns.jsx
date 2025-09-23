// src/pages/campaigns/ManageCampaigns.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Megaphone, Plus, RotateCw, Search, CalendarDays, MapPin, X, Save,
  Pencil, Trash2, ChevronLeft, ChevronRight, BadgeCheck,
  Link as LinkIcon, Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

// --- Config ---
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;
// exactly as your schema enum:
const CAMP_STATUSES = ["planned", "ongoing", "completed", "cancelled"];

function StatusChip({ value }) {
  const palette = {
    planned: "bg-slate-100 text-slate-700 border-slate-200",
    ongoing: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = palette[value] || palette.planned;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {value}
    </span>
  );
}

export default function ManageCampaigns() {
  const { authFetch, user } = useAuth();

  // table state
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // dialogs
  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState(null);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // role & hospital context
  const role = useMemo(
    () => user?.role || JSON.parse(localStorage.getItem("auth_user") || "{}")?.role,
    [user]
  );
  const hospitalId = useMemo(() => {
    const localUser = user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return localUser?.hospitalId || null;
  }, [user]);
  const [hospitalName, setHospitalName] = useState("");

  // load hospital name if role is hospital
  useEffect(() => {
    const run = async () => {
      if (role === "hospital" && hospitalId) {
        try {
          const res = await authFetch(`${API_BASE}/api/hospital/${hospitalId}`);
          if (!res.ok) throw new Error("Failed to load hospital");
          const data = await res.json();
          setHospitalName(data?.name || data?.hospitalName || "");
        } catch (e) {
          console.error(e);
          toast.error("Could not load hospital details");
        }
      }
    };
    run();
  }, [role, hospitalId, authFetch]);

  const load = async (pageNum = page) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/camps`);
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
      setRows(j.data || []); // your controller returns { data, total, page, ... }
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
  }, []);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Megaphone size={18} /> Manage Campaigns
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenNew(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
          >
            <Plus size={16} /> New Campaign
          </button>
          <button
            onClick={() => load(1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, organization, venue, hospital"
              className="w-full px-2 py-2 text-sm outline-none"
            />
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">All statuses</option>
              {CAMP_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => load(1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Apply
          </button>
          <button
            onClick={() => { setQ(""); setStatus(""); setFrom(""); setTo(""); load(1); }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
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
                  <th className="py-2">Poster</th>
                  <th className="py-2">Title</th>
                  <th className="py-2">Hospital</th>
                  <th className="py-2">Organization</th>
                  <th className="py-2">Venue</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">End</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t align-top">
                    <td className="py-2">
                      {r.posterImg ? (
                        <img
                          alt="poster"
                          src={`${API_BASE}/${r.posterImg}`}
                          className="h-12 w-12 rounded object-cover border"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="h-12 w-12 rounded border flex items-center justify-center text-gray-400">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="py-2 font-medium">{r.title}</td>
                    <td className="py-2">{r.hospitalName || "-"}</td>
                    <td className="py-2">{r.organization || "-"}</td>
                    <td className="py-2">
                      {r.venue || "-"}{" "}
                      {r.locationUrl && (
                        <a
                          href={r.locationUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline ml-1"
                        >
                          <LinkIcon size={12} /> Map
                        </a>
                      )}
                    </td>
                    <td className="py-2">{r.startAt ? new Date(r.startAt).toLocaleString() : "-"}</td>
                    <td className="py-2">{r.endAt ? new Date(r.endAt).toLocaleString() : "-"}</td>
                    <td className="py-2"><StatusChip value={r.status} /></td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
                          onClick={() => setEditing(r)}
                        >
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
          <span className="text-gray-600">
            Page {page} of {pages} • {total} total
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50"
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => load(page + 1)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openNew && (
        <UpsertModal
          title="New Campaign"
          initial={{
            hospitalName: role === "hospital" ? hospitalName : "",
            title: "",
            organization: "",
            status: "planned",
            startAt: "",
            endAt: "",
            venue: "",
            locationUrl: "",
            posterImg: "",
          }}
          onClose={() => setOpenNew(false)}
          onSaved={() => { setOpenNew(false); load(1); }}
          role={role}
          authFetch={authFetch}
        />
      )}
      {editing && (
        <UpsertModal
          title="Edit Campaign"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(page); }}
          role={role}
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
      // valid flow: planned → ongoing → completed
      const next =
        row.status === "planned" ? "ongoing" :
        row.status === "ongoing" ? "completed" :
        "completed";

      // JSON-only PATCH (no Multer) to avoid content-type mismatch
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
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <button onClick={publish} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
      <BadgeCheck size={14} /> {row.status === "planned" ? "Start" : "Complete"}
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
   Upsert Modal (Create/Update)
   =========================== */
function UpsertModal({ title, initial, onClose, onSaved, role, authFetch }) {
  const isEdit = Boolean(initial && initial._id);

  const [form, setForm] = useState({
    hospitalName: initial.hospitalName || "",
    title: initial.title || "",
    organization: initial.organization || "",
    status: initial.status || "planned",
    startAt: initial.startAt ? toLocal(initial.startAt) : "",
    endAt: initial.endAt ? toLocal(initial.endAt) : "",
    venue: initial.venue || "",
    locationUrl: initial.locationUrl || "",
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(
    initial.posterImg ? `${API_BASE}/${initial.posterImg}` : ""
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (posterFile) {
      const url = URL.createObjectURL(posterFile);
      setPosterPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [posterFile]);

  const updateField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");
    if (!form.startAt || !form.endAt) return toast.error("Start and end times are required");
    if (role === "admin" && !form.hospitalName) return toast.error("Hospital name is required");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("hospitalName", form.hospitalName);
      fd.append("title", form.title);
      if (form.organization) fd.append("organization", form.organization);
      if (form.status) fd.append("status", form.status);
      fd.append("startAt", new Date(form.startAt).toISOString());
      fd.append("endAt", new Date(form.endAt).toISOString());
      if (form.venue) fd.append("venue", form.venue);
      if (form.locationUrl) fd.append("locationUrl", form.locationUrl);
      if (posterFile) fd.append("poster", posterFile);

      let res;
      if (isEdit) {
        res = await authFetch(`${API_BASE}/api/camps/${initial._id}`, {
          method: "PUT", // multer-powered endpoint; DO NOT set Content-Type
          body: fd,
        });
      } else {
        res = await authFetch(`${API_BASE}/api/camps`, {
          method: "POST",
          body: fd, // DO NOT set Content-Type; browser sets boundary
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
          {/* Hospital Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
            <input
              value={form.hospitalName}
              onChange={updateField("hospitalName")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
              disabled={role === "hospital"}
            />
            {role === "hospital" && (
              <p className="mt-1 text-xs text-gray-500">This is set from your hospital profile.</p>
            )}
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={updateField("title")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Organization + Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
            <input
              value={form.organization}
              onChange={updateField("organization")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={updateField("status")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {CAMP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={14} /> Start</label>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={updateField("startAt")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={14} /> End</label>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={updateField("endAt")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          {/* Venue + Map URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><MapPin size={14} /> Venue</label>
            <input
              placeholder="Venue / Address"
              value={form.venue}
              onChange={updateField("venue")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location URL (Google Map)</label>
            <input
              placeholder="https://maps.google.com/?q=..."
              value={form.locationUrl}
              onChange={updateField("locationUrl")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          {/* Poster upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Poster Image</label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                <ImageIcon size={16} />
                <span>Choose file</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                />
              </label>
              {posterPreview && (
                <img src={posterPreview} alt="preview" className="h-16 w-16 rounded border object-cover" />
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Max 5MB. JPG/PNG/WEBP.</p>
          </div>

          {/* Actions */}
          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60"
            >
              <Save size={16} /> {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helpers
function toLocal(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
