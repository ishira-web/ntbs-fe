import React, { useEffect, useMemo, useState } from "react";
import {
  User2,
  Mail,
  Phone,
  Calendar,
  Droplet,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  RotateCw,
  ClipboardCopy,
  ChevronRight,
  Camera,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  Edit3,
  Heart,
  Activity,
  Scale,
  Pill,
  FileText
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* ---------- Small UI helpers ---------- */

const StatusChip = ({ value }) => {
  const palette = {
    Pending: "bg-blue-100 text-blue-800 border-blue-200",
    Confirmed: "bg-green-100 text-green-800 border-green-200",
    Rejected: "bg-red-100 text-red-800 border-red-200",
  };
  const icon =
    value === "Confirmed" ? (
      <ShieldCheck size={14} />
    ) : value === "Rejected" ? (
      <ShieldAlert size={14} />
    ) : (
      <Calendar size={14} />
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${palette[value] || palette.Pending} transition-colors duration-200`}
      title={`Status: ${value}`}
    >
      {icon}
      {value}
    </span>
  );
};

const Skeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-gray-200 animate-pulse"></div>
      <div className="space-y-2">
        <div className="h-6 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-4 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
      ))}
    </div>
  </div>
);

function InfoRow({ icon: Icon, label, value, right, className = "" }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</div>
          <div className="text-sm font-medium text-gray-900">{value ?? "—"}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

function Avatar({ name, avatar, size = "lg" }) {
  const initials = useMemo(() => {
    if (!name) return "DN";
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [name]);

  const sizeClasses = {
    sm: "h-12 w-12 text-base",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-xl",
    xl: "h-24 w-24 text-2xl"
  };

  return (
    <div className="relative group">
      {avatar ? (
        <img
          src={avatar}
          alt="avatar"
          className={`rounded-2xl object-cover border-2 border-white shadow-lg ${sizeClasses[size]}`}
        />
      ) : (
        <div className={`rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-lg ${sizeClasses[size]}`}>
          {initials.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return "—";
  }
}

function formatDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "—";
  }
}

function calcAge(dob) {
  if (!dob) return null;
  try {
    const d = new Date(dob);
    const diff = Date.now() - d.getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return age;
  } catch {
    return null;
  }
}

/* ---------- Convert file -> base64 data URL ---------- */
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

/* =========================================================================================
   Page
   ========================================================================================= */
export default function ProfilePage() {
  const { id: paramId } = useParams();
  const { user, authFetch } = useAuth();

  const donorId = paramId || user?._id || user?.id || null;

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [donor, setDonor] = useState(null);
  const [hospitalName, setHospitalName] = useState("");
  const [openEdit, setOpenEdit] = useState(false);

  const load = async () => {
    if (!donorId) {
      setErr("Donor id missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      // 1) donor
      const res = await authFetch(`${API_BASE}/api/donor/${donorId}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load donor");
      }
      const j = await res.json();
      setDonor(j.donor);

      // 2) nearest hospital name (optional)
      if (j?.donor?.nearestHospitalId) {
        const tryEndpoints = [
          `${API_BASE}/api/hospital/${j.donor.nearestHospitalId}`,
          `${API_BASE}/api/hospitals/${j.donor.nearestHospitalId}`,
        ];
        let name = "";
        for (const url of tryEndpoints) {
          const r = await authFetch(url);
          if (r.ok) {
            const h = await r.json().catch(() => ({}));
            name =
              h?.hospital?.name ||
              h?.data?.name ||
              h?.name ||
              h?.hospital?.hospitalName ||
              h?.hospitalName ||
              "";
            if (name) break;
          }
        }
        setHospitalName(name);
      } else {
        setHospitalName("");
      }
    } catch (e) {
      setErr(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [donorId]);

  const copy = async (text, label = "Copied") => {
    try {
      await navigator.clipboard.writeText(String(text));
      toast.success(label, { icon: <CheckCircle size={16} /> });
    } catch {
      toast.error("Copy failed", { icon: <AlertCircle size={16} /> });
    }
  };

  const age = calcAge(donor?.dateOfBirth);
  const status = donor?.confirmation?.status || "Pending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-50 p-4 md:p-8">
      {/* Toaster for notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            className: "bg-green-50 text-green-800 border border-green-200 rounded-xl p-4 flex items-center gap-2",
            iconTheme: {
              primary: '#10B981',
              secondary: 'white',
            },
          },
          error: {
            className: "bg-red-50 text-red-800 border border-red-200 rounded-xl p-4 flex items-center gap-2",
            iconTheme: {
              primary: '#EF4444',
              secondary: 'white',
            },
          },
        }}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <Avatar name={donor?.name} avatar={donor?.avatar} size="xl" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {donor?.name || "My Profile"}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                <StatusChip value={status} />
                <span className="text-sm text-gray-500">Last updated {formatDateTime(donor?.updatedAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto mt-4 sm:mt-0">
            <button
              onClick={() => setOpenEdit(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm"
              aria-label="Edit profile"
            >
              <Edit3 size={16} /> Edit Profile
            </button>
            <button
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm disabled:opacity-60"
              aria-label="Refresh profile"
            >
              <RotateCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : err ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 flex items-center gap-3">
            <AlertCircle size={20} />
            <div>
              <h3 className="font-medium">Error loading profile</h3>
              <p className="text-sm">{err}</p>
            </div>
          </div>
        ) : !donor ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">No profile found.</p>
          </div>
        ) : (
          <>
            {/* Personal Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal Info Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User2 size={18} className="text-blue-600" />
                  Personal Information
                </h2>
                <div className="space-y-3">
                  <InfoRow
                    icon={User2}
                    label="Full Name"
                    value={donor.name}
                    right={
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => copy(donor.name)}
                        title="Copy"
                        aria-label="Copy full name"
                      >
                        <ClipboardCopy size={16} className="text-gray-500" />
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={donor.email}
                    right={
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => copy(donor.email)}
                        title="Copy"
                        aria-label="Copy email"
                      >
                        <ClipboardCopy size={16} className="text-gray-500" />
                      </button>
                    }
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={donor.phone}
                    right={
                      <button
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        onClick={() => copy(donor.phone)}
                        title="Copy"
                        aria-label="Copy phone number"
                      >
                        <ClipboardCopy size={16} className="text-gray-500" />
                      </button>
                    }
                  />
                </div>
              </div>

              {/* Blood & Health Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart size={18} className="text-red-600" />
                  Blood & Health
                </h2>
                <div className="space-y-3">
                  <InfoRow icon={Droplet} label="Blood Group" value={donor.bloodGroup} />
                  <InfoRow 
                    icon={Calendar} 
                    label="Date of Birth" 
                    value={`${formatDate(donor.dateOfBirth)}${age !== null ? ` • ${age} yrs` : ""}`} 
                  />
                  <InfoRow icon={Scale} label="Weight" value={donor.weightKg ? `${donor.weightKg} kg` : "—"} />
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-green-600" />
                  Location
                </h2>
                <div className="space-y-3">
                  <InfoRow icon={MapPin} label="Nearest Hospital" value={hospitalName || String(donor.nearestHospitalId)} />
                  <InfoRow icon={MapPin} label="Address" value={donor.addressLine1 || "—"} />
                  <InfoRow icon={MapPin} label="City/District" value={donor.city && donor.district ? `${donor.city}, ${donor.district}` : (donor.city || donor.district || "—")} />
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-purple-600" />
                Medical Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoRow
                  icon={Calendar}
                  label="Last Donation Date"
                  value={
                    donor.medical?.lastDonationDate
                      ? formatDate(donor.medical.lastDonationDate)
                      : "—"
                  }
                />
                <InfoRow
                  icon={ShieldAlert}
                  label="Chronic Illness"
                  value={donor.medical?.chronicIllness ? "Yes" : "No"}
                />
                <InfoRow
                  icon={Pill}
                  label="Medications"
                  value={donor.medical?.medications || "—"}
                />
                <InfoRow
                  icon={FileText}
                  label="Recent Tattoo (months)"
                  value={
                    donor.medical?.recentTattooMonths != null
                      ? String(donor.medical.recentTattooMonths)
                      : "—"
                  }
                />
              </div>
              <p className="mt-6 text-sm text-gray-500 flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <ChevronRight size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                For medical eligibility or scheduling your next donation, please consult your nearest hospital. This page only displays the information on file.
              </p>
            </div>

            {/* Meta */}
            <div className="text-xs text-gray-500 text-center py-4">
              Profile created {formatDateTime(donor?.createdAt)}
            </div>
          </>
        )}

        {/* Edit modal */}
        {openEdit && donor && (
          <EditProfileModal
            donor={donor}
            onClose={() => setOpenEdit(false)}
            onSaved={(updated) => {
              setOpenEdit(false);
              setDonor(updated);
              toast.success("Profile updated successfully");
            }}
            authFetch={authFetch}
          />
        )}
      </div>
    </div>
  );
}

