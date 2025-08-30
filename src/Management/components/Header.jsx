import React from "react";
import {
  Menu,
  Bell,
  ShieldCheck,
  Hospital,
  UserCircle2,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header({ role, user, onToggleSidebar, onLogout }) {
  const navigate = useNavigate();
  const auth = (() => {
    try {
      return useAuth(); // in case context isn't wired yet
    } catch {
      return {};
    }
  })();

  const handleLogout = async () => {
    try {
      if (typeof onLogout === "function") {
        await onLogout();
      } else if (typeof auth?.logout === "function") {
        await auth.logout();
      } else {
        // Fallback: clear local storage tokens used in your app
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    } finally {
      // SPA navigate; fallback to hard redirect if router not present
      try {
        navigate("/login", { replace: true });
      } catch {
        window.location.href = "/login";
      }
    }
  };

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

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>

          {/* User */}
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
