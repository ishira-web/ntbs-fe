// src/Management/pages/ManageBloodStock.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Droplet,
  RotateCw,
  Plus,
  CalendarDays,
  Clock,
  X,
  Save,
  TestTubes,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["WholeBlood", "RBC", "Plasma", "Platelets", "Cryo"];
const DEFAULT_SHELF_LIFE_DAYS = {
  WholeBlood: 35,
  RBC: 42,
  Plasma: 365,
  Platelets: 5,
  Cryo: 365,
};

function computeExpiry(component, collectedAt) {
  const days = DEFAULT_SHELF_LIFE_DAYS[component] ?? 30;
  const base = collectedAt ? new Date(collectedAt) : new Date();
  const expiry = new Date(base.getTime() + days * 86400000);
  return expiry;
}

function fmtDateTimeLocal(d) {
  // returns "YYYY-MM-DDThh:mm" for <input type="datetime-local">
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function StatusDot({ state }) {
  // null=unknown, true=online, false=offline
  const cls =
    state === null
      ? "bg-gray-300 animate-pulse"
      : state
      ? "bg-emerald-500"
      : "bg-rose-500";
  const label =
    state === null ? "Checking backend" : state ? "Backend online" : "Backend offline";
  return (
    <span className="inline-flex items-center gap-2 text-xs text-gray-600">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} title={label} />
      {label}
    </span>
  );
}

export default function ManageBloodStock() {
  const { authFetch, user } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [apiOnline, setApiOnline] = useState(null);
  const [hospitalId, setHospitalId] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);

  const findHospitalId = () => {
    const localUser =
      user ||
      (localStorage.getItem("auth_user")
        ? JSON.parse(localStorage.getItem("auth_user"))
        : null);
    return localUser?.hospitalId || localUser?.id || localUser?._id || null;
  };

  const fetchStocks = async (hid) => {
    setErr("");
    setLoading(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/bloodstock?hospitalId=${hid}&limit=500`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setApiOnline(false);
        throw new Error(d.message || "Failed to load stock");
      }
      const data = await res.json();
      setStocks(data.stocks || []);
      setApiOnline(true);
    } catch (e) {
      setErr(e.message || "Failed to load");
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hid = findHospitalId();
    setHospitalId(hid);
    if (hid) fetchStocks(hid);
    else {
      setErr("Hospital id not found in auth_user");
      setApiOnline(false);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Aggregate: per blood group => total units & weighted avg remaining days (non-expired)
  const rows = useMemo(() => {
    const now = Date.now();
    const groupMap = new Map(); // g -> { units, daySum, dayCount }
    for (const s of stocks) {
      if (!Array.isArray(s.batches)) continue;
      for (const b of s.batches) {
        const units = Number(b.units || 0);
        const exp = b.expiresAt ? new Date(b.expiresAt).getTime() : null;
        if (!units) continue;
        const remainingDays =
          exp && exp > now ? Math.ceil((exp - now) / 86400000) : null;

        const g = s.bloodGroup;
        if (!groupMap.has(g)) groupMap.set(g, { units: 0, daySum: 0, dayCount: 0 });
        const rec = groupMap.get(g);
        rec.units += units;
        if (remainingDays !== null) {
          rec.daySum += remainingDays * units; // weighted by units
          rec.dayCount += units;
        }
      }
    }
    return GROUPS.map((g) => {
      const r = groupMap.get(g) || { units: 0, daySum: 0, dayCount: 0 };
      const avg = r.dayCount > 0 ? Math.round(r.daySum / r.dayCount) : 0;
      return { group: g, units: r.units, avg };
    }).filter((r) => r.units > 0);
  }, [stocks]);

  return (
    <div className="p-6 space-y-4">
      {/* Top bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Droplet size={18} /> Manage Blood Stock
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
            <StatusDot state={apiOnline} />
            <span className="text-gray-400">•</span>
            <code className="rounded bg-gray-50 px-1.5 py-0.5">
              {`/api/bloodstock?hospitalId=<${hospitalId || "id"}>`}
            </code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
          >
            <Plus size={16} /> Add Stock
          </button>
          <button
            onClick={() => hospitalId && fetchStocks(hospitalId)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Card/Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-2/3 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">No stock found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2">Blood Group</th>
                <th className="py-2">Units</th>
                <th className="py-2">Avg days to expiry</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ group, units, avg }) => (
                <tr key={group} className="border-t">
                  <td className="py-2">{group}</td>
                  <td className="py-2">{units}</td>
                  <td className="py-2">{avg}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button
                        className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                        onClick={() => toast("Open edit modal (per-batch)", { icon: "🧪" })}
                      >
                        Update
                      </button>
                      <button
                        className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                        onClick={() => toast("Open transfer flow", { icon: "🚚" })}
                      >
                        Transfer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Tip: “Update” edits batches per group/component. “Transfer” can move units to another
          hospital.
        </p>
      </div>

      {/* Add Stock Modal */}
      {openAdd && (
        <AddStockModal
          onClose={() => setOpenAdd(false)}
          onSaved={() => {
            setOpenAdd(false);
            hospitalId && fetchStocks(hospitalId);
          }}
          hospitalId={hospitalId}
          authFetch={authFetch}
        />
      )}
    </div>
  );
}

/* ===========================
   AddStockModal
   =========================== */
function AddStockModal({ onClose, onSaved, hospitalId, authFetch }) {
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [component, setComponent] = useState("WholeBlood");
  const [units, setUnits] = useState(1);
  const [collectedAt, setCollectedAt] = useState(() => fmtDateTimeLocal(new Date()));
  const [expiresAt, setExpiresAt] = useState(() =>
    fmtDateTimeLocal(computeExpiry("WholeBlood", new Date()))
  );
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // auto-calc expires when component or collectedAt changes
  useEffect(() => {
    try {
      const exp = computeExpiry(component, new Date(collectedAt));
      setExpiresAt(fmtDateTimeLocal(exp));
    } catch {
      // ignore
    }
  }, [component, collectedAt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospitalId) {
      toast.error("Hospital id missing");
      return;
    }
    if (!units || units < 1) {
      toast.error("Units must be at least 1");
      return;
    }
    setBusy(true);
    try {
      // You can omit expiresAt and let backend auto-calc.
      // Here we send it so the user sees exactly what will be stored.
      const payload = {
        hospitalId,
        bloodGroup,
        component,
        units: Number(units),
        collectedAt: new Date(collectedAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        note,
      };

      const res = await authFetch(`${API_BASE}/api/bloodstock`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to add stock");
      }
      toast.success("Stock added");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Failed to add stock");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TestTubes size={18} />
            <h3 className="font-semibold">Add Blood Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              required
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
            <select
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              required
            >
              {COMPONENTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">
              Shelf life: {DEFAULT_SHELF_LIFE_DAYS[component]} days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input
              type="number"
              min={1}
              step={1}
              value={units}
              onChange={(e) => setUnits(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <CalendarDays size={14} /> Collected At
            </label>
            <input
              type="datetime-local"
              value={collectedAt}
              onChange={(e) => setCollectedAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Clock size={14} /> Expires At (auto)
            </label>
            <input
              type="datetime-local"
              value={expiresAt}
              readOnly
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm cursor-not-allowed"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              Auto-calculated from component shelf life and collected time.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              placeholder="Optional"
            />
          </div>

          <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2">
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
              <Save size={16} />
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
