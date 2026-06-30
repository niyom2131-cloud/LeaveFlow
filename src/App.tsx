import React from 'react';
import { AuthProvider, useAuth } from './lib/auth-context';
import { LoginScreen } from './components/LoginScreen';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { RoleSwitcher } from './components/RoleSwitcher';
import { LogOut, CalendarClock, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

const Header: React.FC = () => {
  const { profile, logOut } = useAuth();

  if (!profile) return null;

  const isManager = profile.role === 'manager';

  return (
    <header className="bg-[#F1EDE8] border-b border-[#E0DBD3] sticky top-0 z-30 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#7C8363] rounded-xl text-white shadow-sm">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#3E3E36] tracking-tight flex items-center gap-1.5 font-serif">
                <span className="text-base text-[#5A5A40]">LeaveFlow</span>
                <span className="px-1.5 py-0.5 bg-[#7C8363]/10 text-[#7C8363] text-[9px] font-bold font-sans rounded-full">Web App</span>
              </h1>
              <p className="text-[10px] text-[#A9907E] font-semibold uppercase tracking-wider">ระบบฟอร์มใบลาออนไลน์</p>
            </div>
          </div>

          {/* Right Action Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs font-bold text-[#3E3E36]">{profile.displayName}</span>
              <span className="text-[10px] text-[#A9907E] font-semibold flex items-center gap-1">
                {isManager ? (
                  <>
                    <ShieldCheck className="h-3 w-3 text-[#7C8363]" />
                    <span className="text-[#7C8363] font-bold">สิทธิ์ผู้จัดการ / หัวหน้า</span>
                  </>
                ) : (
                  <span>พนักงานทั่วไป</span>
                )}
                <span>({profile.department})</span>
              </span>
            </div>

            <button
              id="header-logout-btn"
              onClick={logOut}
              className="p-2 bg-white hover:bg-red-50 text-[#5A5A40] hover:text-red-600 rounded-xl transition-all border border-[#E0DBD3] hover:border-red-100 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer shadow-sm"
              title="ออกจากระบบ"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

const DashboardContainer: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center items-center font-sans p-4">
        <div className="p-4 rounded-full bg-[#F1EDE8] text-[#7C8363] mb-4 animate-bounce border border-[#E0DBD3]">
          <CalendarClock className="h-8 w-8" />
        </div>
        <svg className="animate-spin h-6 w-6 text-[#7C8363] mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <h3 className="text-sm font-bold text-[#3E3E36] font-serif">กำลังซิงโครไนซ์ข้อมูลฐานข้อมูล Firebase...</h3>
        <p className="text-xs text-[#A9907E] mt-1 font-medium">กรุณารอสักครู่ ระบบกำลังจัดเตรียมข้อมูลของคุณ</p>
      </div>
    );
  }

  if (!profile) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#3E3E36] flex flex-col font-sans">
      <Header />
      
      {/* Dynamic Dashboard based on profile role */}
      <main className="flex-grow">
        {profile.role === 'manager' ? <ManagerDashboard /> : <EmployeeDashboard />}
      </main>

      {/* Footer */}
      <footer className="py-8 bg-[#F1EDE8] border-t border-[#E0DBD3] text-center text-[10px] text-[#A9907E] font-semibold select-none">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} LeaveFlow. พัฒนาด้วย React, Tailwind CSS และ Firebase Firestore</p>
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full text-[9px] border border-[#E0DBD3] text-[#5A5A40]">
            <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
            <span>เชื่อมต่อ Firebase Real-time Database และ Google Authentication สำเร็จ</span>
          </div>
        </div>
      </footer>

      {/* Floating Demo Role Switcher Widget */}
      <RoleSwitcher />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DashboardContainer />
    </AuthProvider>
  );
}
