// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppManagement from "./Management/AppManagement";
import Login from "./Login/Login";
import HomeLayout from "./Donor/Layouts/HomeLayout";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import ProfilePage from "./Donor/Pages/ProfilePage";
import CampaignLayout from "./Donor/Layouts/CampaignLayout";

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 2500 }}  />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeLayout />} />
          <Route element={<ProtectedRoute roles={["admin", "hospital"]} />}>
            <Route path="/management" element={<AppManagement />} />
          </Route>
          <Route path="/profile" element={<ProfilePage/>}/>
          <Route path="/campaigns" element={<CampaignLayout/>}/>
        </Routes>
      </AuthProvider>
    </>
  );
}

export default App;
