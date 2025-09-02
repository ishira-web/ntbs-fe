// src/Management/pages/ManageBloodStock.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Droplet,
  RotateCw,
  Plus,
  CalendarDays,
  Clock,
  X,
  Save,
  TestTube,
  TestTubes,
  ChevronRight,
  Eye,
  Trash2,
  Pencil,
  ArrowRightLeft,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["WholeBlood", "RBC", "Plasma", "Platelets", "Cryo"];
const DEFAULT_SHELF_LIFE_DAYS = { WholeBlood: 35, RBC: 42, Plasma: 365, Platelets: 5, Cryo: 365 };

function computeExpiry(component, collectedAt) {
  const days = DEFAULT_SHELF_LIFE_DAYS[component] ?? 30;
  const base = collectedAt ? new Date(collectedAt) : new Date();
  return new Date(base.getTime() + days * 86400000);
}
function fmtDateTimeLocal(d) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
function StatusDot({ state }) {
  const cls = state === null ? "bg-gray-300 animate-pulse" : state ? "bg-emerald-500" : "bg-rose-500";
  const label = state === null ? "Checking backend" : state ? "Backend online" : "Backend offline";
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
  const [detailOf, setDetailOf] = useState(null);
  const [openSummary, setOpenSummary] = useState(false);

  const findHospitalId = () => {
    const localUser =
      user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return localUser?.hospitalId || localUser?._id || localUser?.id || null;
  };

  const fetchStocks = async (hid) => {
    setErr("");
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/api/bloodstock?hospitalId=${hid}&limit=500`);
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

  const rows = useMemo(() => {
    const now = Date.now();
    const groupMap = new Map();
    for (const s of stocks) {
      if (!Array.isArray(s.batches)) continue;
      for (const b of s.batches) {
        const units = Number(b.units || 0);
        const exp = b.expiresAt ? new Date(b.expiresAt).getTime() : null;
        if (!units) continue;
        const remainingDays = exp && exp > now ? Math.ceil((exp - now) / 86400000) : null;
        const g = s.bloodGroup;
        if (!groupMap.has(g)) groupMap.set(g, { units: 0, daySum: 0, dayCount: 0 });
        const rec = groupMap.get(g);
        rec.units += units;
        if (remainingDays !== null) {
          rec.daySum += remainingDays * units;
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

  const groupToStocks = useMemo(() => {
    const map = new Map();
    for (const s of stocks) {
      const key = s.bloodGroup;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    return map;
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
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenSummary(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <TestTube size={16} /> Summary
          </button>
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

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <SkeletonTable />
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
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
                        className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
                        onClick={() => {
                          const list = groupToStocks.get(group) || [];
                          if (!list.length) return toast("No components for this group", { icon: "ℹ️" });
                          setDetailOf({ list, index: 0 });
                        }}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-3 text-xs text-gray-500">
          Tip: Use “View” to inspect batches per component, edit units, transfer, or delete a batch.
          Use “Summary” for charts and expiring/expired breakdowns.
        </p>
      </div>

      {/* Modals */}
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

      {detailOf && (
        <StockDetailModal
          detailOf={detailOf}
          setDetailOf={setDetailOf}
          authFetch={authFetch}
          onAnyChange={() => hospitalId && fetchStocks(hospitalId)}
        />
      )}

      {openSummary && (
        <SummaryModal hospitalId={hospitalId} authFetch={authFetch} onClose={() => setOpenSummary(false)} />
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
   AddStockModal
   =========================== */
function AddStockModal({ onClose, onSaved, hospitalId, authFetch }) {
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [component, setComponent] = useState("WholeBlood");
  const [units, setUnits] = useState(1);
  const [collectedAt, setCollectedAt] = useState(() => fmtDateTimeLocal(new Date()));
  const [expiresAt, setExpiresAt] = useState(() => fmtDateTimeLocal(computeExpiry("WholeBlood", new Date())));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const exp = computeExpiry(component, new Date(collectedAt));
      setExpiresAt(fmtDateTimeLocal(exp));
    } catch {}
  }, [component, collectedAt]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hospitalId) return toast.error("Hospital id missing");
    if (!units || units < 1) return toast.error("Units must be at least 1");
    setBusy(true);
    try {
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
        headers: { "Content-Type": "application/json" },
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TestTubes size={18} />
            <h3 className="font-semibold">Add Blood Stock</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} required>
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
            <select className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" value={component} onChange={(e) => setComponent(e.target.value)} required>
              {COMPONENTS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">Shelf life: {DEFAULT_SHELF_LIFE_DAYS[component]} days</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input type="number" min={1} step={1} value={units} onChange={(e) => setUnits(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><CalendarDays size={14} /> Collected At</label>
            <input type="datetime-local" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock size={14} /> Expires At (auto)</label>
            <input type="datetime-local" value={expiresAt} readOnly className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm cursor-not-allowed" />
            <p className="mt-1 text-[11px] text-gray-500">Auto-calculated from component shelf life and collected time.</p>
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
   StockDetailModal — per (group, component)
   =========================== */
function StockDetailModal({ detailOf, setDetailOf, authFetch, onAnyChange }) {
  const { list, index } = detailOf;
  const [i, setI] = useState(index || 0);
  const stock = list[i];

  const close = () => setDetailOf(null);

  const removeBatch = async (batchId) => {
    if (!confirm("Delete this batch?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/bloodstock/${stock._id}/batches/${batchId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete batch");
      }
      toast.success("Batch deleted");
      onAnyChange?.();
    } catch (e) {
      toast.error(e.message || "Failed to delete");
    }
  };

  const onBatchSaved = () => {
    onAnyChange?.();
  };

  if (!stock) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Droplet size={18} />
            <h3 className="font-semibold">{stock.bloodGroup} — {stock.component}</h3>
          </div>
          <button onClick={close} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Component switcher for this blood group */}
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2 overflow-auto">
          {list.map((s, idx) => (
            <button
              key={s._id}
              onClick={() => setI(idx)}
              className={`text-xs rounded-full px-3 py-1 border ${idx === i ? "bg-gray-900 text-white" : "bg-white hover:bg-gray-50"}`}
              title={`${s.bloodGroup} / ${s.component}`}
            >
              {s.component}
            </button>
          ))}
        </div>

        {/* Batches table */}
        <div className="p-4">
          {(!stock.batches || !stock.batches.length) ? (
            <p className="text-sm text-gray-600">No batches for this component.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Units</th>
                  <th className="py-2">Collected At</th>
                  <th className="py-2">Expires At</th>
                  <th className="py-2">Note</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stock.batches.map((b) => (
                  <tr className="border-t" key={b._id}>
                    <td className="py-2">{b.units}</td>
                    <td className="py-2">{new Date(b.collectedAt).toLocaleString()}</td>
                    <td className="py-2">{new Date(b.expiresAt).toLocaleString()}</td>
                    <td className="py-2">{b.note || "-"}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <EditBatchButton stockId={stock._id} batch={b} authFetch={authFetch} onSaved={onBatchSaved} />
                        <TransferButton stock={stock} batch={b} authFetch={authFetch} onTransferred={onBatchSaved} />
                        <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600" onClick={() => removeBatch(b._id)}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Edit batch
   =========================== */
function EditBatchButton({ stockId, batch, authFetch, onSaved }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1" onClick={() => setOpen(true)}>
        <Pencil size={14} /> Edit
      </button>
      {open && (
        <EditBatchModal
          stockId={stockId}
          initial={batch}
          authFetch={authFetch}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            onSaved?.();
          }}
        />
      )}
    </>
  );
}

function EditBatchModal({ stockId, initial, authFetch, onClose, onSaved }) {
  const [units, setUnits] = useState(initial.units);
  const [collectedAt, setCollectedAt] = useState(() => fmtDateTimeLocal(new Date(initial.collectedAt)));
  const [expiresAt, setExpiresAt] = useState(() => fmtDateTimeLocal(new Date(initial.expiresAt)));
  const [note, setNote] = useState(initial.note || "");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authFetch(`${API_BASE}/api/bloodstock/${stockId}/batches/${initial._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          units: Number(units),
          collectedAt: new Date(collectedAt).toISOString(),
          expiresAt: new Date(expiresAt).toISOString(),
          note,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to update batch");
      }
      toast.success("Batch updated");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><Pencil size={18} /><h3 className="font-semibold">Edit Batch</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
            <input type="number" min={0} step={1} value={units} onChange={(e) => setUnits(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Collected At</label>
            <input type="datetime-local" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
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
   Transfer — with Hospital Name search
   =========================== */
function TransferButton({ stock, batch, authFetch, onTransferred }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1" onClick={() => setOpen(true)}>
        <ArrowRightLeft size={14} /> Transfer
      </button>
      {open && (
        <TransferModal
          source={{ stockId: stock._id, sourceHospitalId: stock.hospitalId, bloodGroup: stock.bloodGroup, component: stock.component, batch }}
          authFetch={authFetch}
          onClose={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            onTransferred?.();
          }}
        />
      )}
    </>
  );
}

/** Type-ahead hospital picker */
function HospitalPicker({ value, onChange, authFetch, excludeId }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showList, setShowList] = useState(false);
  const [manual, setManual] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(0);

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Fetch hospitals by name (supports either /api/hospital?search= or /api/hospitals?search=)
  const search = async (term) => {
    setLoading(true);
    try {
      const tryEndpoints = [
        `${API_BASE}/api/hospital?search=${encodeURIComponent(term)}&limit=10`,
        `${API_BASE}/api/hospitals?search=${encodeURIComponent(term)}&limit=10`,
      ];
      let data = null;
      for (const url of tryEndpoints) {
        const res = await authFetch(url);
        if (res.ok) {
          const j = await res.json();
          data = j;
          break;
        }
      }
      const arr = (data?.hospitals || data?.data || data || []).filter(Boolean);
      const mapped = arr
        .map((h) => ({
          _id: h._id || h.id,
          name: h.name || h.hospitalName || h.title || "Unnamed Hospital",
          city: h.city || "",
          district: h.district || "",
        }))
        .filter((h) => h._id && h._id !== excludeId);
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setShowList(true);
    }
  };

  // Debounced query
  useEffect(() => {
    window.clearTimeout(debounceRef.current);
    if (!q || q.trim().length < 2) {
      setItems([]);
      return;
    }
    debounceRef.current = window.setTimeout(() => search(q.trim()), 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // When value is set from outside, we clear current selected label (optional)
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  return (
    <div className="relative" ref={boxRef}>
      {!manual ? (
        <>
          <div className="flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q.trim().length >= 2 && setShowList(true)}
              placeholder="Search hospital by name (min 2 chars)"
              className="w-full px-2 py-2 text-sm outline-none"
            />
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500">
            {selected ? (
              <>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5">
                  Selected: <b className="font-medium">{selected.name}</b>
                </span>
                <span className="text-gray-400">•</span>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    setSelected(null);
                    onChange("");
                  }}
                >
                  Clear
                </button>
              </>
            ) : (
              <span>No hospital selected</span>
            )}
            <span className="text-gray-400">•</span>
            <button type="button" className="underline" onClick={() => setManual(true)}>
              Enter ID manually
            </button>
          </div>

          {showList && (loading || items.length > 0) && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-sm max-h-64 overflow-auto">
              {loading ? (
                <div className="p-3 text-sm text-gray-500">Searching…</div>
              ) : (
                items.map((h) => (
                  <button
                    key={h._id}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    onClick={() => {
                      setSelected(h);
                      onChange(h._id, h);
                      setShowList(false);
                      setQ("");
                    }}
                  >
                    <div className="text-sm font-medium">{h.name}</div>
                    <div className="text-xs text-gray-500">
                      {[h.city, h.district].filter(Boolean).join(", ")}
                    </div>
                  </button>
                ))
              )}
              {!loading && items.length === 0 && (
                <div className="p-3 text-sm text-gray-500">No matches</div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            placeholder="Destination hospital ObjectId"
          />
          <div className="text-[11px] text-gray-500">
            Don’t know the ID?{" "}
            <button type="button" className="underline" onClick={() => setManual(false)}>
              Search by name instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TransferModal({ source, authFetch, onClose, onDone }) {
  const [destHospitalId, setDestHospitalId] = useState("");
  const [destHospital, setDestHospital] = useState(null);
  const [units, setUnits] = useState(1);
  const [busy, setBusy] = useState(false);

  const doTransfer = async (e) => {
    e.preventDefault();
    if (!destHospitalId) return toast.error("Please choose a destination hospital");
    if (units < 1) return toast.error("Units must be at least 1");
    if (units > source.batch.units) return toast.error("Units exceed available in batch");

    setBusy(true);
    try {
      // 1) Add to destination hospital (new batch with same dates)
      const payload = {
        hospitalId: destHospitalId,
        bloodGroup: source.bloodGroup,
        component: source.component,
        units: Number(units),
        collectedAt: source.batch.collectedAt,
        expiresAt: source.batch.expiresAt,
        note: `Transferred from ${source.stockId}`,
      };
      const addRes = await authFetch(`${API_BASE}/api/bloodstock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!addRes.ok) {
        const d = await addRes.json().catch(() => ({}));
        throw new Error(d.message || "Failed to add to destination");
      }

      // 2) Decrease from source batch
      const newUnits = source.batch.units - Number(units);
      const patchRes = await authFetch(
        `${API_BASE}/api/bloodstock/${source.stockId}/batches/${source.batch._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ units: newUnits }),
        }
      );
      if (!patchRes.ok) {
        const d = await patchRes.json().catch(() => ({}));
        throw new Error(d.message || "Failed to decrement source batch");
      }

      toast.success(
        `Transferred ${units} unit(s) ${source.bloodGroup}/${source.component} to ${
          destHospital?.name || "destination"
        }`
      );
      onDone?.();
    } catch (e) {
      toast.error(e.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><ArrowRightLeft size={18} /><h3 className="font-semibold">Transfer Units</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>
        <form onSubmit={doTransfer} className="p-4 grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Hospital</label>
            <HospitalPicker
              value={destHospitalId}
              onChange={(id, item) => {
                setDestHospitalId(id);
                setDestHospital(item || null);
              }}
              authFetch={authFetch}
              excludeId={source.sourceHospitalId}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Units to transfer</label>
            <input
              type="number"
              min={1}
              max={source.batch.units}
              value={units}
              onChange={(e) => setUnits(+e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">Available: {source.batch.units}</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60">
              <ArrowRightLeft size={16} />{busy ? "Transferring..." : "Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ===========================
   Summary (charts)
   =========================== */
function SummaryModal({ hospitalId, authFetch, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [days, setDays] = useState(7);

  const load = async (d = days) => {
    setErr("");
    setLoading(true);
    try {
      const url = new URL(`${API_BASE}/api/bloodstock/summary`);
      if (hospitalId) url.searchParams.set("hospitalId", hospitalId);
      url.searchParams.set("days", String(d));
      const res = await authFetch(url.toString());
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || "Failed to load summary");
      }
      const j = await res.json();
      setData(j);
    } catch (e) {
      setErr(e.message || "Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-6xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><TestTube size={18} /><h3 className="font-semibold">Stock Summary</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm text-gray-700">Expiring window (days)</label>
            <input type="number" min={1} value={days} onChange={(e) => setDays(+e.target.value)} className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            <button onClick={() => load(days)} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              <RotateCw size={16} /> Reload
            </button>
          </div>

          {loading ? (
            <SkeletonTable />
          ) : err ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
          ) : !data ? (
            <p className="text-sm text-gray-600">No data.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="By Blood Group">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byGroup} dataKey="units" nameKey="bloodGroup" outerRadius={80} label>
                        {data.byGroup.map((_, idx) => (
                          <Cell key={idx} />
                        ))}
                      </Pie>
                      <RTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="By Component">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data.byComponent} dataKey="units" nameKey="component" outerRadius={80} label>
                        {data.byComponent.map((_, idx) => (
                          <Cell key={idx} />
                        ))}
                      </Pie>
                      <RTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title={`Expiring in ≤ ${data.expiringSoon.days} days`}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.expiringSoon.byGroup}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bloodGroup" />
                      <YAxis />
                      <RTooltip />
                      <Legend />
                      <Bar dataKey="units" name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Expired Units">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.expired.byGroup}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bloodGroup" />
                      <YAxis />
                      <RTooltip />
                      <Legend />
                      <Bar dataKey="units" name="Units" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <ChevronRight size={16} /> {title}
        </h4>
      </div>
      {children}
    </div>
  );
}
