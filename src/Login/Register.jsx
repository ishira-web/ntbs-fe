// src/Register/Register.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Home,
  Droplet,
  Weight,
  Shield,
  Hospital as HospitalIcon,
  ClipboardCheck,
  Syringe,
  Pill,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// If you're using Vite's /public folder, you can also do: const BG = "/register.jpg";
import BG from "../../public/login.jpg"; // replace with "../../public/register.jpg" if you have a separate image

const API_BASE = "http://localhost:5000";
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = ["male", "female", "other"];

export default function Register() {
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);

  // form state
  const [form, setForm] = useState({
    name: "",
    nic: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    weightKg: "",
    addressLine1: "",
    city: "",
    district: "",
    nearestHospitalId: "",
    lastDonationDate: "",
    chronicIllness: false,
    medications: "",
    recentTattooMonths: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // fetch hospitals (public GET in your router)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/hospital?status=Active&limit=1000`);
        if (!res.ok) throw new Error("Failed to load hospitals");
        const data = await res.json();
        if (!alive) return;
        setHospitals(data.hospitals || []);
      } catch (e) {
        toast.error(e.message || "Could not load hospitals");
      } finally {
        if (alive) setLoadingHospitals(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    const f = form;
    // same required as your controller
    return (
      f.name &&
      f.nic &&
      f.email &&
      f.phone &&
      f.password &&
      f.dateOfBirth &&
      f.gender &&
      f.bloodGroup &&
      f.district &&
      f.nearestHospitalId &&
      Number(f.weightKg) >= 40
    );
  }, [form]);

  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please fill all required fields (weight ≥ 40kg).");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        nic: String(form.nic).toUpperCase().trim(),
        email: String(form.email).toLowerCase().trim(),
        weightKg: Number(form.weightKg),
        recentTattooMonths: Number(form.recentTattooMonths || 0),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        lastDonationDate: form.lastDonationDate
          ? new Date(form.lastDonationDate).toISOString()
          : null,
      };

      const res = await fetch(`${API_BASE}/api/donor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || "Registration failed");
      }
      toast.success("Registered! Await hospital confirmation.");

      // Clear form
      setForm({
        name: "",
        nic: "",
        email: "",
        phone: "",
        password: "",
        dateOfBirth: "",
        gender: "",
        bloodGroup: "",
        weightKg: "",
        addressLine1: "",
        city: "",
        district: "",
        nearestHospitalId: "",
        lastDonationDate: "",
        chronicIllness: false,
        medications: "",
        recentTattooMonths: 0,
      });
    } catch (e) {
      toast.error(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const bg = BG || "/login.jpg"; // fallback

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* Black overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white/90 backdrop-blur-xl shadow-xl">
            {/* header */}
            <div className="px-8 pt-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white">
                <Shield size={20} />
              </div>
              <h1 className="text-2xl font-semibold text-gray-900">Donor Registration</h1>
              <p className="mt-1 text-sm text-gray-600">
                Create your donor profile. Your status will be <strong>Pending</strong> until your
                nearest hospital confirms.
              </p>
            </div>

            {/* form */}
            <form onSubmit={handleSubmit} className="px-8 pb-8 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal */}
                <Field label="Full Name" icon={<User size={16} />}>
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    className="input"
                    placeholder="John Doe"
                    required
                  />
                </Field>
                <Field label="NIC" icon={<ClipboardCheck size={16} />}>
                  <input
                    value={form.nic}
                    onChange={(e) => update("nic", e.target.value)}
                    className="input uppercase"
                    placeholder="NIC / National ID"
                    required
                  />
                </Field>

                <Field label="Email" icon={<Mail size={16} />}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    className="input"
                    placeholder="you@example.com"
                    required
                  />
                </Field>
                <Field label="Phone" icon={<Phone size={16} />}>
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    className="input"
                    placeholder="+94 77 123 4567"
                    required
                  />
                </Field>

                <Field label="Password" icon={<Shield size={16} />}>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    required
                  />
                </Field>
                <Field label="Date of Birth" icon={<Calendar size={16} />}>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => update("dateOfBirth", e.target.value)}
                    className="input"
                    required
                  />
                </Field>

                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => update("gender", e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Blood Group" icon={<Droplet size={16} />}>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => update("bloodGroup", e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select group</option>
                    {BLOOD_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Weight (kg)" icon={<Weight size={16} />}>
                  <input
                    type="number"
                    min={40}
                    step={1}
                    value={form.weightKg}
                    onChange={(e) => update("weightKg", e.target.value)}
                    className="input"
                    placeholder="≥ 40"
                    required
                  />
                </Field>
                <Field label="District" icon={<MapPin size={16} />}>
                  <input
                    value={form.district}
                    onChange={(e) => update("district", e.target.value)}
                    className="input"
                    placeholder="Colombo"
                    required
                  />
                </Field>

                <Field label="Address" icon={<Home size={16} />}>
                  <input
                    value={form.addressLine1}
                    onChange={(e) => update("addressLine1", e.target.value)}
                    className="input"
                    placeholder="Street, block, etc."
                  />
                </Field>
                <Field label="City" icon={<MapPin size={16} />}>
                  <input
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    className="input"
                    placeholder="City"
                  />
                </Field>

                {/* Hospital */}
                <Field label="Nearest Hospital" icon={<HospitalIcon size={16} />}>
                  <select
                    value={form.nearestHospitalId}
                    onChange={(e) => update("nearestHospitalId", e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">
                      {loadingHospitals ? "Loading hospitals..." : "Select hospital"}
                    </option>
                    {hospitals.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.name} — {h.district}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Medical */}
                <Field label="Last Donation Date (optional)" icon={<Syringe size={16} />}>
                  <input
                    type="date"
                    value={form.lastDonationDate}
                    onChange={(e) => update("lastDonationDate", e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Recent Tattoo (months)" icon={<ClipboardCheck size={16} />}>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.recentTattooMonths}
                    onChange={(e) => update("recentTattooMonths", e.target.value)}
                    className="input"
                    placeholder="0"
                  />
                </Field>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.chronicIllness}
                      onChange={(e) => update("chronicIllness", e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    I have a chronic illness
                  </label>
                  <div className="relative">
                    <div className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Pill size={16} /> Medications (optional)
                    </div>
                    <input
                      value={form.medications}
                      onChange={(e) => update("medications", e.target.value)}
                      className="input"
                      placeholder="List current meds if any"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  Your registration will be marked <b>Pending</b> until confirmed by the selected
                  hospital.
                </p>
                <button
                  type="submit"
                  disabled={submitting || !canSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-medium shadow hover:bg-black disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {submitting ? "Submitting..." : "Register"}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-white/90 drop-shadow">
            Already have an account? <a href="/login" className="underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- tiny presentational component ---------- */
function Field({ label, icon, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>
        ) : null}
        {React.cloneElement(children, {
          className:
            (children.props.className || "") +
            ` ${icon ? "pl-9" : ""} w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-gray-900`,
        })}
      </div>
    </div>
  );
}
