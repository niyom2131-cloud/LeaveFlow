import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc,
  increment,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { LeaveRequest, LeaveStatus, LeaveType } from '../types';

// Submit leave request
export const submitLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
  const path = 'leaveRequests';
  try {
    const requestsCollection = collection(db, path);
    const fullRequest: Omit<LeaveRequest, 'id'> = {
      ...requestData,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    return await addDoc(requestsCollection, fullRequest);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// Cancel (delete or set to cancelled) a pending leave request
export const cancelLeaveRequest = async (requestId: string) => {
  const path = `leaveRequests/${requestId}`;
  try {
    const docRef = doc(db, 'leaveRequests', requestId);
    return await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// Approve or reject a leave request
export const processLeaveRequest = async (
  requestId: string, 
  status: 'approved' | 'rejected', 
  userId: string, 
  leaveType: LeaveType, 
  totalDays: number, 
  approverEmail: string, 
  approverNote: string = ''
) => {
  const path = `leaveRequests/${requestId}`;
  try {
    const batch = writeBatch(db);
    
    // 1. Update the leave request document
    const requestDocRef = doc(db, 'leaveRequests', requestId);
    batch.update(requestDocRef, {
      status,
      approvedAt: new Date().toISOString(),
      approvedBy: approverEmail,
      approverNote
    });
    
    // 2. If approved, increment the user's used leave days
    if (status === 'approved') {
      const userDocRef = doc(db, 'users', userId);
      const fieldToIncrement = 
        leaveType === 'sick' ? 'sickUsed' : 
        leaveType === 'personal' ? 'personalUsed' : 
        'vacationUsed';
        
      batch.update(userDocRef, {
        [fieldToIncrement]: increment(totalDays)
      });
    }
    
    return await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Listen to leave requests of a specific user
export const subscribeUserRequests = (userId: string, callback: (requests: LeaveRequest[]) => void) => {
  const path = 'leaveRequests';
  const q = query(
    collection(db, path),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests: LeaveRequest[] = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as LeaveRequest);
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// Listen to all leave requests (for managers)
export const subscribeAllRequests = (callback: (requests: LeaveRequest[]) => void) => {
  const path = 'leaveRequests';
  const q = query(
    collection(db, path),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests: LeaveRequest[] = [];
    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as LeaveRequest);
    });
    callback(requests);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
