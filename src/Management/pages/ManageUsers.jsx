// src/Management/pages/ManageDonors.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  RotateCw,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;
const STATUSES = ["Pending", "Confirmed", "Rejected"];
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

function StatusChip({ value }) {
  const palette = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const cls = palette[value] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${cls}`}>
      {value}
    </span>
  );
}

export default function ManageDonors() {
  const { authFetch } = useAuth();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(null); // donor dto

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = async (pageNum = page) => {
    setLoading(true);
    setErr("");
    try {
      const url = new URL(`${API_BASE}/api/donor`);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      if (bloodGroup) url.searchParams.set("bloodGroup", bloodGroup);
      if (district) url.searchParams.set("district", district);
      url.searchParams.set("page", String(pageNum));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-createdAt");

      const res = await authFetch(url.toString());
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load donors");
      }
      const j = await res.json();
      setRows(j.donors || []);
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

  const onEdit = (row) => setEditing(row);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Users size={18} /> Manage Donors
        </h1>
        <button
          onClick={() => load(1)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="md:col-span-2 flex items-center border rounded-lg px-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, NIC, email, phone"
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
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Any group</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="District"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load(1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Apply
            </button>
            <button
              onClick={() => {
                setQ(""); setStatus(""); setBloodGroup(""); setDistrict(""); load(1);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <SkeletonTable />
        ) : err ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">No donors found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Name</th>
                  <th className="py-2">NIC</th>
                  <th className="py-2">Email</th>
                  <th className="py-2">Phone</th>
                  <th className="py-2">Blood</th>
                  <th className="py-2">District</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="py-2">{r.name}</td>
                    <td className="py-2">{r.nic}</td>
                    <td className="py-2">{r.email}</td>
                    <td className="py-2">{r.phone}</td>
                    <td className="py-2">{r.bloodGroup}</td>
                    <td className="py-2">{r.district}</td>
                    <td className="py-2"><StatusChip value={r?.confirmation?.status || "Pending"} /></td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
                          onClick={() => onEdit(r)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
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

      {/* Edit Modal */}
      {editing && (
        <EditDonorModal
          donor={editing}
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

function DeleteButton({ row, authFetch, onDone }) {
  const del = async () => {
    if (!confirm("Delete this donor?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/donor/${row._id}`, { method: "DELETE" });
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
    <button
      onClick={del}
      className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600"
      title="Delete donor"
    >
      <Trash2 size={14} /> Delete
    </button>
  );
}

