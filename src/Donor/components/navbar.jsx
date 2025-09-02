// src/components/Navbar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Droplet,
  Menu,
  X,
  ChevronDown,
  UserCircle2,
  LogIn,
  LogOut,
  Heart,
  Calendar,
  Building,
  BookOpen,
} from "lucide-react";
import gsap from "gsap";
import { useAuth } from "../../auth/AuthContext";

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isDonor = (role || user?.role) === "donor";
  const displayName = user?.name || user?.email?.split("@")[0] || "Donor";
  const initials = useMemo(() => {
    const parts = (displayName || "").split(/\s+/);
    return ((parts[0]?.[0] || "D") + (parts[1]?.[0] || "N")).toUpperCase();
  }, [displayName]);
  const profileHref = user?._id ? `/donor/profile/${user._id}` : "/donor/profile";

  // UI state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Refs for gsap
  const navRef = useRef(null);
  const dropdownRef = useRef(null);
  const mobileRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Entrance animation
  useEffect(() => {
    if (!navRef.current) return;
    gsap.fromTo(
      navRef.current,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
  }, []);

  // Dropdown animation on open
  useEffect(() => {
    if (!dropdownRef.current) return;
    if (menuOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: "power2.out" }
      );
    }
  }, [menuOpen]);

  // Mobile panel animation on open
  useEffect(() => {
    if (!mobileRef.current) return;
    if (mobileOpen) {
      gsap.fromTo(
        mobileRef.current,
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.to(mobileRef.current, {
        opacity: 0,
        x: -20,
        duration: 0.2,
        ease: "power2.in"
      });
    }
  }, [mobileOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    function onDown(e) {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(e.target)) return;
      setMenuOpen(false);
    }
    if (menuOpen) {
      document.addEventListener("mousedown", onDown);
      return () => document.removeEventListener("mousedown", onDown);
    }
  }, [menuOpen]);

  const handleLogout = async () => {
    try {
      if (typeof logout === "function") {
        await logout();
      } else {
        // Fallback: clear and redirect
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
      }
    } finally {
      navigate("/login");
      setMenuOpen(false);
    }
  };

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "border-b border-red-100 bg-white/95 backdrop-blur-lg shadow-sm" 
          : "border-b border-red-100/50 bg-white/90 backdrop-blur-md"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Primary Links */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-red-700 font-bold group"
          >
            <span className="inline-flex h-8 w-8 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white items-center justify-center transition-transform group-hover:scale-105">
              <Droplet size={18} fill="white" />
            </span>
            <span className="text-lg font-bold bg-gradient-to-r from-red-700 to-red-600 bg-clip-text text-transparent">
              Lifeline
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavItem to="/" icon={<Heart size={16} />}>
              Home
            </NavItem>
            <NavItem to="/campaigns" icon={<Calendar size={16} />}>
              Campaigns
            </NavItem>
            <NavItem to="/hospitals" icon={<Building size={16} />}>
              Hospitals
            </NavItem>
            <NavItem to="/learn" icon={<BookOpen size={16} />}>
              Learn
            </NavItem>
          </div>
        </div>

        {/* Right: Auth / Profile */}
        <div className="hidden md:flex items-center gap-3">
          <CTA to="/donate">Donate Now</CTA>
          
          {!isDonor ? (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 hover:border-red-300"
            >
              <LogIn size={16} />
              Login
            </Link>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white pl-2 pr-3 py-1.5 text-sm hover:bg-gray-50 transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium text-sm">
                  {initials}
                </span>
                <span className="text-gray-800 font-medium max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {menuOpen && (
                <div
                  ref={dropdownRef}
                  role="menu"
                  className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden py-1 z-50"
                >
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-500 capitalize">{role || user?.role}</p>
                  </div>
                  
                  <Link
                    to={profileHref}
                    onClick={() => setMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-red-50 transition-colors"
                    role="menuitem"
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 inline-flex items-center gap-2 text-red-600 transition-colors"
                    role="menuitem"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-red-50 transition-colors"
          onClick={() => setMobileOpen((s) => !s)}
          aria-label="Toggle navigation"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X size={22} className="text-red-700" />
          ) : (
            <Menu size={22} className="text-red-700" />
          )}
        </button>
      </nav>

      {/* Mobile panel */}
      <div
        ref={mobileRef}
        className={`md:hidden absolute top-full left-0 right-0 bg-white border-t border-red-100 shadow-lg transition-all duration-300 transform ${
          mobileOpen ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          <MobileNavItem to="/" icon={<Heart size={18} />} onClick={() => setMobileOpen(false)}>
            Home
          </MobileNavItem>
          <MobileNavItem to="/campaigns" icon={<Calendar size={18} />} onClick={() => setMobileOpen(false)}>
            Campaigns
          </MobileNavItem>
          <MobileNavItem to="/hospitals" icon={<Building size={18} />} onClick={() => setMobileOpen(false)}>
            Hospitals
          </MobileNavItem>
          <MobileNavItem to="/learn" icon={<BookOpen size={18} />} onClick={() => setMobileOpen(false)}>
            Learn
          </MobileNavItem>

          <div className="pt-3">
            <MobileCTA to="/donate" onClick={() => setMobileOpen(false)}>
              Donate Now
            </MobileCTA>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            {!isDonor ? (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-base font-medium text-red-700 transition-colors hover:bg-red-50"
              >
                <LogIn size={18} /> Login
              </Link>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white font-medium">
                    {initials}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{displayName}</div>
                    <div className="text-sm text-red-600 capitalize">{role || user?.role}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to={profileHref}
                    onClick={() => setMobileOpen(false)}
                    className="text-center rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------ Small sub-components ------------------ */

function NavItem({ to, icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
          isActive 
            ? "text-red-700 bg-red-50" 
            : "text-gray-600 hover:text-red-700 hover:bg-red-50/50",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function CTA({ to, children }) {
  return (
    <Link
      to={to}
      className="rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 text-sm font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-sm hover:shadow-md"
    >
      {children}
    </Link>
  );
}

function MobileNavItem({ to, icon, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-3 rounded-xl text-base font-medium transition-colors",
          isActive 
            ? "text-red-700 bg-red-50" 
            : "text-gray-600 hover:text-red-700 hover:bg-red-50/50",
        ].join(" ")
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}

function MobileCTA({ to, onClick, children }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block text-center rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-3 text-base font-medium hover:from-red-700 hover:to-red-800 transition-all shadow-sm"
    >
      {children}
    </Link>
  );
}