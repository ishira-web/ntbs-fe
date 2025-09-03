// src/Donor/Pages/Appointments.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Droplet,
  MapPin,
  RotateCw,
  Search,
  ShieldCheck,
  ShieldAlert,
  X,
  Check,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;

const STATUS = ["Pending", "Approved", "Cancelled"];
const SLOT_LABEL = {
  SLOT1: "10:00 – 11:30",
  SLOT2: "12:00 – 13:30",
};

function fmtDate(d) { try { return new Date(d).toLocaleDateString(); } catch { return "—"; } }
function fmtDateTime(d) { try { return new Date(d).toLocaleString(); } catch { return "—"; } }

const StatusChip = ({ value }) => {
  const map = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const Icon = value === "Approved" ? ShieldCheck : value === "Cancelled" ? ShieldAlert : Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${map[value] || map.Pending}`}>
      <Icon size={14} />
      {value}
    </span>
  );
};

export default function Appointments() {
  const { authFetch, user, role } = useAuth();

  const authUser = useMemo(
    () => user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null),
    [user]
  );
  const roleLower = (role || authUser?.role || "").toString().toLowerCase();
  const donorId = roleLower === "donor" ? (authUser?.donorId || authUser?._id || authUser?.id || null) : null;
  const hospitalId = roleLower === "hospital" ? (authUser?.hospitalId || authUser?._id || authUser?.id || null) : null;

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [qStatus, setQStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/appointments`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-createdAt");
      if (roleLower === "donor" && donorId) url.searchParams.set("donorId", donorId);
      if (roleLower === "hospital" && hospitalId) url.searchParams.set("hospitalId", hospitalId);
      if (qStatus) url.searchParams.set("status", qStatus);
      if (from) url.searchParams.set("from", from);
      if (to) url.searchParams.set("to", to);

      const res = await authFetch(url.toString());
      const text = await res.text(); // capture message even on error
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.message || "Failed to load appointments");
      }
      setRows(data.appointments || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); /* eslint-disable-next-line */ }, []);

  const approve = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/appointments/${id}/approve`, { method: "PATCH" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.message || "Approve failed");
      }
      toast.success("Appointment approved");
      load(page);
    } catch (e) {
      // Surface 403 reasons clearly
      toast.error(e.message || "Approve failed");
    }
  };

  const cancel = async (id) => {
    if (!confirm("Cancel this appointment?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/appointments/${id}`, { method: "DELETE" });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) {
        throw new Error(data.message || "Cancel failed");
      }
      toast.success("Appointment cancelled");
      load(page);
    } catch (e) {
      toast.error(e.message || "Cancel failed");
    }
  };

  // Approve button visible only if:
  // - admin, or
  // - hospital AND this appointment belongs to THIS hospital
  const canApprove = (row) => {
    if (roleLower === "admin") return true;
    if (roleLower !== "hospital" || !hospitalId) return false;
    const apptHospId = typeof row.hospitalId === "object" ? row.hospitalId?._id : row.hospitalId;
    return String(hospitalId) === String(apptHospId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CalendarDays size={22} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {roleLower === "donor" ? "My Appointments" :
               roleLower === "hospital" ? "Hospital Appointments" :
               "All Appointments"}
            </h1>
            <p className="text-xs text-gray-600">View, filter and manage blood donation appointments</p>
          </div>
        </div>
        <button
          onClick={() => load(1)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
              value={qStatus}
              onChange={(e) => setQStatus(e.target.value)}
            >
              <option value="">All</option>
              {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2 flex items-end gap-2">
            <button onClick={() => load(1)} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700">
              <Search size={16} /> Apply
            </button>
            <button onClick={() => { setQStatus(""); setFrom(""); setTo(""); load(1); }} className="inline-flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-xl hover:bg-gray-50">
              <X size={16} /> Clear
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : err ? (
          <div className="p-6 text-sm text-rose-700 bg-rose-50 border-t border-rose-200">{err}</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No appointments found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Hospital</th>
                <th className="py-3 px-4">Donor</th>
                <th className="py-3 px-4">Note</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="py-3 px-4">{fmtDate(r.day)}</td>
                  <td className="py-3 px-4">{SLOT_LABEL[r.slot] || r.slot}</td>
                  <td className="py-3 px-4"><StatusChip value={r.status} /></td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400" />
                      {r.hospitalId?.name || r.hospitalName || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <Droplet size={14} className="text-gray-400" />
                      {r.donorId?.name || r.donorName || "—"}
                    </div>
                  </td>
                  <td className="py-3 px-4">{r.note || "—"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {r.status === "Pending" && canApprove(r) && (
                        <button
                          onClick={() => approve(r._id)}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 hover:bg-emerald-700"
                          title="Approve"
                        >
                          <Check size={14} /> Approve
                        </button>
                      )}
                      {r.status !== "Cancelled" && (
                        <button
                          onClick={() => cancel(r._id)}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 hover:bg-gray-50"
                          title="Cancel"
                        >
                          <Trash2 size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} className="px-4 py-3 text-xs text-gray-500">
                  Updated {fmtDateTime(new Date())}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-600">
            Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span>–
            <span className="font-medium">{Math.min(page * PAGE_SIZE, total)}</span> of{" "}
            <span className="font-medium">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <button disabled={page <= 1} onClick={() => load(page - 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-50 hover:bg-gray-50">Prev</button>
            <div className="px-2">{page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</div>
            <button disabled={page * PAGE_SIZE >= total} onClick={() => load(page + 1)} className="px-3 py-1.5 rounded-lg border disabled:opacity-50 hover:bg-gray-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
