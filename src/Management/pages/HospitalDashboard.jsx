import React, { useEffect, useMemo, useState } from "react";
import { Droplet, CalendarCheck2, Megaphone, RotateCw, AlertCircle } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const fmt = new Intl.NumberFormat();

const Stat = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3">
      <div className="rounded-xl p-2 bg-gray-100">
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-xl font-semibold">{value}</div>
      </div>
    </div>
    {sub && <div className="mt-3 text-xs text-gray-500">{sub}</div>}
  </div>
);

function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function SafeBar({ data, options, emptyLabel = "No data to display" }) {
  const hasData =
    Array.isArray(data?.datasets) &&
    data.datasets.some((d) => (d.data || []).some((v) => Number(v) > 0));
  if (!hasData) return <EmptyChart label={emptyLabel} />;
  return (
    <div className="h-72">
      <Bar data={data} options={options} />
    </div>
  );
}

function SafeDoughnut({ data, emptyLabel = "No data to display" }) {
  const hasData = Array.isArray(data?.datasets) && data.datasets[0]?.data?.some((v) => Number(v) > 0);
  if (!hasData) return <EmptyChart label={emptyLabel} />;
  return (
    <div className="h-72">
      <Doughnut data={data} />
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-gray-500">
      {label}
    </div>
  );
}

export default function HospitalDashboard() {
  const { role, user, authFetch } = useAuth();

  const [hospitalName, setHospitalName] = useState("");
  const [summary, setSummary] = useState(null); // API payload
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // friendly greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  const findHospitalId = () => {
    const localUser =
      user ||
      (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return localUser?.hospitalId || localUser?.id || localUser?._id || null;
  };

  const load = async () => {
    setError("");
    setLoading(true);
    try {
      const localUser =
        user ||
        (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);

      const hospitalId = findHospitalId();
      if (!hospitalId) throw new Error("Missing hospital id");

      // Try both common endpoints to be robust: /api/hospitals/:id then /api/hospital/:id
      let name = "";
      try {
        const res1 = await authFetch(`${API_BASE}/api/hospitals/${hospitalId}`);
        if (res1.ok) {
          const d = await res1.json();
          name = d?.hospital?.name || d?.name || "";
        } else {
          const res2 = await authFetch(`${API_BASE}/api/hospital/${hospitalId}`);
          if (res2.ok) {
            const d2 = await res2.json();
            name = d2?.hospital?.name || d2?.name || "";
          }
        }
      } catch {
        // ignore fetch error here; fall back to local
      }
      if (!name) {
        name =
          localUser?.hospitalName ||
          localUser?.name ||
          (localUser?.email ? localUser.email.split("@")[0] : "");
      }
      setHospitalName(name);

      // Stock summary
      const sRes = await authFetch(`${API_BASE}/api/bloodstock/summary?hospitalId=${hospitalId}`);
      if (!sRes.ok) {
        const d = await sRes.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load summary");
      }
      const sData = await sRes.json();
      setSummary(sData);
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
      // Provide a safe empty summary for charts
      setSummary({
        totalUnits: 0,
        byGroup: [],
        byComponent: [],
        matrix: [],
        expiringSoon: { days: 7, totalUnits: 0, byGroup: [], byComponent: [] },
        expired: { totalUnits: 0, byGroup: [], byComponent: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "hospital") load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, user]);

  // ==== CHART DATA ====
  const unitsByGroup = useMemo(() => {
    const map = new Map(summary?.byGroup?.map((x) => [x.bloodGroup, x.units]) || []);
    return GROUPS.map((g) => map.get(g) || 0);
  }, [summary]);

  const unitsByComponent = useMemo(() => {
    const list = summary?.byComponent || [];
    return {
      labels: list.map((x) => x.component),
      data: list.map((x) => x.units),
    };
  }, [summary]);

  const expSoonByGroup = useMemo(() => {
    const map = new Map(summary?.expiringSoon?.byGroup?.map((x) => [x.bloodGroup, x.units]) || []);
    return GROUPS.map((g) => map.get(g) || 0);
  }, [summary]);

  const expiredByGroup = useMemo(() => {
    const map = new Map(summary?.expired?.byGroup?.map((x) => [x.bloodGroup, x.units]) || []);
    return GROUPS.map((g) => map.get(g) || 0);
  }, [summary]);

  // Chart configs
  const barByGroupData = useMemo(
    () => ({
      labels: GROUPS,
      datasets: [
        {
          label: "Units",
          data: unitsByGroup,
          backgroundColor: "rgba(17,24,39,0.9)", // gray-900
          borderRadius: 8,
        },
      ],
    }),
    [unitsByGroup]
  );

  const doughnutByComponentData = useMemo(
    () => ({
      labels: unitsByComponent.labels,
      datasets: [
        {
          label: "Units",
          data: unitsByComponent.data,
          backgroundColor: [
            "rgba(17,24,39,0.9)",
            "rgba(31,41,55,0.9)",
            "rgba(55,65,81,0.9)",
            "rgba(75,85,99,0.9)",
            "rgba(107,114,128,0.9)",
          ],
        },
      ],
    }),
    [unitsByComponent]
  );

  const expVsExpiredData = useMemo(
    () => ({
      labels: GROUPS,
      datasets: [
        {
          label: `Expiring Soon (≤ ${summary?.expiringSoon?.days || 7}d)`,
          data: expSoonByGroup,
          backgroundColor: "rgba(234, 179, 8, 0.9)", // amber-400-ish
          borderRadius: 8,
        },
        {
          label: "Expired",
          data: expiredByGroup,
          backgroundColor: "rgba(239, 68, 68, 0.9)", // red-500-ish
          borderRadius: 8,
        },
      ],
    }),
    [expSoonByGroup, expiredByGroup, summary?.expiringSoon?.days]
  );

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const groupedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">
            {greeting}
            {hospitalName ? `, ${hospitalName}` : ""} 👋
          </h1>
          <p className="text-sm text-gray-600">Hospital Dashboard</p>
          {loading && <p className="mt-1 text-xs text-gray-500">Loading hospital & stock…</p>}
          {error && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      {/* Top stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          icon={Droplet}
          label="Units in Stock"
          value={fmt.format(summary?.totalUnits ?? 0)}
          sub="Your hospital only"
        />
        <Stat
          icon={CalendarCheck2}
          label="Appointments Today"
          value="—"
          sub="Hook up to requests/appointments API"
        />
        <Stat
          icon={Megaphone}
          label="Active Campaigns"
          value="—"
          sub="Hook up to /api/camps?status=ongoing"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Units by Blood Group">
          <SafeBar data={barByGroupData} options={barOptions} />
        </Card>

        <Card title="Units by Component">
          <SafeDoughnut data={doughnutByComponentData} />
        </Card>
      </section>

      {/* Expiring soon vs Expired (grouped bar) */}
      <section className="grid grid-cols-1 gap-6">
        <Card
          title="Expiring Soon vs Expired by Group"
          right={
            <span className="text-xs text-gray-500">
              Window: ≤ {summary?.expiringSoon?.days || 7} days
            </span>
          }
        >
          <SafeBar data={expVsExpiredData} options={groupedOptions} />
        </Card>
      </section>
    </div>
  );
}
