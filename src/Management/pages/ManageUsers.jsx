import React, { useEffect, useMemo, useState } from "react";
import {
  Users2,
  Plus,
  RotateCw,
  Search,
  X,
  Save,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

// --- Config ---
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 10;
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other"];
const CONFIRM_STATUSES = ["Pending", "Confirmed", "Rejected"];

function StatusChip({ value }) {
  const palette = {
    Pending: "bg-amber-100 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  };
  const cls = palette[value] || palette.Pending;
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

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [district, setDistrict] = useState("");

  const [editing, setEditing] = useState(null); // donor dto

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

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Users2 size={18} /> Manage Donors
        </h1>
        <div className="flex items-center gap-2">
          {/* Keep an Add button here if you want donor creation from admin panel */}
          {/* <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black">
            <Plus size={16} /> New Donor
          </button> */}
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
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2 flex items-center border rounded-lg px-2">
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
              {CONFIRM_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
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
                <option key={g} value={g}>
                  {g}
                </option>
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
                setQ("");
                setStatus("");
                setBloodGroup("");
                setDistrict("");
                load(1);
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
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </div>
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
                    <td className="py-2">
                      <StatusChip value={r.confirmation?.status || "Pending"} />
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1"
                          onClick={() => setEditing(r)}
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50 inline-flex items-center gap-1 text-rose-600"
                          onClick={() => del(r)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
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
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => load(page + 1)}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editing && (
        <EditDonorModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load(page);
          }}
          authFetch={authFetch}
        />
      )}
    </div>
  );

  async function del(row) {
    if (!confirm("Delete this donor?")) return;
    try {
      const res = await authFetch(`${API_BASE}/api/donor/${row._id}`, { method: "DELETE" });
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
   Edit Donor Modal (PATCH /api/donors/:id)
   =========================== */
function EditDonorModal({ initial, onClose, onSaved, authFetch }) {
  const [name, setName] = useState(initial.name || "");
  const [nic, setNic] = useState(initial.nic || "");
  const [email, setEmail] = useState(initial.email || "");
  const [phone, setPhone] = useState(initial.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(initial.dateOfBirth ? toDateInput(initial.dateOfBirth) : "");
  const [gender, setGender] = useState(initial.gender || "male");
  const [bloodGroup, setBloodGroup] = useState(initial.bloodGroup || "O+");
  const [weightKg, setWeightKg] = useState(initial.weightKg ?? 60);
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1 || "");
  const [city, setCity] = useState(initial.city || "");
  const [district, setDistrict] = useState(initial.district || "");
  const [nearestHospitalId, setNearestHospitalId] = useState(initial.nearestHospitalId || "");

  // medical
  const [lastDonationDate, setLastDonationDate] = useState(
    initial.medical?.lastDonationDate ? toDateInput(initial.medical.lastDonationDate) : ""
  );
  const [chronicIllness, setChronicIllness] = useState(!!initial.medical?.chronicIllness);
  const [medications, setMedications] = useState(initial.medical?.medications || "");
  const [recentTattooMonths, setRecentTattooMonths] = useState(initial.medical?.recentTattooMonths ?? 0);

  // confirmation
  const [status, setStatus] = useState(initial.confirmation?.status || "Pending");

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name,
        nic,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        gender,
        bloodGroup,
        weightKg: Number(weightKg) || 0,
        addressLine1,
        city,
        district,
        nearestHospitalId: nearestHospitalId || undefined,
        medical: {
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate).toISOString() : null,
          chronicIllness,
          medications,
          recentTattooMonths: Number(recentTattooMonths) || 0,
        },
        confirmation: { status },
      };

      const res = await authFetch(`${API_BASE}/api/donor/${initial._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Update failed");
      }
      toast.success("Donor updated");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2"><Users2 size={18} /><h3 className="font-semibold">Edit Donor</h3></div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NIC</label>
              <input value={nic} onChange={(e) => setNic(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {GENDERS.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
            <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {BLOOD_GROUPS.map((g) => (<option key={g} value={g}>{g}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input type="number" min={0} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nearest Hospital ID</label>
            <input value={nearestHospitalId} onChange={(e) => setNearestHospitalId(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
              {CONFIRM_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
            <p className="mt-1 text-[11px] text-gray-500">Only hospital/admin can change this. The API enforces it.</p>
          </div>

          <div className="md:col-span-2 border-t pt-4">
            <h4 className="text-sm font-medium mb-2">Medical</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Donation</label>
                <input type="date" value={lastDonationDate} onChange={(e) => setLastDonationDate(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
              <label className="inline-flex items-center gap-2 mt-7">
                <input type="checkbox" checked={chronicIllness} onChange={(e) => setChronicIllness(e.target.checked)} />
                <span className="text-sm">Chronic Illness</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tattoo (months)</label>
                <input type="number" min={0} value={recentTattooMonths} onChange={(e) => setRecentTattooMonths(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2 md:col-start-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Medications</label>
                <textarea rows={2} value={medications} onChange={(e) => setMedications(e.target.value)} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              Cancel
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

function toDateInput(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
