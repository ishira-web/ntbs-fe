import React from "react";
import {
  Droplet,
  Users,
  Building2,
  CalendarCheck2,
  Megaphone,
  Activity,
} from "lucide-react";

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

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Droplet} label="Units in Stock" value="2,845" sub="Across all hospitals" />
        <StatCard icon={CalendarCheck2} label="Appointments Today" value="312" sub="+8% vs yesterday" />
        <StatCard icon={Users} label="Registered Users" value="5,104" sub="Staff + Coordinators" />
        <StatCard icon={Building2} label="Hospitals Onboarded" value="42" sub="Public + Private" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickAction icon={Users} label="Manage Users" />
            <QuickAction icon={Building2} label="Manage Hospitals" />
            <QuickAction icon={Droplet} label="Manage Blood Stock" />
            <QuickAction icon={CalendarCheck2} label="Manage Appointments" />
            <QuickAction icon={Megaphone} label="Manage Campaigns" />
            <QuickAction icon={Activity} label="System Health" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="font-medium mb-3">Alerts</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Low O− stock (2 units)</span>
              <span className="text-red-600 font-medium">Critical</span>
            </li>
            <li className="flex justify-between">
              <span>Campaign approvals pending</span>
              <span className="text-yellow-600 font-medium">Review</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}

function QuickAction({ icon: Icon, label }) {
  return (
    <button className="w-full rounded-xl border border-gray-200 p-4 hover:bg-gray-50 text-left transition">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-100 p-2">
          <Icon size={18} />
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
    </button>
  );
}