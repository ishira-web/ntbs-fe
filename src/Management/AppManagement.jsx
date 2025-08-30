// src/Management/AppManagement.jsx
import React, { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import AdminDashboard from "./pages/AdminDashboard";
import HospitalDashboard from "./pages/HospitalDashboard";

import ManageUsers from "./pages/ManageUsers";
import ManageBloodStock from "./pages/ManageBloodStock";
import ManageHospitals from "./pages/ManageHospitals";
import ManageAppointments from "./pages/ManageAppointments";
import ManageCampaigns from "./pages/ManageCampaigns";

export default function AppManagement() {
  const { role, user } = useAuth(); // ← get real role/user from context
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [active, setActive] = useState("dashboard");

  // Optional guard while auth loads / first render
  if (!role) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-gray-600">
        Loading...
      </div>
    );
  }

  const isAdmin = role === "admin";
  const isHospital = role === "hospital"
  const Page = useMemo(() => {
    if (active === "dashboard") return isAdmin ? AdminDashboard : HospitalDashboard;
    if (active === "users") return  isHospital ? ManageUsers : HospitalDashboard;
    if (active === "hospitals") return isAdmin ? ManageHospitals : HospitalDashboard;
    if (active === "blood") return ManageBloodStock;
    if (active === "appointments") return ManageAppointments;
    if (active === "campaigns") return ManageCampaigns;
    return () => <div className="p-6">Not found</div>;
  }, [active, isAdmin]);

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 flex">
      <Sidebar
        role={role}
        active={active}
        onNavigate={setActive}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
      />
      <div className="flex-1 flex flex-col">
        <Header
          role={role}
          user={user}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          <Page />
        </main>
      </div>
    </div>
  );
}
