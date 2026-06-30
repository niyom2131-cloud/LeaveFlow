import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { submitLeaveRequest } from '../lib/leave-service';
import { X, Calendar, FileText, Upload, Paperclip, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LeaveType, Attachment } from '../types';

interface LeaveFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const LeaveFormModal: React.FC<LeaveFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  
  const [leaveType, setLeaveType] = useState<LeaveType>('sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  
  const [totalDays, setTotalDays] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Calculate total leave days
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end < start) {
        setTotalDays(0);
        setError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น');
        return;
      }
      
      setError(null);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(diffDays);
    } else {
      setTotalDays(0);
    }
  }, [startDate, endDate]);

  if (!isOpen || !profile) return null;

  // Get quota details based on leave type
  const getQuotaDetails = () => {
    switch (leaveType) {
      case 'sick':
        return {
          label: 'ลาป่วย',
          max: profile.sickQuota,
          used: profile.sickUsed,
          remaining: profile.sickQuota - profile.sickUsed,
        };
      case 'personal':
        return {
          label: 'ลากิจ',
          max: profile.personalQuota,
          used: profile.personalUsed,
          remaining: profile.personalQuota - profile.personalUsed,
        };
      case 'vacation':
        return {
          label: 'ลาพักร้อน',
          max: profile.vacationQuota,
          used: profile.vacationUsed,
          remaining: profile.vacationQuota - profile.vacationUsed,
        };
    }
  };

  const quota = getQuotaDetails();

  // Handle file changes and convert to Base64
  const handleFile = (file: File) => {
    if (file.size > 1024 * 1024) { // 1MB Limit
      setError('ขนาดไฟล์ต้องไม่เกิน 1MB เพื่อความปลอดภัยของข้อมูล');
      return;
    }
    
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAttachment({
          name: file.name,
          type: file.type,
          size: file.size,
          content: e.target.result as string,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    if (totalDays <= 0) {
      setError('กรุณาเลือกวันที่ในการลาให้ถูกต้อง');
      return;
    }

    if (totalDays > quota.remaining) {
      setError(`จำนวนวันที่ขอลา (${totalDays} วัน) เกินจำนวนวันคงเหลือของท่าน (${quota.remaining} วัน)`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await submitLeaveRequest({
        userId: profile.uid,
        userEmail: profile.email,
        userName: profile.displayName,
        userPhoto: profile.photoURL,
        userDepartment: profile.department,
        leaveType,
        startDate,
        endDate,
        totalDays,
        reason,
        attachment: attachment || undefined,
      });

      // Reset Form State
      setLeaveType('sick');
      setStartDate('');
      setEndDate('');
      setReason('');
      setAttachment(null);
      setTotalDays(0);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('ไม่สามารถส่งใบลาได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans text-[#3E3E36]">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background Overlay */}
        <div className="fixed inset-0 transition-opacity bg-[#3E3E36]/40 backdrop-blur-sm" onClick={onClose} />

        {/* Center alignment trick */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="inline-block w-full max-w-lg overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-3xl border border-[#E0DBD3] sm:my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4.5 bg-[#F1EDE8] border-b border-[#E0DBD3]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#7C8363]/10 text-[#7C8363] rounded-xl border border-[#7C8363]/20">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#3E3E36] font-serif">ยื่นแบบฟอร์มขอลาหยุด</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-[#5A5A40] hover:text-[#3E3E36] rounded-lg hover:bg-[#E0DBD3] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Leave Type selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A9907E] mb-2">ประเภทการลา</label>
              <div className="grid grid-cols-3 gap-2">
                {(['sick', 'personal', 'vacation'] as LeaveType[]).map((type) => {
                  const isActive = leaveType === type;
                  let label = '';
                  let colorClass = '';
                  switch (type) {
                    case 'sick':
                      label = 'ลาป่วย';
                      colorClass = isActive ? 'bg-[#B36B5C]/10 border-[#B36B5C]/30 text-[#B36B5C] ring-2 ring-[#B36B5C]/10 font-bold' : 'hover:bg-[#F9F8F6] text-[#5A5A40] border-[#E0DBD3]';
                      break;
                    case 'personal':
                      label = 'ลากิจ';
                      colorClass = isActive ? 'bg-[#A9907E]/10 border-[#A9907E]/30 text-[#A9907E] ring-2 ring-[#A9907E]/10 font-bold' : 'hover:bg-[#F9F8F6] text-[#5A5A40] border-[#E0DBD3]';
                      break;
                    case 'vacation':
                      label = 'ลาพักร้อน';
                      colorClass = isActive ? 'bg-[#7C8363]/10 border-[#7C8363]/30 text-[#7C8363] ring-2 ring-[#7C8363]/10 font-bold' : 'hover:bg-[#F9F8F6] text-[#5A5A40] border-[#E0DBD3]';
                      break;
                  }
                  return (
                    <button
                      id={`leave-type-btn-${type}`}
                      key={type}
                      type="button"
                      onClick={() => setLeaveType(type)}
                      className={`py-2.5 px-3 border rounded-xl font-bold text-xs text-center transition-all cursor-pointer ${colorClass}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quota Information Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors duration-200 ${
              leaveType === 'sick' ? 'bg-[#B36B5C]/10 border-[#B36B5C]/20 text-[#B36B5C]' :
              leaveType === 'personal' ? 'bg-[#A9907E]/10 border-[#A9907E]/20 text-[#A9907E]' :
              'bg-[#7C8363]/10 border-[#7C8363]/20 text-[#7C8363]'
            }`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>วันลาคงเหลือประเภทนี้:</span>
              </div>
              <span className="font-extrabold text-sm font-serif">
                {quota.remaining} / {quota.max} วัน
              </span>
            </div>

            {/* Date Picker Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A9907E] mb-1.5">วันที่เริ่มต้น</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9907E] pointer-events-none" />
                  <input
                    id="leave-start-date"
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E0DBD3] bg-[#F9F8F6] rounded-xl text-xs font-bold text-[#3E3E36] focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#A9907E] mb-1.5">วันที่สิ้นสุด</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9907E] pointer-events-none" />
                  <input
                    id="leave-end-date"
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#E0DBD3] bg-[#F9F8F6] rounded-xl text-xs font-bold text-[#3E3E36] focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20"
                  />
                </div>
              </div>
            </div>

            {/* Total Days Display */}
            {totalDays > 0 && (
              <div className="px-3.5 py-2.5 bg-[#7C8363]/10 border border-[#7C8363]/20 rounded-xl flex items-center justify-between text-xs text-[#5A5A40] font-bold">
                <span>จำนวนวันหยุดที่คำนวณได้:</span>
                <span className="font-extrabold text-sm font-serif text-[#7C8363]">{totalDays} วัน</span>
              </div>
            )}

            {/* Leave Reason */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A9907E] mb-1.5">เหตุผลการลา</label>
              <textarea
                id="leave-reason-textarea"
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผลในการยื่นขอลา เช่น ไปพบแพทย์ตามนัด, จัดการธุระส่วนตัว"
                className="w-full p-3 border border-[#E0DBD3] bg-[#F9F8F6] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20 placeholder-[#A9907E]/70 text-[#3E3E36] font-medium"
              />
            </div>

            {/* File Upload/Attachment with drag-and-drop support */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#A9907E] mb-1.5">
                ไฟล์แนบ (ถ้ามี / ขนาดไม่เกิน 1MB)
              </label>
              
              {attachment ? (
                <div className="p-3 bg-[#F9F8F6] border border-[#E0DBD3] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 max-w-[80%] overflow-hidden">
                    <Paperclip className="h-4.5 w-4.5 text-[#7C8363] shrink-0" />
                    <span className="font-bold text-[#3E3E36] truncate">{attachment.name}</span>
                    <span className="text-[10px] text-[#A9907E] shrink-0 font-medium">
                      ({(attachment.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeAttachment}
                    className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded-lg transition-colors font-bold cursor-pointer"
                  >
                    ลบออก
                  </button>
                </div>
              ) : (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
                    dragActive ? 'border-[#7C8363] bg-[#7C8363]/10' : 'border-[#E0DBD3] hover:border-[#A9907E] hover:bg-[#F9F8F6]/50'
                  }`}
                >
                  <Upload className="h-7 w-7 mx-auto text-[#A9907E] mb-1.5" />
                  <p className="text-xs font-bold text-[#3E3E36]">ลากไฟล์มาวางที่นี่ หรือ</p>
                  <label className="mt-1.5 inline-block px-3.5 py-1.5 bg-[#F1EDE8] text-[#5A5A40] hover:bg-[#E0DBD3] rounded-lg text-[10px] font-bold cursor-pointer transition-all border border-[#E0DBD3]/50">
                    เลือกไฟล์จากคอมพิวเตอร์
                    <input
                      id="leave-attachment-input"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                  </label>
                  <p className="text-[9px] text-[#A9907E] mt-1.5 font-bold">รองรับไฟล์รูปภาพ, PDF (สูงสุด 1MB)</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#F1EDE8] flex items-center justify-end gap-3 font-bold text-xs">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-[#F9F8F6] border border-[#E0DBD3] text-[#5A5A40] rounded-xl cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                id="leave-submit-btn"
                type="submit"
                disabled={loading || totalDays <= 0 || (totalDays > quota.remaining)}
                className="px-5 py-2 bg-[#7C8363] hover:bg-[#5A5A40] text-white rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>กำลังส่ง...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>ส่งใบลา</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
