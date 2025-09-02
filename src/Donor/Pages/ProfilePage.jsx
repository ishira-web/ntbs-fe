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
    <div className="h-8 w-1/3 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse transition-opacity duration-500" />
        ))}
      </div>
    </div>
    <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse transition-opacity duration-500" />
        ))}
      </div>
    </div>
  </div>
);

function InfoRow({ icon: Icon, label, value, right }) {
  return (
    <div className="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 transition-all duration-200">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
          <Icon size={16} className="text-gray-700 dark:text-gray-300" />
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{value ?? "—"}</div>
        </div>
      </div>
      {right}
    </div>
  );
}

function Avatar({ name, avatar }) {
  const initials = useMemo(() => {
    if (!name) return "DN";
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
  }, [name]);

  return (
    <div className="relative group">
      {avatar ? (
        <img
          src={avatar}
          alt="avatar"
          className="h-16 w-16 rounded-2xl object-cover border border-gray-200 dark:border-gray-700 group-hover:scale-105 transition-transform duration-200"
        />
      ) : (
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg font-semibold group-hover:scale-105 transition-transform duration-200">
          {initials.toUpperCase()}
        </div>
      )}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function formatDateTime(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
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
    <div className="p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Toaster for notifications */}
      <Toaster
        toastOptions={{
          success: {
            className: "bg-green-50 text-green-800 rounded-lg p-3 flex items-center gap-2",
          },
          error: {
            className: "bg-red-50 text-red-800 rounded-lg p-3 flex items-center gap-2",
          },
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={donor?.name} avatar={donor?.avatar} />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              My Profile
            </h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <StatusChip value={status} />
              <span className="text-gray-400 dark:text-gray-500">•</span>
              <span>Last updated {formatDateTime(donor?.updatedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setOpenEdit(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 w-full sm:w-auto"
            aria-label="Edit profile"
          >
            <Camera size={16} /> Edit Profile
          </button>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 disabled:opacity-60 w-full sm:w-auto"
            disabled={loading}
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
        <div
          className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300"
          role="alert"
        >
          {err}
        </div>
      ) : !donor ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No profile found.</p>
      ) : (
        <>
          {/* Overview card */}
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoRow
                icon={User2}
                label="Full Name"
                value={donor.name}
                right={
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={() => copy(donor.name)}
                    title="Copy"
                    aria-label="Copy full name"
                  >
                    <ClipboardCopy size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                }
              />
              <InfoRow icon={Droplet} label="Blood Group" value={donor.bloodGroup} />
              <InfoRow
                icon={Calendar}
                label="Date of Birth"
                value={`${formatDate(donor.dateOfBirth)}${age !== null ? `  •  ${age} yrs` : ""}`}
              />
              <InfoRow
                icon={Mail}
                label="Email"
                value={donor.email}
                right={
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={() => copy(donor.email)}
                    title="Copy"
                    aria-label="Copy email"
                  >
                    <ClipboardCopy size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                }
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={donor.phone}
                right={
                  <button
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={() => copy(donor.phone)}
                    title="Copy"
                    aria-label="Copy phone number"
                  >
                    <ClipboardCopy size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                }
              />
              <InfoRow
                icon={MapPin}
                label="Nearest Hospital"
                value={hospitalName || String(donor.nearestHospitalId)}
                right={
                  hospitalName ? (
                    <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                      ID: {String(donor.nearestHospitalId).slice(0, 6)}…
                    </span>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Address & Medical */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Address */}
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <MapPin size={16} /> Address
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow icon={MapPin} label="Address Line" value={donor.addressLine1 || "—"} />
                <InfoRow icon={MapPin} label="City" value={donor.city || "—"} />
                <InfoRow icon={MapPin} label="District" value={donor.district || "—"} />
                <InfoRow icon={Droplet} label="Weight (kg)" value={donor.weightKg ?? "—"} />
              </div>
            </div>

            {/* Medical */}
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-shadow duration-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Droplet size={16} /> Medical
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  icon={ClipboardCopy}
                  label="Medications"
                  value={donor.medical?.medications || "—"}
                />
                <InfoRow
                  icon={ShieldAlert}
                  label="Recent Tattoo (months)"
                  value={
                    donor.medical?.recentTattooMonths != null
                      ? String(donor.medical.recentTattooMonths)
                      : "—"
                  }
                />
              </div>
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <ChevronRight size={14} />
                For medical eligibility or scheduling your next donation, please consult your nearest
                hospital. This page only displays the information on file.
              </p>
            </div>
          </div>

          {/* Meta */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
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
            toast.success("Profile updated", { icon: <CheckCircle size={16} /> });
          }}
          authFetch={authFetch}
        />
      )}
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
      toast.error("Please choose an image (jpg, png, webp, gif)", { icon: <AlertCircle size={16} /> });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Max image size is 2MB", { icon: <AlertCircle size={16} /> });
      return;
    }
    try {
      const dataUrl = await fileToDataURL(file);
      setAvatar(String(dataUrl));
    } catch {
      toast.error("Failed to load image", { icon: <AlertCircle size={16} /> });
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
      toast.error(e.message || "Update failed", { icon: <AlertCircle size={16} /> });
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
      <div className="w-full max-w-4xl rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl transform transition-all duration-300">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <User2 size={18} className="text-gray-700 dark:text-gray-300" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Edit Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Close modal"
          >
            <X size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 grid grid-cols-1 gap-6">
          {/* Avatar uploader */}
          <div className="flex items-center gap-4">
            {avatar ? (
              <div className="relative">
                <img
                  src={avatar}
                  alt="preview"
                  className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => setAvatar("")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors duration-200"
                  title="Remove avatar"
                  aria-label="Remove avatar"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-gray-200 dark:bg-gray-700" />
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={onPickImage}
                className="block text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900 transition-colors duration-200"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG/PNG/WebP/GIF, up to 2MB.
              </p>
            </div>
          </div>

          {/* Basics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </Field>
            <Field label="Phone">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="Enter your phone number"
              />
            </Field>
            <Field label="Date of Birth">
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </Field>
            <Field label="Blood Group">
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
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
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                required
                placeholder="Enter your weight"
              />
            </Field>
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Address Line">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Enter address line"
              />
            </Field>
            <Field label="City">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter city"
              />
            </Field>
            <Field label="District">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                required
                placeholder="Enter district"
              />
            </Field>
          </div>

          {/* Medical */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Last Donation Date">
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={lastDonationDate}
                onChange={(e) => setLastDonationDate(e.target.value)}
              />
            </Field>
            <Field label="Chronic Illness">
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={chronicIllness ? "yes" : "no"}
                onChange={(e) => setChronicIllness(e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            <Field label="Medications">
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                placeholder="Enter medications (optional)"
              />
            </Field>
            <Field label="Recent Tattoo (months)">
              <input
                type="number"
                min={0}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                value={recentTattooMonths}
                onChange={(e) => setRecentTattooMonths(e.target.value)}
                placeholder="Enter months since tattoo"
              />
            </Field>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200"
              aria-label="Cancel changes"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 text-sm hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 transition-all duration-200"
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
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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