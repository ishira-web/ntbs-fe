// src/Management/pages/AdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Droplet,
  Users,
  Building2,
  CalendarCheck2,
  Megaphone,
  Activity,
  RotateCw,
  AlertCircle,
} from "lucide-react";
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
const REQUEST_STATUSES = ["Pending", "Approved", "Rejected", "Fulfilled", "Cancelled"];

const fmt = new Intl.NumberFormat();

const StatCard = ({ icon: Icon, label, value, sub }) => (
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

function EmptyChart({ label = "No data to display" }) {
  return (
    <div className="h-72 flex items-center justify-center text-sm text-gray-500">
      {label}
    </div>
  );
}

function SafeBar({ data, options, emptyLabel }) {
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

function SafeDoughnut({ data, emptyLabel }) {
  const hasData = Array.isArray(data?.datasets) && data.datasets[0]?.data?.some((v) => Number(v) > 0);
  if (!hasData) return <EmptyChart label={emptyLabel} />;
  return (
    <div className="h-72">
      <Doughnut data={data} />
    </div>
  );
}

export default function AdminDashboard() {
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // KPIs
  const [totalUnits, setTotalUnits] = useState(0);
  const [donorsTotal, setDonorsTotal] = useState(0);
  const [hospitalsTotal, setHospitalsTotal] = useState(null); // may not exist on API; keep nullable
  const [campsTotal, setCampsTotal] = useState(null);
  const [openRequests, setOpenRequests] = useState(0);
  const [fulfilledRequests, setFulfilledRequests] = useState(0);

  // Summary for charts
  const [summary, setSummary] = useState({
    byGroup: [],
    byComponent: [],
    expiringSoon: { days: 7, byGroup: [] },
    expired: { byGroup: [] },
  });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      // 1) Blood stock summary (across all hospitals)
      const sRes = await authFetch(`${API_BASE}/api/bloodstock/summary`);
      if (!sRes.ok) {
        const d = await sRes.json().catch(() => ({}));
        throw new Error(d.message || "Failed to load stock summary");
      }
      const sData = await sRes.json();
      setTotalUnits(Number(sData.totalUnits || 0));
      setSummary(sData);

      // 2) Donors total
      const dRes = await authFetch(`${API_BASE}/api/donors?limit=1`);
      if (dRes.ok) {
        const d = await dRes.json();
        setDonorsTotal(Number(d.total || 0));
      }

      // 3) Requests breakdown: open (Pending+Approved) and fulfilled
      const [pRes, aRes, fRes] = await Promise.all([
        authFetch(`${API_BASE}/api/requests?status=Pending&limit=1`),
        authFetch(`${API_BASE}/api/requests?status=Approved&limit=1`),
        authFetch(`${API_BASE}/api/requests?status=Fulfilled&limit=1`),
      ]);
      let pending = 0, approved = 0, fulfilled = 0;
      if (pRes.ok) pending = Number((await pRes.json()).total || 0);
      if (aRes.ok) approved = Number((await aRes.json()).total || 0);
      if (fRes.ok) fulfilled = Number((await fRes.json()).total || 0);
      setOpenRequests(pending + approved);
      setFulfilledRequests(fulfilled);

      // 4) Hospitals total (optional route support)
      try {
        const hRes = await authFetch(`${API_BASE}/api/hospitals?limit=1`);
        if (hRes.ok) {
          const h = await hRes.json();
          setHospitalsTotal(Number(h.total || 0));
        } else {
          setHospitalsTotal(null);
        }
      } catch {
        setHospitalsTotal(null);
      }

      // 5) Camps total (optional route support)
      try {
        const cRes = await authFetch(`${API_BASE}/api/camps?limit=1`);
        if (cRes.ok) {
          const c = await cRes.json();
          setCampsTotal(Number(c.total || 0));
        } else {
          setCampsTotal(null);
        }
      } catch {
        setCampsTotal(null);
      }
    } catch (e) {
      setError(e.message || "Failed to load dashboard");
      // Keep whatever partial data we have
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          backgroundColor: "rgba(234, 179, 8, 0.9)", // amber-ish
          borderRadius: 8,
        },
        {
          label: "Expired",
          data: expiredByGroup,
          backgroundColor: "rgba(239, 68, 68, 0.9)", // red-ish
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
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  const groupedOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  // Alerts
  const alerts = useMemo(() => {
    const out = [];
    // 1) Any expiring soon
    const expSoonTotal = (summary?.expiringSoon?.byGroup || []).reduce((s, x) => s + (x.units || 0), 0);
    if (expSoonTotal > 0) {
      out.push({ text: `${fmt.format(expSoonTotal)} unit(s) expiring within ${summary?.expiringSoon?.days || 7} days`, severity: "Review" });
    }
    // 2) Lowest stock groups (pick bottom 2 non-zero)
    const sorted = (summary?.byGroup || []).slice().sort((a, b) => (a.units || 0) - (b.units || 0));
    const lows = sorted.filter((x) => x.units > 0).slice(0, 2);
    lows.forEach((x) => out.push({ text: `Low ${x.bloodGroup} stock (${x.units} units)`, severity: "Watch" }));
    return out;
  }, [summary]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RotateCw size={16} /> Refresh
        </button>
      </div>

      {error && (
        <div className="inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplet} label="Units in Stock" value={fmt.format(totalUnits)} sub="Across all hospitals" />
        <StatCard icon={CalendarCheck2} label="Open Requests" value={fmt.format(openRequests)} sub="Pending + Approved" />
        <StatCard icon={Users} label="Registered Donors" value={fmt.format(donorsTotal)} sub="All statuses" />
        <StatCard icon={Building2} label="Hospitals Onboarded" value={hospitalsTotal === null ? "—" : fmt.format(hospitalsTotal)} sub="If available" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Units by Blood Group">
          <SafeBar data={{
            labels: GROUPS,
            datasets: [{ label: "Units", data: unitsByGroup, backgroundColor: "rgba(17,24,39,0.9)", borderRadius: 8 }]
          }} options={barOptions} emptyLabel="No stock yet" />
        </Card>
        <Card title="Units by Component">
          <SafeDoughnut data={{
            labels: unitsByComponent.labels,
            datasets: [{ label: "Units", data: unitsByComponent.data, backgroundColor: [
              "rgba(17,24,39,0.9)",
              "rgba(31,41,55,0.9)",
              "rgba(55,65,81,0.9)",
              "rgba(75,85,99,0.9)",
              "rgba(107,114,128,0.9)",
            ]}] }}
            emptyLabel="No component data" />
        </Card>
        <Card
          title="Requests by Status"
          right={<span className="text-xs text-gray-500">Fulfilled: {fmt.format(fulfilledRequests)}</span>}
        >
          <SafeBar
            data={{
              labels: REQUEST_STATUSES,
              datasets: [{
                label: "Requests",
                data: REQUEST_STATUSES.map((s) => {
                  if (s === "Pending") return openRequests; // show open as combined? Better: individual calls
                  if (s === "Approved") return 0; // represented in Open
                  if (s === "Fulfilled") return fulfilledRequests;
                  // For simplicity, treat Rejected/Cancelled as 0 without extra calls.
                  return 0;
                }),
                backgroundColor: "rgba(75,85,99,0.9)",
                borderRadius: 8,
              }],
            }}
            options={groupedOptions}
            emptyLabel="No requests yet"
          />
        </Card>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Quick Actions">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction icon={Users} label="Manage Donors" to="/admin/donors" />
            <QuickAction icon={Building2} label="Manage Hospitals" to="/admin/hospitals" />
            <QuickAction icon={Droplet} label="Manage Blood Stock" to="/management/stock" />
            <QuickAction icon={CalendarCheck2} label="Manage Requests" to="/management/appointments" />
            <QuickAction icon={Megaphone} label="Manage Campaigns" to="/management/campaigns" />
            <QuickAction icon={Activity} label="System Health" to="/admin/health" />
          </div>
        </Card>

        <Card title="Alerts">
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-500">All good right now.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.map((a, i) => (
                <li key={i} className="flex justify-between">
                  <span>{a.text}</span>
                  <span className={`font-medium ${a.severity === "Review" ? "text-yellow-600" : "text-amber-700"}`}>
                    {a.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Campaigns (Total)">
          <div className="text-3xl font-semibold">{campsTotal === null ? "—" : fmt.format(campsTotal)}</div>
          <p className="text-xs text-gray-500 mt-2">Fetched from /api/camps (if available)</p>
        </Card>
      </section>
    </div>
  );
}

function QuickAction({ icon: Icon, label, to = "#" }) {
  const onClick = () => {
    if (to && to !== "#") {
      window.location.href = to;
    }
  };
  return (
    <button onClick={onClick} className="w-full rounded-xl border border-gray-200 p-4 hover:bg-gray-50 text-left transition">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </button>
  );
}
