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
import LearnLayout from "./Donor/Layouts/LearnLayout";
import HospitalLayout from "./Donor/Layouts/HospitalLayout";
import Register from "./Login/Register";
import LearnArticle from "./Donor/Pages/LearnArticle";
import ChatAssistant from "./Donor/components/ChatAssistant";




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
          <Route path="/learn" element={<LearnLayout/>}/>
          <Route path="/hospitals" element={<HospitalLayout/>}/>
          <Route path="/register" element={<Register />}/>
          <Route path="/learn/:id" element={<LearnArticle />} />
           <Route path="/assistant" element={<ChatAssistant />} />
        </Routes>
      </AuthProvider>
      
    </>
  );
}

export default App;
