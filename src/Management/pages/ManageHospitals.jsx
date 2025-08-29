// src/Management/pages/ManageHospitals.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Plus,
  RotateCw,
  Search,
  X,
  Trash2,
  Image as ImageIcon,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000";

function StatusPill({ value }) {
  const active = String(value || "").toLowerCase() === "active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
          : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
      }`}
    >
      {active ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function StatusDot({ state }) {
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

// Convert File -> dataURL (base64)
const fileToDataURL = (file) =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

export default function ManageHospitals() {
  const { authFetch } = useAuth();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(""); // "", "Active", "Inactive"
  const [district, setDistrict] = useState(""); // optional free text
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [apiOnline, setApiOnline] = useState(null);
  const [error, setError] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchHospitals = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (status) params.set("status", status);
      if (district) params.set("district", district);
      params.set("page", page);
      params.set("limit", limit);

      const res = await authFetch(`${API_BASE}/api/hospital?${params.toString()}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setApiOnline(false);
        throw new Error(d.message || "Failed to load hospitals");
      }
      const data = await res.json();
      setApiOnline(true);
      setItems(data.hospitals || []);
      setTotal(Number(data.total || 0));
    } catch (e) {
      setError(e.message || "Failed to load");
      setItems([]);
      setTotal(0);
      setApiOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const onDelete = async (id) => {
    try {
      const res = await authFetch(`${API_BASE}/api/hospital/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to delete hospital");
      }
      toast.success("Hospital deleted");
      await fetchHospitals();
    } catch (e) {
      toast.error(e.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const onToggleStatus = async (h) => {
    // This requires PATCH /api/hospital/:id on the backend.
    // If your route is not enabled yet, this will 404 and show a friendly tip.
    const next = h.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await authFetch(`${API_BASE}/api/hospital/${h._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (res.status === 404 || res.status === 405) {
          toast.error("Update route not enabled on backend (PATCH /api/hospital/:id)");
          return;
        }
        throw new Error(d.message || "Failed to update status");
      }
      toast.success(`Status set to ${next}`);
      await fetchHospitals();
    } catch (e) {
      toast.error(e.message || "Update failed");
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Building2 size={18} /> Manage Hospitals
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
            <StatusDot state={apiOnline} />
            <span className="text-gray-400">•</span>
            <code className="rounded bg-gray-50 px-1.5 py-0.5">/api/hospital</code>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpenAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black"
          >
            <Plus size={16} /> Add Hospital
          </button>
          <button
            onClick={fetchHospitals}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RotateCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={16} />
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (setPage(1), fetchHospitals())}
              placeholder="Search by name or district"
              className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-gray-900"
            />
          </div>
          <select
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="flex gap-2">
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Filter by district"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-900"
            />
            <button
              onClick={() => {
                setPage(1);
                fetchHospitals();
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="space-y-2">
            <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-2/3 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">No hospitals found.</p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2">Logo</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">District</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Code</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((h) => {
                  const src =
                    h?.logo?.data && h?.logo?.mimeType
                      ? `data:${h.logo.mimeType};base64,${h.logo.data}`
                      : null;
                  return (
                    <tr key={h._id} className="border-t">
                      <td className="py-2">
                        {src ? (
                          <img
                            src={src}
                            alt={`${h.name} logo`}
                            className="h-8 w-8 rounded-md object-cover ring-1 ring-gray-200"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 ring-1 ring-gray-200">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </td>
                      <td className="py-2">{h.name}</td>
                      <td className="py-2">{h.district}</td>
                      <td className="py-2">
                        <StatusPill value={h.status} />
                      </td>
                      <td className="py-2 text-xs text-gray-600">{h.hospitalCode}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onToggleStatus(h)}
                            className="text-xs rounded-md border px-2 py-1 hover:bg-gray-50"
                          >
                            {h.status === "Active" ? "Disable" : "Enable"}
                          </button>
                          <button
                            onClick={() => setDeletingId(h._id)}
                            className="text-xs inline-flex items-center gap-1 rounded-md border px-2 py-1 hover:bg-gray-50 text-rose-600"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
              <div>
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  className="rounded-lg border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add Modal */}
      {openAdd && (
        <AddHospitalModal
          onClose={() => setOpenAdd(false)}
          onSaved={() => {
            setOpenAdd(false);
            fetchHospitals();
          }}
          authFetch={authFetch}
        />
      )}

      {/* Delete confirm */}
      {deletingId && (
        <ConfirmDeleteModal
          onCancel={() => setDeletingId(null)}
          onConfirm={() => onDelete(deletingId)}
        />
      )}
    </div>
  );
}

/* ===========================
   Add Hospital Modal
   =========================== */
function AddHospitalModal({ onClose, onSaved, authFetch }) {
  const [name, setName] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState("Active");

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const onPickLogo = async (file) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
      toast.error("Logo must be PNG or JPG");
      return;
    }
    if (file.size > 1024 * 1024) {
      toast.error("Logo too large (max 1MB)");
      return;
    }
    const dataURL = await fileToDataURL(file); // data:<mime>;base64,AAA...
    setLogoFile({ file, dataURL });
    setLogoPreview(dataURL);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !district || !email || !password) {
      toast.error("Please fill name, district, email & password");
      return;
    }

    const payload = {
      name,
      district,
      address,
      email,
      password,
      phone,
      status,
    };

    if (logoFile?.dataURL) {
      payload.logoBase64 = logoFile.dataURL; // backend normalizes dataURL OK
      payload.logoMimeType = logoFile.file.type;
    }

    setBusy(true);
    try {
      const res = await authFetch(`${API_BASE}/api/hospital`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to create hospital");
      }
      toast.success("Hospital created");
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 size={18} />
            <h3 className="font-semibold">Add Hospital</h3>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Left: logo uploader */}
          <div className="md:col-span-1">
            <div className="rounded-xl border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center gap-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-20 w-20 rounded-md object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="h-20 w-20 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 ring-1 ring-gray-200">
                  <ImageIcon size={20} />
                </div>
              )}

              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs hover:bg-gray-50 cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
                />
                Upload Logo
              </label>

              <p className="text-[11px] text-gray-500 text-center">
                PNG/JPG • Max 1MB • Stored as Base64
              </p>
            </div>
          </div>

          {/* Right: form fields */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Optional"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>
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
                {busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </form>

        {/* Little warning for backend constraints */}
        <div className="px-4 pb-4">
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <p>
              Password is required on create. Logo is stored as Base64. Hospital code is generated
              by backend (SL/MOH/HOSxxxxxx).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   Confirm Delete Modal
   =========================== */
function ConfirmDeleteModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold">Delete Hospital</h3>
        </div>
        <div className="p-4 text-sm">
          This action cannot be undone. Are you sure you want to delete this hospital?
        </div>
        <div className="p-4 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-3 py-2 text-sm hover:bg-rose-700"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
