import React from "react";
import { Menu, Bell, ShieldCheck, Hospital, UserCircle2 } from "lucide-react";

export default function Header({ role, user, onToggleSidebar }) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={onToggleSidebar}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2 font-semibold">
            {role === "admin" ? <ShieldCheck size={18} /> : <Hospital size={18} />}
            <span>{role === "admin" ? "Admin Console" : "Hospital Console"}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <div className="flex items-center gap-2">
            <UserCircle2 size={28} className="text-gray-700" />
            <div className="hidden sm:block">
              <div className="text-sm font-medium leading-4">{user?.name}</div>
              <div className="text-xs text-gray-500 capitalize">{role}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}