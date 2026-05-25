import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  increment, 
  collection, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  Timestamp, 
  deleteDoc, 
  getDocs, 
  limit, 
  getDoc, 
  getDocFromServer, 
  startAfter,
  initializeFirestore
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import firebaseConfig from './firebase-applet-config.json';

// Define flags padrão para a inicialização
const firebaseAppConfig = {
  apiKey: (firebaseConfig.apiKey || "").trim(),
  authDomain: (firebaseConfig.authDomain || "").trim(),
  projectId: (firebaseConfig.projectId || "").trim(),
  storageBucket: (firebaseConfig.storageBucket || "").trim(),
  messagingSenderId: (firebaseConfig.messagingSenderId || "").trim(),
  appId: (firebaseConfig.appId || "").trim(),
  measurementId: (firebaseConfig.measurementId || "").trim(),
};

const databaseId = (firebaseConfig as any).firestoreDatabaseId || "";

console.log("[Firebase] Initializing with Project ID:", firebaseAppConfig.projectId);
console.log("[Firebase] API Key (masked):", firebaseAppConfig.apiKey ? `${firebaseAppConfig.apiKey.substring(0, 8)}...` : "NOT FOUND");

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseAppConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider setup with Workspace Scopes
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with the specific database ID from config
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId || undefined);

export const storage = getStorage(app);

// In-memory access token cache
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  if (errMessage.includes('offline')) {
    console.warn("[Firebase] suppressed offline error throw to allow app execution.");
    return;
  }

  throw new Error(JSON.stringify(errInfo));
}

export const testConnection = async () => {
  try {
    const testDoc = await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test result:", testDoc.exists());

    // Debug
    if (auth.currentUser) {
        const convoMatch = await getDocFromServer(doc(db, 'conversations', 'vuIxOLrp7sfJJpcxDjwl'));
        console.log("DEBUG: convo exists?", convoMatch.exists(), "data:", convoMatch.data());
    }
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("[Firebase] Client is offline, but it might connect shortly. Error:", error);
    }
    console.warn("Firestore connection test encountered an issue.", error);
  }
}

// Ensure the connection is tested upon app boot
testConnection();

export {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    doc,
    onSnapshot,
    setDoc,
    serverTimestamp,
    updateDoc,
    increment,
    ref,
    uploadBytes,
    getDownloadURL,
    collection,
    query,
    where,
    orderBy,
    addDoc,
    Timestamp,
    deleteDoc,
    getDocs,
    limit,
    getDoc,
    getDocFromServer,
    startAfter
};
