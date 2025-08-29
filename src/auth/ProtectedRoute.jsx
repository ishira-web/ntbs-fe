// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext"; // <-- matches your path

export default function ProtectedRoute({ roles }) {
  const { isAuthed, role } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;

  if (roles?.length && !roles.includes(role)) {
    // send user to their landing
    return <Navigate to={role === "donor" ? "/" : "/management"} replace />;
  }

  return <Outlet />;
}
