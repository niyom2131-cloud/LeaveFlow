export type UserRole = 'employee' | 'manager';

export type LeaveType = 'personal' | 'sick' | 'vacation';

export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  department: string;
  sickQuota: number;
  personalQuota: number;
  vacationQuota: number;
  sickUsed: number;
  personalUsed: number;
  vacationUsed: number;
}

export interface Attachment {
  name: string;
  type: string;
  size: number;
  content: string; // Base64 data URL for small files
}

export interface LeaveRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhoto?: string;
  userDepartment?: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  reason: string;
  attachment?: Attachment;
  status: LeaveStatus;
  createdAt: string; // ISO string
  approvedAt?: string;
  approvedBy?: string;
  approverNote?: string;
}
