import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { LogIn, CalendarClock, ShieldAlert, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setError(null);
      setLoading(true);
      await signIn();
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-[#3E3E36]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center justify-center p-3.5 bg-[#7C8363] rounded-2xl shadow-sm text-white">
            <CalendarClock className="h-10 w-10" id="login-logo-icon" />
          </div>
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-6 text-center text-3xl font-bold tracking-tight text-[#5A5A40] font-serif"
        >
          LeaveFlow
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 text-center text-sm text-[#A9907E] uppercase tracking-widest font-semibold"
        >
          ระบบใบลาออนไลน์พนักงาน
        </motion.p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-white py-8 px-6 shadow-sm rounded-3xl border border-[#E0DBD3]"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-700 text-sm flex items-start gap-2.5">
              <ShieldAlert className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1EDE8] text-[#7C8363] rounded-full text-xs font-bold mb-3 border border-[#E0DBD3]/50">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>สำหรับพนักงานและผู้บริหาร</span>
              </div>
              <h3 className="text-base font-bold text-[#3E3E36] font-serif">เข้าสู่ระบบการทำงาน</h3>
              <p className="text-xs text-[#A9907E] mt-1 font-semibold">ใช้บัญชีอีเมลบริษัท หรือ Gmail ในการล็อกอินเข้าสู่ระบบ</p>
            </div>

            <button
              id="google-signin-btn"
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 border border-[#E0DBD3] rounded-2xl shadow-sm bg-[#F9F8F6] hover:bg-[#F1EDE8] text-[#3E3E36] font-bold transition-all duration-200 text-xs focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7C8363] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-[#7C8363]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              <span>{loading ? 'กำลังเชื่อมต่อ...' : 'เข้าสู่ระบบด้วย Google (Gmail)'}</span>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-[#F1EDE8]">
            <div className="flex items-center gap-3 text-xs text-[#A9907E] font-medium">
              <LogIn className="h-4.5 w-4.5 text-[#7C8363] shrink-0" />
              <span>ข้อมูลใบลาและประวัติทั้งหมดจะถูกจัดเก็บไว้บน Firebase Cloud Firestore อย่างปลอดภัย</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
