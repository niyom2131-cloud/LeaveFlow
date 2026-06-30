import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALt6XXziFbUXlpQfk_OVYN8yyYdw_z89g",
  authDomain: "canvas-genius-474503-e7.firebaseapp.com",
  projectId: "canvas-genius-474503-e7",
  storageBucket: "canvas-genius-474503-e7.firebasestorage.app",
  messagingSenderId: "540494151151",
  appId: "1:540494151151:web:f050f158c2bfbe7b66ca1a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "ai-studio-onlineleaveform-17f02941-ef9c-4e07-8402-20999ed9ac73");
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Standard scopes for basic profile and email
googleProvider.addScope('email');
googleProvider.addScope('profile');

export { app, auth, db, googleProvider };
