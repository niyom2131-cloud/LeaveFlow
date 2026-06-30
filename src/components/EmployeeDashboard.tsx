import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { subscribeUserRequests, cancelLeaveRequest } from '../lib/leave-service';
import { LeaveRequest, LeaveType } from '../types';
import { LeaveFormModal } from './LeaveFormModal';
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Paperclip, 
  Briefcase, 
  FileText, 
  Search, 
  SlidersHorizontal,
  Settings,
  X,
  HeartPulse,
  Palmtree
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const EmployeeDashboard: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessNotification, setIsSuccessNotification] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{name: string, content: string, type: string} | null>(null);
  
  // Filtering and Searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveType>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [deptInput, setDeptInput] = useState('');

  useEffect(() => {
    if (!profile) return;
    setDeptInput(profile.department || 'ทั่วไป');
    
    const unsubscribe = subscribeUserRequests(profile.uid, (data) => {
      setRequests(data);
    });

    return () => unsubscribe();
  }, [profile?.uid]);

  if (!profile) return null;

  // Format date helper
  const formatDateTh = (dateStr: string) => {
    const monthsTh = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = monthsTh[d.getMonth()];
    const year = d.getFullYear() + 543; // Thai Buddhist Year
    return `${day} ${month} ${year}`;
  };

  const handleCancelRequest = async (requestId: string) => {
    if (window.confirm('คุณต้องการยกเลิกคำขอลาหยุดนี้ใช่หรือไม่?')) {
      try {
        await cancelLeaveRequest(requestId);
      } catch (err) {
        console.error('Error cancelling leave request:', err);
        alert('เกิดข้อผิดพลาดในการยกเลิกกรุณาลองใหม่อีกครั้ง');
      }
    }
  };

  const handleUpdateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ department: deptInput });
      setIsSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter requests based on criteria
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = r.reason.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.startDate.includes(searchTerm) || 
                          r.endDate.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    const matchesType = typeFilter === 'all' ? true : r.leaveType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Quotas calculations (Natural Tones Colors)
  const quotas = [
    {
      id: 'sick',
      name: 'ลาป่วย',
      desc: 'ลาเมื่อมีอาการเจ็บป่วย',
      max: profile.sickQuota,
      used: profile.sickUsed,
      remaining: profile.sickQuota - profile.sickUsed,
      color: 'bg-[#B36B5C]', // Soft Terracotta
      bgColor: 'bg-[#B36B5C]/10',
      textColor: 'text-[#B36B5C]',
      icon: HeartPulse,
    },
    {
      id: 'personal',
      name: 'ลากิจ',
      desc: 'ลาเพื่อจัดการธุระสำคัญ',
      max: profile.personalQuota,
      used: profile.personalUsed,
      remaining: profile.personalQuota - profile.personalUsed,
      color: 'bg-[#A9907E]', // Tuscan Tan
      bgColor: 'bg-[#A9907E]/10',
      textColor: 'text-[#A9907E]',
      icon: Briefcase,
    },
    {
      id: 'vacation',
      name: 'ลาพักร้อน',
      desc: 'พักผ่อนประจำปี',
      max: profile.vacationQuota,
      used: profile.vacationUsed,
      remaining: profile.vacationQuota - profile.vacationUsed,
      color: 'bg-[#7C8363]', // Sage Green
      bgColor: 'bg-[#7C8363]/10',
      textColor: 'text-[#7C8363]',
      icon: Palmtree,
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 font-sans text-[#3E3E36]">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E0DBD3] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profile.photoURL}
            alt={profile.displayName}
            className="h-14 w-14 rounded-full border-2 border-[#7C8363]/20 object-cover"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#3E3E36] font-serif">{profile.displayName}</h2>
              <span className="px-2.5 py-0.5 bg-[#F1EDE8] text-[#7C8363] text-[10px] font-bold rounded-full border border-[#E0DBD3]/50">พนักงาน</span>
            </div>
            <p className="text-xs text-[#A9907E] mt-0.5 flex items-center gap-1.5 font-medium">
              <span>แผนก: <span className="font-bold text-[#5A5A40]">{profile.department}</span></span>
              <span className="text-[#E0DBD3]">•</span>
              <span>{profile.email}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-[#F9F8F6] hover:bg-[#F1EDE8] text-[#5A5A40] hover:text-[#3E3E36] border border-[#E0DBD3] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="ตั้งค่าแผนก"
          >
            <Settings className="h-4 w-4" />
            <span>ตั้งค่าแผนก</span>
          </button>
          
          <button
            id="open-leave-modal-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#7C8363] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>เขียนใบลาหยุด</span>
          </button>
        </div>
      </div>

      {/* Leave Quota Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {quotas.map((q) => {
          const percent = Math.min(100, (q.used / q.max) * 100);
          const Icon = q.icon;
          return (
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
              key={q.id}
              className="bg-white rounded-3xl shadow-sm border border-[#E0DBD3] p-5 flex flex-col justify-between h-44"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[#3E3E36] text-sm font-serif">{q.name}</h3>
                  <p className="text-[10px] text-[#A9907E] font-medium mt-0.5">{q.desc}</p>
                </div>
                <div className={`p-2.5 rounded-xl ${q.bgColor} ${q.textColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-[#3E3E36] font-serif">{q.remaining} <span className="text-xs font-bold text-[#A9907E] font-sans">วันคงเหลือ</span></span>
                  <span className="text-xs text-[#5A5A40] font-bold">ใช้ไป {q.used} / {q.max} วัน</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-[#F1EDE8] h-2 rounded-full overflow-hidden border border-[#E0DBD3]/40">
                  <div className={`h-full ${q.color} rounded-full`} style={{ width: `${percent}%` }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {isSuccessNotification && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-[#7C8363]/10 border border-[#7C8363]/30 text-[#5A5A40] rounded-2xl flex items-center justify-between text-xs font-medium"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#7C8363]" />
              <span>ส่งแบบฟอร์มการลาของคุณเรียบร้อยแล้ว รอผู้จัดการตรวจสอบและพิจารณาคำขออนุมัติ</span>
            </div>
            <button 
              onClick={() => setIsSuccessNotification(false)}
              className="px-2.5 py-1 hover:bg-[#7C8363]/20 text-[#5A5A40] rounded-lg font-bold cursor-pointer transition-colors"
            >
              ตกลง
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filters */}
      <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9907E]" />
          <input
            id="employee-search-input"
            type="text"
            placeholder="ค้นหาตามเหตุผลการลา หรือ วันที่ (เช่น YYYY-MM-DD)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-[#E0DBD3] rounded-2xl text-xs bg-[#F9F8F6] focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20 focus:border-[#7C8363] placeholder-[#A9907E]/70 text-[#3E3E36] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#5A5A40]" />
            <span className="text-[10px] font-bold uppercase text-[#A9907E] tracking-wider">ตัวกรอง:</span>
          </div>

          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#5A5A40] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/10 cursor-pointer"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="pending">รอการอนุมัติ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ปฏิเสธใบลา</option>
          </select>

          <select
            id="type-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#5A5A40] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/10 cursor-pointer"
          >
            <option value="all">ประเภทการลาทั้งหมด</option>
            <option value="sick">ลาป่วย</option>
            <option value="personal">ลากิจ</option>
            <option value="vacation">ลาพักร้อน</option>
          </select>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm overflow-hidden">
        <div className="px-6 py-4.5 bg-[#F1EDE8] border-b border-[#E0DBD3] flex items-center justify-between">
          <h3 className="font-bold text-[#3E3E36] text-sm flex items-center gap-2 font-serif">
            <Clock className="h-4 w-4 text-[#7C8363]" />
            <span>ประวัติการลาของคุณ</span>
          </h3>
          <span className="text-[10px] font-bold text-[#A9907E] bg-white px-2.5 py-1 rounded-full border border-[#E0DBD3]/50">พบรายการลา {filteredRequests.length} รายการ</span>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-[#A9907E]/40 mx-auto mb-3" />
            <h4 className="font-bold text-[#3E3E36] text-xs font-serif">ไม่พบข้อมูลการลาหยุด</h4>
            <p className="text-[10px] text-[#A9907E] mt-1 font-medium">ท่านยังไม่ได้ยื่นคำขอลาหยุด หรือไม่มีคำขอลาที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1EDE8]">
            {filteredRequests.map((r) => {
              // Get style options based on type
              let typeLabel = '';
              let typeClass = '';
              switch (r.leaveType) {
                case 'sick':
                  typeLabel = 'ลาป่วย';
                  typeClass = 'bg-[#B36B5C]/10 text-[#B36B5C] border border-[#B36B5C]/20';
                  break;
                case 'personal':
                  typeLabel = 'ลากิจ';
                  typeClass = 'bg-[#A9907E]/10 text-[#A9907E] border border-[#A9907E]/20';
                  break;
                case 'vacation':
                  typeLabel = 'ลาพักร้อน';
                  typeClass = 'bg-[#7C8363]/10 text-[#7C8363] border border-[#7C8363]/20';
                  break;
              }

              // Status styles
              let statusLabel = '';
              let statusClass = '';
              let StatusIcon = Clock;
              switch (r.status) {
                case 'pending':
                  statusLabel = 'รออนุมัติ';
                  statusClass = 'bg-amber-50 text-amber-700 border border-amber-100';
                  StatusIcon = Clock;
                  break;
                case 'approved':
                  statusLabel = 'อนุมัติแล้ว';
                  statusClass = 'bg-[#7C8363]/10 text-[#7C8363] border border-[#7C8363]/20';
                  StatusIcon = CheckCircle;
                  break;
                case 'rejected':
                  statusLabel = 'ปฏิเสธ';
                  statusClass = 'bg-[#B36B5C]/10 text-[#B36B5C] border border-[#B36B5C]/20';
                  StatusIcon = XCircle;
                  break;
              }

              return (
                <div key={r.id} className="p-5 hover:bg-[#F9F8F6]/40 transition-colors flex flex-col md:flex-row items-start justify-between gap-4 text-xs">
                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-0.5 font-bold text-[10px] rounded-lg ${typeClass}`}>{typeLabel}</span>
                      <span className="font-bold text-[#3E3E36]">{formatDateTh(r.startDate)} - {formatDateTh(r.endDate)}</span>
                      <span className="text-[#E0DBD3]">•</span>
                      <span className="font-extrabold text-[#5A5A40] bg-[#F1EDE8] px-2 py-0.5 rounded text-[10px]">{r.totalDays} วัน</span>
                    </div>

                    <p className="text-[#5A5A40] font-medium leading-relaxed">
                      <span className="text-[#A9907E] font-medium">เหตุผล: </span>
                      {r.reason}
                    </p>

                    {/* Attachment preview trigger */}
                    {r.attachment && (
                      <button
                        type="button"
                        onClick={() => setSelectedAttachment({
                          name: r.attachment!.name,
                          content: r.attachment!.content,
                          type: r.attachment!.type
                        })}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE8] text-[#5A5A40] hover:bg-[#E0DBD3] rounded-lg text-[10px] font-bold transition-colors mt-1 cursor-pointer border border-[#E0DBD3]/50"
                      >
                        <Paperclip className="h-3 w-3 text-[#7C8363]" />
                        <span>ไฟล์แนบ: {r.attachment.name}</span>
                      </button>
                    )}

                    {/* Manager Feedback */}
                    {r.status !== 'pending' && (
                      <div className="p-3 bg-[#F9F8F6] border border-[#E0DBD3] rounded-2xl space-y-1 mt-2 max-w-lg">
                        <div className="flex items-center justify-between text-[10px] text-[#A9907E] font-bold">
                          <span>ผู้อนุมัติ: {r.approvedBy}</span>
                          <span>{r.approvedAt ? formatDateTh(r.approvedAt) : ''}</span>
                        </div>
                        {r.approverNote && (
                          <p className="text-[#3E3E36] font-medium">
                            <span className="text-[#A9907E] font-medium">บันทึก: </span>
                            {r.approverNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-auto gap-3 shrink-0">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1.5 ${statusClass}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span>{statusLabel}</span>
                    </span>

                    {r.status === 'pending' && (
                      <button
                        type="button"
                        onClick={() => r.id && handleCancelRequest(r.id)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-transparent hover:border-red-200 transition-all text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>ยกเลิกคำขอ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Attachment viewer Modal */}
      <AnimatePresence>
        {selectedAttachment && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#3E3E36]/40 backdrop-blur-sm" onClick={() => setSelectedAttachment(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full border border-[#E0DBD3] shadow-2xl relative z-10"
            >
              <div className="px-6 py-4 bg-[#F1EDE8] border-b border-[#E0DBD3] flex items-center justify-between">
                <span className="text-xs font-bold text-[#3E3E36] truncate">{selectedAttachment.name}</span>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="p-1 hover:bg-[#E0DBD3] text-[#5A5A40] rounded-lg transition-colors font-semibold cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 max-h-[70vh] overflow-y-auto flex items-center justify-center bg-[#F9F8F6]">
                {selectedAttachment.type.startsWith('image/') ? (
                  <img
                    src={selectedAttachment.content}
                    alt={selectedAttachment.name}
                    className="max-h-[60vh] rounded-2xl shadow-sm border border-[#E0DBD3] object-contain"
                  />
                ) : (
                  <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-[#E0DBD3] max-w-sm">
                    <FileText className="h-12 w-12 text-[#7C8363] mx-auto mb-3" />
                    <h4 className="font-bold text-[#3E3E36] text-sm font-serif">ดาวน์โหลดเอกสาร</h4>
                    <p className="text-xs text-[#A9907E] mt-1 font-semibold">ไฟล์นี้ไม่ใช่รูปภาพ คุณสามารถดาวน์โหลดเพื่อเปิดดูได้</p>
                    <a
                      href={selectedAttachment.content}
                      download={selectedAttachment.name}
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C8363] hover:bg-[#5A5A40] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      ดาวน์โหลดไฟล์
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Department edit) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#3E3E36]/40 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full border border-[#E0DBD3] shadow-2xl relative z-10 p-6"
            >
              <h3 className="text-base font-bold text-[#3E3E36] mb-4 font-serif">ตั้งค่าข้อมูลแผนก</h3>
              <form onSubmit={handleUpdateDept} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#A9907E] uppercase mb-1.5">แผนกการทำงาน</label>
                  <select
                    id="department-select"
                    value={deptInput}
                    onChange={(e) => setDeptInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#3E3E36] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20"
                  >
                    <option value="ทั่วไป">ทั่วไป (General)</option>
                    <option value="เทคโนโลยีสารสนเทศ (IT)">เทคโนโลยีสารสนเทศ (IT)</option>
                    <option value="ทรัพยากรบุคคล (HR)">ทรัพยากรบุคคล (HR)</option>
                    <option value="การตลาด (Marketing)">การตลาด (Marketing)</option>
                    <option value="ฝ่ายขาย (Sales)">ฝ่ายขาย (Sales)</option>
                    <option value="การเงินและบัญชี (Finance)">การเงินและบัญชี (Finance)</option>
                  </select>
                </div>
                
                <div className="pt-2 flex items-center justify-end gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-4 py-2 bg-white hover:bg-[#F9F8F6] border border-[#E0DBD3] text-[#5A5A40] rounded-xl cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    id="save-department-btn"
                    type="submit"
                    className="px-4 py-2 bg-[#7C8363] hover:bg-[#5A5A40] text-white rounded-xl shadow-sm cursor-pointer"
                  >
                    บันทึกแผนก
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave Application Modal Form */}
      <LeaveFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsSuccessNotification(true);
          // Auto clear success notification after 5 seconds
          setTimeout(() => {
            setIsSuccessNotification(false);
          }, 6000);
        }}
      />
    </div>
  );
};
