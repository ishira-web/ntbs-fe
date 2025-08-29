// src/Management/pages/HospitalDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Droplet, CalendarCheck2, Megaphone } from "lucide-react";
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

const API_BASE = "http://localhost:5000";

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

const GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HospitalDashboard() {
  const { role, user, authFetch } = useAuth();

  const [hospitalName, setHospitalName] = useState("");
  const [summary, setSummary] = useState(null); // API payload
  const [loading, setLoading] = useState(true);

  // friendly greeting
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  // helpers
  const findHospitalId = () => {
    const localUser =
      user ||
      (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
    return localUser?.hospitalId || localUser?.id || localUser?._id || null;
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const localUser =
          user ||
          (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);

        // fetch hospital name
        const hospitalId = findHospitalId();
        if (!hospitalId) throw new Error("Missing hospital id");
        const hRes = await authFetch(`${API_BASE}/api/hospital/${hospitalId}`);
        const hData = hRes.ok ? await hRes.json() : {};
        const name = hData?.hospital?.name || localUser?.hospitalName || localUser?.name || "";
        if (mounted) setHospitalName(name);

        // fetch stock summary
        const sRes = await authFetch(
          `${API_BASE}/api/bloodstock/summary?hospitalId=${hospitalId}`
        );
        if (!sRes.ok) throw new Error("Failed to load summary");
        const sData = await sRes.json();
        if (mounted) setSummary(sData);
      } catch (e) {
        // fallbacks
        const localUser =
          user ||
          (localStorage.getItem("auth_user") ? JSON.parse(localStorage.getItem("auth_user")) : null);
        if (mounted) {
          setHospitalName(
            localUser?.hospitalName ||
              localUser?.name ||
              (localUser?.email ? localUser.email.split("@")[0] : "")
          );
          setSummary({
            totalUnits: 0,
            byGroup: [],
            byComponent: [],
            matrix: [],
            expiringSoon: { days: 7, totalUnits: 0, byGroup: [], byComponent: [] },
            expired: { totalUnits: 0, byGroup: [], byComponent: [] },
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (role === "hospital") load();
    else setLoading(false);

    return () => {
      mounted = false;
    };
  }, [role, user, authFetch]);

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
          // Let Chart.js auto-pick colors if you prefer; below is a subtle palette
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
      <div>
        <h1 className="text-xl font-semibold">
          {greeting}
          {hospitalName ? `, ${hospitalName}` : ""} 👋
        </h1>
        <p className="text-sm text-gray-600">Hospital Dashboard</p>
        {loading && <p className="mt-1 text-xs text-gray-500">Loading hospital & stock…</p>}
      </div>

      {/* Top stats (fake placeholders; wire up if you add APIs) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Stat
          icon={Droplet}
          label="Units in Stock"
          value={summary?.totalUnits ?? "—"}
          sub="Your hospital only"
        />
        <Stat icon={CalendarCheck2} label="Appointments Today" value="24" sub="+2 vs yesterday" />
        <Stat icon={Megaphone} label="Active Campaigns" value="3" sub="Ongoing in your district" />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Units by Blood Group (bar) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Units by Blood Group</h2>
          </div>
          <div className="h-72">
            <Bar data={barByGroupData} options={barOptions} />
          </div>
        </div>

        {/* Units by Component (doughnut) */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Units by Component</h2>
          </div>
          <div className="h-72">
            <Doughnut data={doughnutByComponentData} />
          </div>
        </div>
      </section>

      {/* Expiring soon vs Expired (grouped bar) */}
      <section className="grid grid-cols-1 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">Expiring Soon vs Expired by Group</h2>
            <span className="text-xs text-gray-500">
              Window: ≤ {summary?.expiringSoon?.days || 7} days
            </span>
          </div>
          <div className="h-72">
            <Bar data={expVsExpiredData} options={groupedOptions} />
          </div>
        </div>
      </section>

      {/* (You can add your appointments/stock tables below as needed) */}
    </div>
  );
}
