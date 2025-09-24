import React, { useEffect, useMemo, useState } from "react";
import {Megaphone, Plus, RotateCw, Search, CalendarDays, MapPin, X, Save,Pencil, Trash2, ChevronLeft, ChevronRight, BadgeCheck,Link as LinkIcon, Image as ImageIcon} from "lucide-react";
import toast from "react-hot-toast";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;
const CAMP_STATUSES = ["planned", "ongoing", "completed", "cancelled"];

// attach token from localStorage if you’re using JWT
const getToken = () => localStorage.getItem("auth_token");

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const isForm = options.body instanceof FormData;
  if (!isForm && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (isForm && headers.has("Content-Type")) headers.delete("Content-Type");

  const res = await fetch(url, { ...options, headers });
  return res;
}

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
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const [openNew, setOpenNew] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/camps`);
      url.searchParams.set("page", p);
      url.searchParams.set("limit", PAGE_SIZE);
      url.searchParams.set("sort", "-startAt");
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);

      const res = await apiFetch(url.toString());
      const j = await res.json();
      if (!res.ok) throw new Error(j.message || "Failed to load");

      const list = j.data ?? [];
      const pg = j.pagination ?? {};
      setRows(list);
      setPage(pg.page ?? 1);
      setPages(pg.pages ?? 1);
      setTotal(pg.total ?? list.length);
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={() => load(1)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Apply</button>
          <button onClick={() => { setQ(""); setStatus(""); load(1); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Clear</button>
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
                        <img alt="poster" src={r.posterImg} className="h-12 w-12 rounded object-cover border" />
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
                        <a href={r.locationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline ml-1">
                          <LinkIcon size={12} /> Map
                        </a>
                      )}
                    </td>
                    <td className="py-2">{r.startAt ? new Date(r.startAt).toLocaleString() : "-"}</td>
                    <td className="py-2">{r.endAt ? new Date(r.endAt).toLocaleString() : "-"}</td>
                    <td className="py-2"><StatusChip value={r.status} /></td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1" onClick={() => setEditing(r)}>
                          <Pencil size={14} /> Edit
                        </button>
                        <PublishButton row={r} onDone={() => load(page)} />
                        <DeleteButton row={r} onDone={() => load(page)} />
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
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50">
              <ChevronLeft size={16} /> Prev
            </button>
            <button disabled={page >= pages} onClick={() => load(page + 1)} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50">
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
            hospitalName: "",
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
        />
      )}
      {editing && (
        <UpsertModal
          title="Edit Campaign"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(page); }}
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

function PublishButton({ row, onDone }) {
  const click = async () => {
    try {
      const next =
        row.status === "planned" ? "ongoing" :
        row.status === "ongoing" ? "completed" :
        "completed";

      const res = await apiFetch(`${API_BASE}/api/camps/${row._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Failed to update status");
      toast.success(`Status → ${next}`);
      onDone?.();
    } catch (e) {
      toast.error(e.message || "Failed to update");
    }
  };

  return (
    <button onClick={click} className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1">
      <BadgeCheck size={14} /> {row.status === "planned" ? "Start" : "Complete"}
    </button>
  );
}

function DeleteButton({ row, onDone }) {
  const del = async () => {
    if (!confirm("Delete this campaign?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/camps/${row._id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || "Delete failed");
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

function UpsertModal({ title, initial, onClose, onSaved }) {
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
  const [posterPreview, setPosterPreview] = useState(initial.posterImg || "");
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
    if (!form.hospitalName || !form.title) return toast.error("Hospital & title are required");
    if (!form.startAt || !form.endAt) return toast.error("Start and end times are required");
    if (new Date(form.endAt) < new Date(form.startAt)) return toast.error("End cannot be before start");

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
      if (posterFile) fd.append("poster", posterFile); // must be 'poster'

      let res;
      if (isEdit) {
        res = await apiFetch(`${API_BASE}/api/camps/${initial._id}`, {
          method: "PATCH",
          body: fd, // multipart
        });
      } else {
        res = await apiFetch(`${API_BASE}/api/camps`, {
          method: "POST",
          body: fd, // multipart
        });
      }

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || "Save failed");

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
            <input
              value={form.hospitalName}
              onChange={updateField("hospitalName")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={form.title}
              onChange={updateField("title")}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

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

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} onClick={submit} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60">
              <Save size={16} /> {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toLocal(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
