import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { subscribeAllRequests, processLeaveRequest } from '../lib/leave-service';
import { LeaveRequest, LeaveType } from '../types';
import { 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  SlidersHorizontal, 
  Paperclip, 
  UserCheck, 
  FileText,
  Users,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

export const ManagerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'employees'>('requests');
  
  // Filtering and searching
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | LeaveType>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  
  // Note inputs for approvals
  const [noteInputs, setNoteInputs] = useState<{[key: string]: string}>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<{name: string, content: string, type: string} | null>(null);

  useEffect(() => {
    // 1. Subscribe to all leave requests
    const unsubRequests = subscribeAllRequests((data) => {
      setRequests(data);
    });

    // 2. Subscribe to all employee profiles for the employee listing tab
    const q = query(collection(db, 'users'));
    const unsubEmployees = onSnapshot(q, (snapshot) => {
      const empList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        empList.push(doc.data() as UserProfile);
      });
      setEmployees(empList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });

    return () => {
      unsubRequests();
      unsubEmployees();
    };
  }, []);

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

  const handleAction = async (requestId: string, status: 'approved' | 'rejected', userId: string, leaveType: LeaveType, totalDays: number) => {
    const note = noteInputs[requestId] || '';
    const confirmMsg = status === 'approved' 
      ? 'คุณต้องการอนุมัติใบลาหยุดนี้ใช่หรือไม่?' 
      : 'คุณต้องการปฏิเสธใบลาหยุดนี้ใช่หรือไม่?';

    if (window.confirm(confirmMsg)) {
      try {
        setProcessingId(requestId);
        await processLeaveRequest(
          requestId,
          status,
          userId,
          leaveType,
          totalDays,
          profile.email,
          note
        );
        
        // Clear note
        setNoteInputs(prev => {
          const updated = { ...prev };
          delete updated[requestId];
          return updated;
          return updated;
        });
      } catch (err) {
        console.error('Error processing leave request:', err);
        alert('เกิดข้อผิดพลาดในการทำรายการ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleNoteChange = (requestId: string, val: string) => {
    setNoteInputs(prev => ({
      ...prev,
      [requestId]: val
    }));
  };

  // Get distinct departments for filter dropdown
  const departments = Array.from(new Set(employees.map(e => e.department || 'ทั่วไป'))).filter(Boolean);

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.userName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    const matchesType = typeFilter === 'all' ? true : r.leaveType === typeFilter;
    const matchesDept = deptFilter === 'all' ? true : r.userDepartment === deptFilter;

    return matchesSearch && matchesStatus && matchesType && matchesDept;
  });

  // Filter employees for directory
  const filteredEmployees = employees.filter((e) => {
    const matchesSearch = 
      e.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'all' ? true : e.department === deptFilter;
    
    return matchesSearch && matchesDept;
  });

  // Count summaries
  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8 font-sans text-[#3E3E36]">
      {/* Analytics Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A9907E] uppercase tracking-wider">ใบลาที่รอการอนุมัติ</span>
            <h3 className="text-2xl font-black text-[#3E3E36] mt-1 font-serif">{pendingCount} รายการ</h3>
          </div>
          <div className="p-3 bg-[#A9907E]/10 text-[#A9907E] rounded-xl border border-[#A9907E]/20">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A9907E] uppercase tracking-wider">อนุมัติแล้ว (สถิติล่าสุด)</span>
            <h3 className="text-2xl font-black text-[#3E3E36] mt-1 font-serif">{approvedCount} รายการ</h3>
          </div>
          <div className="p-3 bg-[#7C8363]/10 text-[#7C8363] rounded-xl border border-[#7C8363]/20">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A9907E] uppercase tracking-wider">ปฏิเสธใบลาแล้ว</span>
            <h3 className="text-2xl font-black text-[#3E3E36] mt-1 font-serif">{rejectedCount} รายการ</h3>
          </div>
          <div className="p-3 bg-[#B36B5C]/10 text-[#B36B5C] rounded-xl border border-[#B36B5C]/20">
            <XCircle className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-5 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#A9907E] uppercase tracking-wider">พนักงานในระบบทั้งหมด</span>
            <h3 className="text-2xl font-black text-[#3E3E36] mt-1 font-serif">{employees.length} คน</h3>
          </div>
          <div className="p-3 bg-[#5A5A40]/10 text-[#5A5A40] rounded-xl border border-[#5A5A40]/20">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[#E0DBD3] text-xs font-bold gap-6 select-none">
        <button
          onClick={() => { setActiveTab('requests'); setSearchTerm(''); }}
          className={`pb-3 border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'requests' 
              ? 'border-[#7C8363] text-[#7C8363] font-bold' 
              : 'border-transparent text-[#A9907E] hover:text-[#3E3E36]'
          }`}
        >
          รายการคำขอลาหยุด
        </button>
        <button
          onClick={() => { setActiveTab('employees'); setSearchTerm(''); }}
          className={`pb-3 border-b-2 px-1 transition-all cursor-pointer ${
            activeTab === 'employees' 
              ? 'border-[#7C8363] text-[#7C8363] font-bold' 
              : 'border-transparent text-[#A9907E] hover:text-[#3E3E36]'
          }`}
        >
          ทำเนียบพนักงานและวันลาคงเหลือ
        </button>
      </div>

      {/* Search & Filter section */}
      <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A9907E]" />
          <input
            id="manager-search-input"
            type="text"
            placeholder={activeTab === 'requests' ? "ค้นหาด้วยชื่อพนักงาน อีเมล หรือเหตุผลการลา" : "ค้นหาชื่อพนักงาน หรือ อีเมลพนักงาน"}
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

          {activeTab === 'requests' && (
            <select
              id="m-status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#5A5A40] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/10 cursor-pointer"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="pending">รอการพิจารณาอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ปฏิเสธใบลา</option>
            </select>
          )}

          {activeTab === 'requests' && (
            <select
              id="m-type-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#5A5A40] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/10 cursor-pointer"
            >
              <option value="all">ประเภทการลาทั้งหมด</option>
              <option value="sick">ลาป่วย</option>
              <option value="personal">ลากิจ</option>
              <option value="vacation">ลาพักร้อน</option>
            </select>
          )}

          <select
            id="m-dept-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-2 border border-[#E0DBD3] rounded-xl text-xs bg-white text-[#5A5A40] font-bold focus:outline-none focus:ring-2 focus:ring-[#7C8363]/10 cursor-pointer"
          >
            <option value="all">แผนกทั้งหมด</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'requests' ? (
        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm overflow-hidden">
          <div className="px-6 py-4.5 bg-[#F1EDE8] border-b border-[#E0DBD3] flex items-center justify-between">
            <h3 className="font-bold text-[#3E3E36] text-sm flex items-center gap-2 font-serif">
              <UserCheck className="h-4 w-4 text-[#7C8363]" />
              <span>รายการขอลาหยุดจากพนักงาน</span>
            </h3>
            <span className="text-[10px] font-bold text-[#A9907E] bg-white px-2.5 py-1 rounded-full border border-[#E0DBD3]/50">พบใบลา {filteredRequests.length} รายการ</span>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="h-10 w-10 text-[#A9907E]/40 mx-auto mb-3" />
              <h4 className="font-bold text-[#3E3E36] text-xs font-serif">ไม่มีรายการใบลาที่ต้องพิจารณา</h4>
              <p className="text-[10px] text-[#A9907E] mt-1 font-medium">ใบลาหยุดทั้งหมดได้รับการจัดการแล้ว หรือไม่มีรายการตามตัวกรองของท่าน</p>
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

                // Check remaining quota of this user to display to the manager
                const userProfile = employees.find(e => e.uid === r.userId);
                let remainingQuotaText = '';
                if (userProfile) {
                  const rem = r.leaveType === 'sick' ? userProfile.sickQuota - userProfile.sickUsed :
                              r.leaveType === 'personal' ? userProfile.personalQuota - userProfile.personalUsed :
                              userProfile.vacationQuota - userProfile.vacationUsed;
                  remainingQuotaText = `(โควต้าคงเหลือปัจจุบัน: ${rem} วัน)`;
                }

                return (
                  <div key={r.id} className="p-6 hover:bg-[#F9F8F6]/40 transition-colors flex flex-col lg:flex-row items-start justify-between gap-6 text-xs">
                    <div className="space-y-3.5 flex-1 w-full">
                      {/* Employee Profile info */}
                      <div className="flex items-center gap-3">
                        <img
                          src={r.userPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'}
                          alt={r.userName}
                          className="h-10 w-10 rounded-full object-cover border border-[#E0DBD3]"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#3E3E36]">{r.userName}</span>
                            <span className="px-2 py-0.5 bg-[#F1EDE8] text-[#7C8363] rounded-lg text-[9px] font-bold border border-[#E0DBD3]/40">
                              {r.userDepartment}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#A9907E] mt-0.5 font-medium">{r.userEmail}</p>
                        </div>
                      </div>

                      {/* Leave parameters */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className={`px-2.5 py-0.5 font-bold text-[10px] rounded-lg ${typeClass}`}>{typeLabel}</span>
                        <span className="font-bold text-[#3E3E36]">{formatDateTh(r.startDate)} - {formatDateTh(r.endDate)}</span>
                        <span className="text-[#E0DBD3]">•</span>
                        <span className="font-black text-[#5A5A40] bg-[#F1EDE8] px-2 py-0.5 rounded text-[10px]">{r.totalDays} วัน</span>
                        <span className="text-[10px] text-[#A9907E] font-bold italic">{remainingQuotaText}</span>
                      </div>

                      <p className="text-[#3E3E36] font-medium leading-relaxed bg-[#F9F8F6] border border-[#E0DBD3] rounded-2xl p-3 max-w-2xl">
                        <span className="text-[#A9907E] font-bold block mb-1">เหตุผลการขอลา:</span>
                        {r.reason}
                      </p>

                      {/* File attachment preview */}
                      {r.attachment && (
                        <div>
                          <button
                            type="button"
                            onClick={() => setSelectedAttachment({
                              name: r.attachment!.name,
                              content: r.attachment!.content,
                              type: r.attachment!.type
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F1EDE8] text-[#5A5A40] hover:bg-[#E0DBD3] rounded-xl text-[10px] font-bold transition-all border border-[#E0DBD3]/40 cursor-pointer"
                          >
                            <Paperclip className="h-3 w-3 text-[#7C8363]" />
                            <span>ดูไฟล์แนบของพนักงาน: {r.attachment.name}</span>
                          </button>
                        </div>
                      )}

                      {/* Comments from manager (if already processed) */}
                      {r.status !== 'pending' && (
                        <div className="p-3 bg-[#F9F8F6] rounded-2xl border border-[#E0DBD3] text-[#5A5A40] max-w-xl">
                          <p className="font-bold text-[#3E3E36] text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-[#7C8363]" />
                            <span>การจัดการเรียบร้อยโดย: {r.approvedBy}</span>
                          </p>
                          {r.approverNote && (
                            <p className="italic mt-0.5 text-[#3E3E36] font-bold">"{r.approverNote}"</p>
                          )}
                          <p className="text-[10px] text-[#A9907E] mt-1 font-bold">เวลาพิจารณา: {r.approvedAt ? formatDateTh(r.approvedAt) : ''}</p>
                        </div>
                      )}
                    </div>

                    {/* Decision Actions (Only show for pending) */}
                    {r.status === 'pending' ? (
                      <div className="w-full lg:w-72 shrink-0 bg-[#F9F8F6] rounded-2xl border border-[#E0DBD3] p-4 space-y-3.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A9907E] mb-1.5">
                            ระบุเหตุผล / บันทึกเพิ่มเติม (ระบุหรือไม่ก็ได้)
                          </label>
                          <textarea
                            id={`approver-note-${r.id}`}
                            rows={2}
                            value={noteInputs[r.id!] || ''}
                            onChange={(e) => handleNoteChange(r.id!, e.target.value)}
                            placeholder="เช่น อนุมัติให้ลา, แนะนำให้ดูแลสุขภาพ"
                            className="w-full p-2.5 border border-[#E0DBD3] bg-white rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#7C8363]/20 placeholder-[#A9907E]/70 text-[#3E3E36] font-medium"
                          />
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            id={`reject-btn-${r.id}`}
                            onClick={() => handleAction(r.id!, 'rejected', r.userId, r.leaveType, r.totalDays)}
                            disabled={processingId !== null}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#B36B5C]/10 hover:bg-[#B36B5C]/20 text-[#B36B5C] font-bold border border-[#B36B5C]/30 rounded-xl transition-all cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                            <span>ปฏิเสธ</span>
                          </button>
                          
                          <button
                            id={`approve-btn-${r.id}`}
                            onClick={() => handleAction(r.id!, 'approved', r.userId, r.leaveType, r.totalDays)}
                            disabled={processingId !== null}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#7C8363] hover:bg-[#5A5A40] text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                          >
                            <Check className="h-4 w-4" />
                            <span>อนุมัติ</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="shrink-0 pt-2 lg:pt-0">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-xl flex items-center gap-1.5 ${
                          r.status === 'approved' ? 'bg-[#7C8363]/10 text-[#7C8363] border border-[#7C8363]/20' : 'bg-[#B36B5C]/10 text-[#B36B5C] border border-[#B36B5C]/20'
                        }`}>
                          {r.status === 'approved' ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                          <span>{r.status === 'approved' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธใบลาแล้ว'}</span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Employee Directory & Balance View */
        <div className="bg-white rounded-3xl border border-[#E0DBD3] shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-[#F1EDE8] border-b border-[#E0DBD3] flex items-center justify-between">
            <h3 className="font-bold text-[#3E3E36] text-sm flex items-center gap-2 font-serif">
              <Building2 className="h-4 w-4 text-[#7C8363]" />
              <span>ทำเนียบพนักงานและโควต้าวันลา</span>
            </h3>
            <span className="text-[10px] font-bold text-[#A9907E] bg-white px-2.5 py-1 rounded-full border border-[#E0DBD3]/50">พนักงาน {filteredEmployees.length} คน</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9F8F6] text-[#5A5A40] font-bold border-b border-[#E0DBD3]">
                  <th className="py-4 px-6">พนักงาน</th>
                  <th className="py-4 px-4">แผนกการทำงาน</th>
                  <th className="py-4 px-4 text-center">ลาป่วย (คงเหลือ / โควต้า)</th>
                  <th className="py-4 px-4 text-center">ลากิจ (คงเหลือ / โควต้า)</th>
                  <th className="py-4 px-4 text-center">ลาพักร้อน (คงเหลือ / โควต้า)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1EDE8] font-semibold text-[#3E3E36]">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-[#A9907E] text-xs">ไม่พบข้อมูลพนักงาน</td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
                    <tr key={emp.uid} className="hover:bg-[#F9F8F6]/40 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <img
                          src={emp.photoURL}
                          alt={emp.displayName}
                          className="h-8.5 w-8.5 rounded-full object-cover border border-[#E0DBD3]"
                        />
                        <div>
                          <p className="font-bold text-[#3E3E36]">{emp.displayName}</p>
                          <p className="text-[10px] text-[#A9907E] mt-0.5 font-medium">{emp.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-[#5A5A40]">
                        <span className="px-2.5 py-0.5 bg-[#F1EDE8] text-[#7C8363] rounded-lg text-[10px] font-bold border border-[#E0DBD3]/30">
                          {emp.department || 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-extrabold text-[#3E3E36] font-serif">{emp.sickQuota - emp.sickUsed}</span>
                        <span className="text-[#A9907E] font-medium"> / {emp.sickQuota} วัน</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-extrabold text-[#3E3E36] font-serif">{emp.personalQuota - emp.personalUsed}</span>
                        <span className="text-[#A9907E] font-medium"> / {emp.personalQuota} วัน</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-extrabold text-[#3E3E36] font-serif">{emp.vacationQuota - emp.vacationUsed}</span>
                        <span className="text-[#A9907E] font-medium"> / {emp.vacationQuota} วัน</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected attachment preview modal */}
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
    </div>
  );
};