/* ===== Edit Modal with integrated Status change ===== */
function EditDonorModal({ donor, onClose, onSaved }) {
  const { authFetch, role } = useAuth();

  const [form, setForm] = useState(() => ({
    name: donor.name || "",
    nic: donor.nic || "",
    email: donor.email || "",
    phone: donor.phone || "",
    dateOfBirth: donor.dateOfBirth ? toLocalDate(donor.dateOfBirth) : "",
    gender: donor.gender || "male",
    bloodGroup: donor.bloodGroup || "",
    weightKg: donor.weightKg || "",
    addressLine1: donor.addressLine1 || "",
    city: donor.city || "",
    district: donor.district || "",
    nearestHospitalId: donor.nearestHospitalId || "",
    medical: {
      lastDonationDate: donor.medical?.lastDonationDate ? toLocalDate(donor.medical.lastDonationDate) : "",
      chronicIllness: !!donor.medical?.chronicIllness,
      medications: donor.medical?.medications || "",
      recentTattooMonths: donor.medical?.recentTattooMonths || 0,
    },
  }));

  const currentStatus = donor?.confirmation?.status || "Pending";
  // Admin/Hospital can choose a status change via accept endpoint; donors cannot.
  const [statusAction, setStatusAction] = useState(""); // "", "Confirmed", "Rejected"
  const [busy, setBusy] = useState(false);

  const update = (path, value) => {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Build patch WITHOUT confirmation (status changes use /accept endpoint)
      const patch = {
        name: form.name,
        nic: form.nic,
        email: form.email,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        weightKg: Number(form.weightKg || 0),
        addressLine1: form.addressLine1,
        city: form.city,
        district: form.district,
        nearestHospitalId: form.nearestHospitalId || undefined,
        medical: {
          lastDonationDate: form.medical.lastDonationDate ? new Date(form.medical.lastDonationDate).toISOString() : null,
          chronicIllness: !!form.medical.chronicIllness,
          medications: form.medical.medications,
          recentTattooMonths: Number(form.medical.recentTattooMonths || 0),
        },
      };

      // 1) Update demographic/medical fields
      const res = await authFetch(`${API_BASE}/api/donor/${donor._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Update failed");
      }

      // 2) If admin/hospital selected a new status (Confirmed/Rejected), call /accept
      const canChangeStatus = role === "admin" || role === "hospital";
      const wantsChange = statusAction && statusAction !== currentStatus;
      if (canChangeStatus && wantsChange) {
        const acc = await authFetch(`${API_BASE}/api/donor/${donor._id}/accept`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: statusAction }),
        });
        if (!acc.ok) {
          const d2 = await acc.json().catch(() => ({}));
          throw new Error(d2.message || "Failed to update status");
        }
      }

      toast.success("Donor saved");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-4xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users size={18} />
            <h3 className="font-semibold">Edit Donor</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              Current status: <StatusChip value={currentStatus} />
            </div>
            <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Identity */}
          <section className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-2">Identity</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Name</label>
                <input value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NIC</label>
                <input value={form.nic} onChange={(e) => update("nic", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required />
              </div>
            </div>
          </section>

          {/* Demographics */}
          <section className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-2">Demographics</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Date of Birth</label>
                <input type="date" value={form.dateOfBirth} onChange={(e) => update("dateOfBirth", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gender</label>
                <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="male">male</option>
                  <option value="female">female</option>
                  <option value="other">other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood Group</label>
                <select value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input type="number" min={0} value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-2">Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Address Line</label>
                <input value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input value={form.city} onChange={(e) => update("city", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">District</label>
                <input value={form.district} onChange={(e) => update("district", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nearest Hospital ID</label>
                <input value={form.nearestHospitalId} onChange={(e) => update("nearestHospitalId", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Medical */}
          <section className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-2">Medical</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Last Donation Date</label>
                <input type="date" value={form.medical.lastDonationDate} onChange={(e) => update("medical.lastDonationDate", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Chronic Illness</label>
                <select value={form.medical.chronicIllness ? "yes" : "no"} onChange={(e) => update("medical.chronicIllness", e.target.value === "yes")} className="w-full rounded-lg border px-3 py-2 text-sm">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tattoo (months)</label>
                <input type="number" min={0} value={form.medical.recentTattooMonths} onChange={(e) => update("medical.recentTattooMonths", e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
            </div>
          </section>

          {/* Status (admin/hospital only) */}
          <section className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-2">Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500 mb-1">
                  You can only change status to <b>Confirmed</b> or <b>Rejected</b>.
                </div>
                <StatusRow
                  current={currentStatus}
                  statusAction={statusAction}
                  setStatusAction={setStatusAction}
                  canChange={role === "admin" || role === "hospital"}
                />
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="lg:col-span-3 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              <X size={16} /> Cancel
            </button>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-60">
              <Save size={16} /> {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusRow({ current, statusAction, setStatusAction, canChange }) {
  if (!canChange) {
    return (
      <div className="inline-flex items-center gap-2 text-sm">
        <StatusChip value={current} />
        <span className="text-gray-500">(only hospital/admin can change)</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm">Current:</div>
      <StatusChip value={current} />
      <div className="text-sm ml-3">Change to:</div>
      <select
        value={statusAction}
        onChange={(e) => setStatusAction(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">— no change —</option>
        <option value="Confirmed">Confirmed</option>
        <option value="Rejected">Rejected</option>
      </select>
    </div>
  );
}

/* Helpers */
function toLocalDate(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
