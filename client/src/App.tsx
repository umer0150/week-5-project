import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import TicketsPage from "./pages/TicketsPage";
import FAQPage from "./pages/FAQPage";

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/faqs" element={<FAQPage />} />
          </Route>
        </Route>

        {/* Redirect root */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1f2937",
            color: "#f3f4f6",
            border: "1px solid #374151",
            fontSize: "14px",
          },
          success: { iconTheme: { primary: "#4ade80", secondary: "#1f2937" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#1f2937" } },
        }}
      />
    </>
  );
}
