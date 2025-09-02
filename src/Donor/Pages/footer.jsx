// src/components/Footer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Github,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

export default function Footer({ siteName = "National Blood Transfusion Service" }) {
  const [email, setEmail] = useState("");

  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return toast.error?.("Please enter a valid email") || alert("Please enter a valid email");
    }
    // Hook this to your backend later (e.g., POST /api/newsletter)
    toast.success?.("Thanks for subscribing!") || alert("Thanks for subscribing!");
    setEmail("");
  };

  const year = new Date().getFullYear();

  const LinkItem = ({ to, children, external }) =>
    external ? (
      <a
        href={to}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        {children} <ExternalLink size={14} />
      </a>
    ) : (
      <Link
        to={to}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        {children}
      </Link>
    );

  const Social = ({ href, Icon, label }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
    >
      <Icon size={18} />
    </a>
  );

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Top */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-6">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                <Heart size={18} />
              </span>
              <span className="text-lg font-semibold">{siteName}</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              A small donation can make a big difference. Join thousands of donors
              helping hospitals respond faster and save lives.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <Social href="https://facebook.com" Icon={Facebook} label="Facebook" />
              <Social href="https://instagram.com" Icon={Instagram} label="Instagram" />
              <Social href="https://twitter.com" Icon={Twitter} label="Twitter / X" />
              <Social href="https://github.com" Icon={Github} label="GitHub" />
            </div>
          </div>

          {/* Quick links */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900">Explore</h4>
            <ul className="mt-3 space-y-2">
              <li><LinkItem to="/">Home</LinkItem></li>
              <li><LinkItem to="/campaigns">Campaigns</LinkItem></li>
              <li><LinkItem to="/hospitals">Hospitals</LinkItem></li>
              <li><LinkItem to="/donate">Learn</LinkItem></li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-1">
            <h4 className="text-sm font-semibold text-gray-900">Support</h4>
            <ul className="mt-3 space-y-2">
              <li><LinkItem to="/faq">FAQ</LinkItem></li>
              <li><LinkItem to="/guidelines">Eligibility</LinkItem></li>
              <li><LinkItem to="/privacy">Privacy</LinkItem></li>
              <li><LinkItem to="/terms">Terms</LinkItem></li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div className="md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-900">Stay in the loop</h4>
            <p className="mt-2 text-sm text-gray-600">
              Get updates on nearby blood drives and tips to prepare for donation.
            </p>

            <form onSubmit={subscribe} className="mt-3 flex gap-2">
              <input
                type="email"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email address"
              />
              <button
                type="submit"
                className="shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Subscribe
              </button>
            </form>

            <div className="mt-5 space-y-2 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-700" />
                <a href="mailto:support@bloodcare.org" className="hover:text-gray-900">
                  support@bloodcare.org
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-gray-700" />
                <a href="tel:+94112223344" className="hover:text-gray-900">
                  +94 11 222 3344
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-700" />
                <span>National Blood Center, Colombo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t border-gray-200 pt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-gray-500">
            © {year} {siteName}
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-800">Privacy</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-800">Terms</Link>
            <a
              href="https://statuspage.example.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800"
            >
              Status <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
