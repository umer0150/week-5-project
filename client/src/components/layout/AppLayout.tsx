import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  // lock background scroll when mobile sidebar open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  return (
    <div className="h-screen flex bg-gray-950 text-white overflow-hidden">
      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex md:w-80 md:flex-shrink-0 border-r border-gray-800">
        <Sidebar />
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* SIDEBAR PANEL */}
          <div className="relative w-80 max-w-[85%] h-full bg-gray-950 border-r border-gray-800">
            <Sidebar />
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-3 right-3 p-2 rounded-lg bg-gray-900 border border-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* MOBILE TOP BAR */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="text-sm font-medium text-gray-200">NovaDesk AI</div>

          <div className="w-9" />
        </div>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