/* =========================================================================================
   EditProfileModal
   ========================================================================================= */
function EditProfileModal({ donor, onClose, onSaved, authFetch }) {
  // Basic
  const [name, setName] = useState(donor.name || "");
  const [email, setEmail] = useState(donor.email || "");
  const [phone, setPhone] = useState(donor.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(donor.dateOfBirth ? toLocalDate(donor.dateOfBirth) : "");
  const [bloodGroup, setBloodGroup] = useState(donor.bloodGroup || "");
  const [weightKg, setWeightKg] = useState(donor.weightKg ?? 0);

  // Address
  const [addressLine1, setAddressLine1] = useState(donor.addressLine1 || "");
  const [city, setCity] = useState(donor.city || "");
  const [district, setDistrict] = useState(donor.district || "");

  // Medical
  const [lastDonationDate, setLastDonationDate] = useState(
    donor.medical?.lastDonationDate ? toLocalDate(donor.medical.lastDonationDate) : ""
  );
  const [chronicIllness, setChronicIllness] = useState(!!donor.medical?.chronicIllness);
  const [medications, setMedications] = useState(donor.medical?.medications || "");
  const [recentTattooMonths, setRecentTattooMonths] = useState(
    donor.medical?.recentTattooMonths ?? 0
  );

  // Avatar
  const [avatar, setAvatar] = useState(donor.avatar || "");
  const [busy, setBusy] = useState(false);

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      toast.error("Please choose an image (jpg, png, webp, gif)");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max image size is 2MB");
      return;
    }
    try {
      const dataUrl = await fileToDataURL(file);
      setAvatar(String(dataUrl));
    } catch {
      toast.error("Failed to load image");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        bloodGroup,
        weightKg: Number(weightKg) || 0,
        addressLine1,
        city,
        district,
        medical: {
          lastDonationDate: lastDonationDate ? new Date(lastDonationDate).toISOString() : null,
          chronicIllness: !!chronicIllness,
          medications,
          recentTattooMonths: Number(recentTattooMonths) || 0,
        },
        avatar,
      };

      const res = await authFetch(`${API_BASE}/api/donor/${donor._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Update failed");
      }
      const j = await res.json();
      onSaved?.(j.donor);
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <User2 size={20} className="text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Avatar uploader */}
          <div className="flex items-center gap-4">
            {avatar ? (
              <div className="relative">
                <img
                  src={avatar}
                  alt="preview"
                  className="h-20 w-20 rounded-xl object-cover border border-gray-200"
                />
                <button
                  onClick={() => setAvatar("")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  title="Remove avatar"
                  aria-label="Remove avatar"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gray-200 flex items-center justify-center">
                <Camera size={24} className="text-gray-400" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                JPG/PNG/WebP/GIF, up to 2MB.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Personal Information</h4>
              
              <Field label="Full Name">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Enter your full name"
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </Field>
              <Field label="Phone">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="Enter your phone number"
                />
              </Field>
              <Field label="Date of Birth">
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Health Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Health Information</h4>
              
              <Field label="Blood Group">
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  required
                >
                  <option value="">Select blood group</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Weight (kg)">
                <input
                  type="number"
                  min={40}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  required
                  placeholder="Enter your weight"
                />
              </Field>
              <Field label="Last Donation Date">
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={lastDonationDate}
                  onChange={(e) => setLastDonationDate(e.target.value)}
                />
              </Field>
              <Field label="Chronic Illness">
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={chronicIllness ? "yes" : "no"}
                  onChange={(e) => setChronicIllness(e.target.value === "yes")}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Address */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Address</h4>
              
              <Field label="Address Line">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Enter address line"
                />
              </Field>
              <Field label="City">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                />
              </Field>
              <Field label="District">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  placeholder="Enter district"
                />
              </Field>
            </div>

            {/* Medical Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 border-b border-gray-200 pb-2">Medical Details</h4>
              
              <Field label="Medications">
                <input
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="Enter medications (optional)"
                />
              </Field>
              <Field label="Recent Tattoo (months)">
                <input
                  type="number"
                  min={0}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  value={recentTattooMonths}
                  onChange={(e) => setRecentTattooMonths(e.target.value)}
                  placeholder="Enter months since tattoo"
                />
              </Field>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 sticky bottom-0 bg-white py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              aria-label="Cancel changes"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 transition-all"
              aria-label="Save changes"
            >
              <Save size={16} />
              {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Small sub-components ---------- */
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}

function toLocalDate(value) {
  try {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return "";
  }
}