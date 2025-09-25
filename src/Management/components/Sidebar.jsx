import React from "react";
import {
  LayoutDashboard,
  Users,
  Droplet,
  Building2,
  CalendarCheck2,
  Megaphone,
  ChevronLeft,
  ChevronRight,
  Book,
} from "lucide-react";

const commonItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "blood", label: "Manage Blood Stock", icon: Droplet },
  { key: "appointments", label: "Manage Requests", icon: CalendarCheck2 },
  { key: "campaigns", label: "Manage Campaigns", icon: Megaphone },
  { key: "users", label: "Manage Users", icon: Users },
  { key: "request", label:"Manage Appoinments",icon:CalendarCheck2},
  {key: "blog" ,label:"Manage Blogs",icon:Book}
];

const adminOnly = [
  { key: "hospitals", label: "Manage Hospitals", icon: Building2 }, 
];

export default function Sidebar({ role, active, onNavigate, open, onToggle }) {
  const isAdmin = role === "admin";
  const items = isAdmin ? [...commonItems.slice(0,1), ...adminOnly, ...commonItems.slice(1)] : commonItems;

  return (
    <aside
      className={`${
        open ? "w-72" : "w-20"
      } transition-all duration-200 bg-white border-r border-gray-200 h-screen sticky top-0 hidden md:flex flex-col`}
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between p-4">
        <div className="font-semibold text-lg whitespace-nowrap overflow-hidden text-ellipsis">
          {open ? "Management" : "Mgmt"}
        </div>
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {open ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <nav className="px-2 pb-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                ${isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} />
              {open && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-3 text-xs text-gray-500">
        {open ? (
          <p>
            Role: <span className="font-medium capitalize">{role}</span>
          </p>
        ) : (
          <p className="text-center capitalize">{role[0]}</p>
        )}
      </div>
    </aside>
  );
}