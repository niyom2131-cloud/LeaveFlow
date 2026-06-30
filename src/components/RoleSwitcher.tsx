import React from 'react';
import { useAuth } from '../lib/auth-context';
import { Shield, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const RoleSwitcher: React.FC = () => {
  const { profile, toggleDemoRole } = useAuth();

  if (!profile) return null;

  const isManager = profile.role === 'manager';

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-[#3E3E36] text-white rounded-2xl shadow-xl p-3.5 border border-[#5A5A40] flex items-center gap-3 max-w-sm"
      >
        <div className={`p-2 rounded-xl shrink-0 ${isManager ? 'bg-[#7C8363]' : 'bg-[#A9907E]'}`}>
          <Shield className="h-4.5 w-4.5 text-white" />
        </div>
        
        <div className="text-left select-none">
          <p className="text-[10px] font-bold text-[#E0DBD3] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-400" />
            <span>โหมดทดสอบระบบ (Demo)</span>
          </p>
          <p className="text-xs font-semibold text-white mt-0.5">
            สิทธิ์ปัจจุบัน: <span className="font-bold underline decoration-[#E0DBD3] decoration-2">{isManager ? 'ผู้จัดการ' : 'พนักงาน'}</span>
          </p>
        </div>

        <button
          id="toggle-demo-role-btn"
          onClick={toggleDemoRole}
          className="p-2 bg-[#5A5A40] hover:bg-[#7C8363] text-white rounded-xl transition-all flex items-center justify-center border border-[#7C8363]/40 cursor-pointer"
          title="สลับสิทธิ์การใช้งานเพื่อทดสอบระบบ"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </motion.div>
    </div>
  );
};
