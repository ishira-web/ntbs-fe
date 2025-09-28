// src/Donor/Pages/Hospital.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Search,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertCircle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Droplet,
  CalendarDays,
  X,
  Filter,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 12;
const STATUSES = ["Active", "Inactive"];
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const COMPONENTS = ["WholeBlood", "RBC", "Plasma", "Platelets", "Cryo"];
const SLOTS = [
  { key: "SLOT1", label: "10:00 — 11:30" },
  { key: "SLOT2", label: "12:00 — 13:30" },
];

const StatusPill = ({ value }) => {
  const cls =
    value === "Active"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : "bg-gray-100 text-gray-800 border-gray-200";
  const Icon = value === "Active" ? ShieldCheck : AlertCircle;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${cls}`}>
      <Icon size={14} />
      {value}
    </span>
  );
};

const Avatar = ({ name, logo }) => {
  if (logo?.data && logo?.mimeType) {
    return (
      <img
        src={`data:${logo.mimeType};base64,${logo.data}`}
        alt={name}
        className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm"
      />
    );
  }
  const letter = (name || "?").trim()[0]?.toUpperCase() || "?";
  return (
    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center text-lg font-semibold shadow-sm">
      {letter}
    </div>
  );
};

const HospitalCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm animate-pulse">
    <div className="flex items-start gap-4">
      <div className="h-12 w-12 rounded-xl bg-gray-200"></div>
      <div className="flex-1">
        <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
        <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 w-40 bg-gray-200 rounded mb-3"></div>
        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
      </div>
    </div>
  </div>
);

export default function Hospital() {
  const { authFetch, user, role } = useAuth();

  // robust auth payload handling
  const authUser = useMemo(() => {
    return user || (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
  }, [user]);

  const roleLower = useMemo(
    () => ((role || authUser?.role || "").toString().toLowerCase()),
    [role, authUser]
  );

  const donorIdOfUser = useMemo(() => {
    if (roleLower !== "donor") return null;
    return authUser?.donorId || authUser?._id || authUser?.id || null;
  }, [authUser, roleLower]);

  const hospitalIdOfUser = useMemo(() => {
    if (roleLower !== "hospital") return null;
    return authUser?.hospitalId || authUser?._id || authUser?.id || null;
  }, [authUser, roleLower]);

  // ✅ NEW: Pending donor detection
  const isDonorPending = useMemo(() => {
    if (roleLower !== "donor") return false;
    const s =
      (authUser?.status || authUser?.approvalStatus || authUser?.donorStatus || "")
        .toString()
        .toLowerCase();
    return s === "pending" || s === "awaiting_approval" || s === "inactive";
  }, [roleLower, authUser]);

  // table state
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [district, setDistrict] = useState("");
  const [status, setStatus] = useState("Active");
  const [showFilters, setShowFilters] = useState(false);

  // modals
  const [viewing, setViewing] = useState(null);
  const [requestFor, setRequestFor] = useState(null);
  const [bookFor, setBookFor] = useState(null);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // load hospitals
  const load = async (p = page) => {
    setLoading(true);
    setErr("");
    const build = (base) => {
      const url = new URL(base);
      if (q) url.searchParams.set("q", q);
      if (status) url.searchParams.set("status", status);
      if (district) url.searchParams.set("district", district);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(PAGE_SIZE));
      url.searchParams.set("sort", "-createdAt");
      return url.toString();
    };
    try {
      let res = await authFetch(build(`${API_BASE}/api/hospital`));
      if (!res.ok) res = await authFetch(build(`${API_BASE}/api/hospitals`));
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load hospitals");
      }
      const j = await res.json();
      setRows(j.hospitals || []);
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

  // district hints (optional)
  const districtOptions = useMemo(() => {
    const s = new Set();
    rows.forEach((r) => r?.district && s.add(r.district));
    return Array.from(s).sort();
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 size={24} className="text-blue-600" />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hospitals Directory</h1>
          <span className="text-sm text-gray-600">
            {roleLower === "donor" ? "Book an appointment" :
             roleLower === "hospital" ? "Request blood units" : "Browse & learn"}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search hospitals by name, district, or location..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => load(1)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Search size={16} />
              <span className="hidden sm:inline">Search</span>
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 border border-gray-300 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={`e.g. ${districtOptions[0] || "Colombo"}`}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setQ("");
                  setStatus("Active");
                  setDistrict("");
                  load(1);
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <X size={16} />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hospital Cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {[...Array(6)].map((_, i) => <HospitalCardSkeleton key={i} />)}
          </div>
        ) : err ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading hospitals</h3>
            <p className="text-gray-600 mb-4">{err}</p>
            <button
              onClick={() => load(1)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              <RotateCw size={16} />
              Try Again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Search size={24} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or check back later.</p>
            <button
              onClick={() => {
                setQ("");
                setStatus("Active");
                setDistrict("");
                load(1);
              }}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {rows.map((hospital) => (
                <HospitalCard
                  key={hospital._id}
                  hospital={hospital}
                  onView={() => setViewing(hospital)}
                  onBook={() => {
                    if (isDonorPending) {
                      toast.error("Your donor account is pending approval.");
                      return;
                    }
                    if (roleLower !== "donor" || !donorIdOfUser) {
                      toast.error("Please log in as a donor to book an appointment.");
                      return;
                    }
                    setBookFor(hospital);
                  }}
                  onRequest={() => {
                    if (roleLower !== "hospital" || !hospitalIdOfUser) {
                      toast.error("Please log in as a hospital to create a request.");
                      return;
                    }
                    setRequestFor(hospital);
                  }}
                  canBook={roleLower === "donor" && !!donorIdOfUser && !isDonorPending}
                  canRequest={roleLower === "hospital" && !!hospitalIdOfUser}
                  donorPending={isDonorPending}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * PAGE_SIZE + 1}</span> to{" "}
                <span className="font-medium">{Math.min(page * PAGE_SIZE, total)}</span> of{" "}
                <span className="font-medium">{total}</span> hospitals
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => load(page - 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    const pageNum =
                      page <= 3 ? i + 1 :
                      page >= pages - 2 ? pages - 4 + i :
                      page - 2 + i;
                    return (
                      <button
                        key={i}
                        onClick={() => load(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm ${
                          page === pageNum
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {pages > 5 && <span className="px-2 text-gray-500">…</span>}
                </div>

                <button
                  disabled={page >= pages}
                  onClick={() => load(page + 1)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* View modal */}
      {viewing && <ViewHospitalModal hospital={viewing} onClose={() => setViewing(null)} />}

      {/* Request units (hospital role) */}
      {requestFor && (
        <RequestUnitsModal
          forHospital={requestFor}
          requesterHospitalId={hospitalIdOfUser}
          onClose={() => setRequestFor(null)}
          onSaved={() => {
            setRequestFor(null);
            toast.success("Blood unit request submitted successfully");
          }}
        />
      )}

      {/* Book appointment (donor role) */}
      {bookFor && (
        <BookAppointmentModal
          forHospital={bookFor}
          donorId={donorIdOfUser}
          onClose={() => setBookFor(null)}
          onSaved={() => {
            setBookFor(null);
            toast.success("Appointment requested successfully");
          }}
        />
      )}
    </div>
  );
}

function HospitalCard({ hospital, onView, onRequest, onBook, canRequest, canBook, donorPending }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <Avatar name={hospital.name} logo={hospital.logo} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{hospital.name}</h3>
          <div className="text-sm text-gray-600 mb-1">{hospital.district || "—"}</div>
          <StatusPill value={hospital.status} />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="mr-2 text-gray-500 flex-shrink-0" />
          <span className="truncate">{hospital.address || "Address not specified"}</span>
        </div>
        {hospital.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone size={16} className="mr-2 text-gray-500 flex-shrink-0" />
            <span>{hospital.phone}</span>
          </div>
        )}
        {hospital.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail size={16} className="mr-2 text-gray-500 flex-shrink-0" />
            <span className="truncate">{hospital.email}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onView}
          className="flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          <Eye size={16} />
          View
        </button>

        {canBook ? (
          <button
            onClick={onBook}
            disabled={donorPending}
            title={donorPending ? "Your donor account is pending approval" : "Book an appointment"}
            className={`flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${donorPending
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            <CalendarDays size={16} />
            Book
          </button>
        ) : canRequest ? (
          <button
            onClick={onRequest}
            className="flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            title="Request blood units"
          >
            <Droplet size={16} />
            Request
          </button>
        ) : (
          <button
            onClick={() => toast.error("Please log in to continue.")}
            className="flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

function ViewHospitalModal({ hospital, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={hospital.name} logo={hospital.logo} />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{hospital.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <StatusPill value={hospital.status} />
                {hospital.hospitalCode && (
                  <span className="text-sm text-gray-500">Hospital ID: {hospital.hospitalCode}</span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <DetailItem icon={MapPin} label="District" value={hospital.district} />
          <DetailItem icon={MapPin} label="Address" value={hospital.address} />
          <DetailItem icon={Phone} label="Phone" value={hospital.phone} />
          <DetailItem icon={Mail} label="Email" value={hospital.email} />
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start">
      <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="text-gray-900">{value}</div>
      </div>
    </div>
  );
}

/* -------------------- Request units (hospital role) -------------------- */
function RequestUnitsModal({ forHospital, requesterHospitalId, onClose, onSaved }) {
  const { authFetch, role } = useAuth();
  const roleLower = (role || "").toLowerCase();

  const [bloodGroup, setBloodGroup] = useState("O+");
  const [component, setComponent] = useState("WholeBlood");
  const [units, setUnits] = useState(1);
  const [preferredDate, setPreferredDate] = useState("");
  const [note, setNote] = useState(`Preferred source: ${forHospital.name} (${forHospital._id})`);
  const [busy, setBusy] = useState(false);

  const canRequest = roleLower === "hospital" && requesterHospitalId;

  const submit = async (e) => {
    e.preventDefault();
    if (!canRequest) return toast.error("Login as a hospital to create requests.");
    if (!units || Number(units) < 1) return toast.error("Units must be at least 1");
    setBusy(true);
    try {
      const payload = {
        hospitalId: requesterHospitalId,
        bloodGroup,
        component,
        units: Number(units),
        preferredDate: preferredDate ? new Date(preferredDate).toISOString() : null,
        note,
      };
      const res = await authFetch(`${API_BASE}/api/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to create request");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Request Blood Units</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Requesting from <span className="font-medium">{forHospital.name}</span>
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
                {GROUPS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Component</label>
              <select
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                required
              >
                {COMPONENTS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units Needed</label>
              <input
                type="number"
                min={1}
                step={1}
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <CalendarDays size={14} /> Preferred Date
              </label>
              <input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Any special requirements or notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canRequest || busy}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Droplet size={16} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------- Book appointment (donor role) -------------------- */
function BookAppointmentModal({ forHospital, donorId, onClose, onSaved }) {
  const { authFetch } = useAuth();
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("SLOT1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!donorId) return toast.error("Missing donor id");
    if (!date) return toast.error("Please select a date");
    setBusy(true);
    try {
      const payload = {
        hospitalId: forHospital._id,
        donorId,
        date, // YYYY-MM-DD
        slot,
        note,
      };
      const res = await authFetch(`${API_BASE}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to create appointment");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message || "Booking failed");
    } finally {
      setBusy(false);
    }
  };

  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Book Appointment</h2>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-600 text-sm">
            Booking at <span className="font-medium">{forHospital.name}</span>
          </p>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
            <p className="text-[11px] text-gray-500 mt-1">Appointments are on weekdays only (enforced by backend).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
            <div className="grid grid-cols-2 gap-2">
              {SLOTS.map((s) => (
                <label
                  key={s.key}
                  className={`rounded-xl border px-3 py-2 text-sm cursor-pointer ${
                    slot === s.key ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="slot"
                    value={s.key}
                    checked={slot === s.key}
                    onChange={() => setSlot(s.key)}
                    className="hidden"
                  />
                  <div className="font-medium">{s.label}</div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Any additional info for the hospital…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Booking…
                </>
              ) : (
                <>
                  <CalendarDays size={16} />
                  Book
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
