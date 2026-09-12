"use client";

import React, { useState } from "react";


import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Users,
  Video,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Building2,
  Sparkles,
  UserCheck
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [company, setCompany] = useState("Evalora AI Enterprise");
  const pathname = usePathname();

  const navItems = [
    { name: "Jobs Overview", href: "/dashboard/jobs", icon: Briefcase },
    { name: "Create Job", href: "/dashboard/jobs/new", icon: Briefcase },
    { name: "Candidates", href: "/dashboard/candidates", icon: Users },
    { name: "Interview Reports", href: "/dashboard/interviews/demo/report", icon: Video },
    { name: "Analytics", href: "#", icon: BarChart3 },
    { name: "Settings", href: "#", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 border-r border-slate-800 bg-slate-900/80 backdrop-blur-xl flex flex-col justify-between z-20 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20 font-bold shrink-0">
                <Sparkles className="w-5 h-5 fill-current" />
              </div>
              {!collapsed && (
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
                  Evalora
                </span>
              )}
            </div>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-md shadow-emerald-500/5"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-emerald-400 shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate">HR Lead Admin</p>
                <p className="text-xs text-slate-500 truncate">hr@evalora.ai</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between gap-4 sticky top-0 z-10">
          {/* Company Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs font-semibold text-slate-300">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-200 cursor-pointer font-medium"
              >
                <option value="Evalora AI Enterprise" className="bg-slate-900 text-slate-200">Evalora AI Enterprise</option>
                <option value="Acme Corporation" className="bg-slate-900 text-slate-200">Acme Corporation</option>
                <option value="TechStart Labs" className="bg-slate-900 text-slate-200">TechStart Labs</option>
              </select>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search candidates, jobs..."
                className="pl-9 pr-4 py-1.5 w-64 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <button className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
