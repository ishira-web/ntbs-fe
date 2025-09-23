// src/pages/Campaings.jsx
import React, { useEffect, useState } from "react";
import {
  Megaphone,
  Search,
  CalendarDays,
  MapPin,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  Image as ImageIcon,
  Link as LinkIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 12;
// Align with your mongoose enum
const CAMP_STATUSES = ["planned", "ongoing", "completed", "cancelled"];

const StatusChip = ({ value }) => {
  const color = {
    planned: "bg-slate-100 text-slate-700 border-slate-200",
    ongoing: "bg-emerald-100 text-emerald-700 border-emerald-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  }[value] || "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {value}
    </span>
  );
};

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "—" : dt.toLocaleString();
};
const toISOStart = (d) => (d ? `${d}T00:00:00.000Z` : "");
const toISOEnd = (d) => (d ? `${d}T23:59:59.999Z` : "");

// Build a Google Maps URL: prefer locationUrl; fallback to search(query)
const buildMapUrl = (locationUrl, venue, hospitalName) => {
  if (locationUrl && /^https?:\/\//i.test(locationUrl)) return locationUrl;
  const q = [venue, hospitalName].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
};

export default function Campaings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState(""); // all
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // detail modal
  const [open, setOpen] = useState(null); // row

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/camps`);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      if (from) url.searchParams.set("from", toISOStart(from));
      if (to) url.searchParams.set("to", toISOEnd(to));
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-startAt");

      const headers = {};
      const token = localStorage.getItem("auth_token");
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(url.toString(), { headers });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load campaigns");
      }
      const j = await res.json();
      // support both { data } and { camps } shapes
      setRows(j.data || j.camps || []);
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

  const clearFilters = () => {
    setQ("");
    setStatus("");
    setFrom("");
    setTo("");
    load(1);
  };

  const Quick = ({ label, v }) => (
    <button
      onClick={() => { setStatus(v); load(1); }}
      className={`text-xs rounded-full border px-2 py-1 ${status === v ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Megaphone size={18} /> Campaigns
        </h1>
        <button
          onClick={() => load(1)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, hospital, organization, venue"
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
                <option key={s} value={s}>
                  {s}
                </option>
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

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => load(1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Apply
          </button>
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Clear
          </button>
          <span className="mx-2 h-4 w-px bg-gray-200" />
          <Quick label="All" v="" />
          <Quick label="Upcoming" v="planned" />
          <Quick label="Ongoing" v="ongoing" />
          <Quick label="Completed" v="completed" />
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <SkeletonGrid />
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">No campaigns found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {rows.map((c) => {
                const posterSrc = c.posterImg ? `${API_BASE}/${c.posterImg}` : null;
                const mapUrl = buildMapUrl(c.locationUrl, c.venue, c.hospitalName);
                return (
                  <div
                    key={c._id}
                    className="rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition flex flex-col"
                  >
                    {/* Top: Title + Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.title}</div>
                        <div className="mt-0.5 text-xs text-gray-500 truncate">
                          {c.hospitalName || "—"}{c.organization ? ` • ${c.organization}` : ""}
                        </div>
                      </div>
                      <StatusChip value={c.status} />
                    </div>

                    {/* Poster */}
                    <div className="mt-3">
                      {posterSrc ? (
                        <img
                          src={posterSrc}
                          alt="poster"
                          className="w-full h-40 object-cover rounded-lg border"
                          onError={(e) => (e.currentTarget.style.display = "none")}
                        />
                      ) : (
                        <div className="w-full h-40 rounded-lg border flex items-center justify-center text-gray-400">
                          <ImageIcon size={20} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-gray-500" />
                        <span className="truncate">
                          {fmtDate(c.startAt)} → {fmtDate(c.endAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-500" />
                        <span className="truncate">{c.venue || "—"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between">
                      <button
                        onClick={() => setOpen(c)}
                        className="inline-flex items-center gap-2 text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                      >
                        <Info size={14} /> Details
                      </button>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50 text-blue-700"
                        title="Open in Google Maps"
                      >
                        <LinkIcon size={14} /> Open in Maps
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-sm">
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
          </>
        )}
      </div>

      {/* Detail modal */}
      {open && <DetailModal camp={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-200 p-4">
          <div className="h-5 w-2/3 bg-gray-100 rounded animate-pulse" />
          <div className="mt-2 h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
          <div className="mt-4 h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
          <div className="mt-2 h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function DetailModal({ camp, onClose }) {
  const mapUrl = buildMapUrl(camp.locationUrl, camp.venue, camp.hospitalName);
  const posterSrc = camp.posterImg ? `${API_BASE}/${camp.posterImg}` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Megaphone size={18} />
            <h3 className="font-semibold">{camp.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm border hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Poster */}
          {posterSrc && (
            <img
              src={posterSrc}
              alt="poster"
              className="w-full h-52 object-cover rounded-lg border"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <StatusChip value={camp.status} />
            <span className="text-xs text-gray-500">ID: {camp._id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Row icon={Building2} label="Hospital" value={camp.hospitalName || "—"} />
            <Row icon={Info} label="Organization" value={camp.organization || "—"} />
            <Row icon={CalendarDays} label="Start" value={fmtDate(camp.startAt)} />
            <Row icon={CalendarDays} label="End" value={fmtDate(camp.endAt)} />
            <Row icon={MapPin} label="Venue" value={camp.venue || "—"} />
          </div>

          <div className="flex items-center justify-end gap-2">
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm rounded-lg border px-3 py-1.5 hover:bg-gray-50 text-blue-700"
              title="Open in Google Maps"
            >
              <LinkIcon size={14} /> Open in Maps
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between border rounded-xl px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-gray-50">
          <Icon size={16} className="text-gray-700" />
        </div>
        <div>
          <div className="text-[11px] text-gray-500">{label}</div>
          <div className="text-sm font-medium">{String(value ?? "—")}</div>
        </div>
      </div>
    </div>
  );
}
