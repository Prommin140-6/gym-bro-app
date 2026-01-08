import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-expect-error - Firebase types บางเวอร์ชันไม่ expose getReactNativePersistence แต่ runtime มีจริง
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // ✅ เพิ่ม
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyCMwc5ppyZw_Q-JNqFjnDBVWGB1l-K8BS4",
    authDomain: "gymbroapp-e7cad.firebaseapp.com",
    projectId: "gymbroapp-e7cad",
    storageBucket: "gymbroapp-e7cad.firebasestorage.app",
    messagingSenderId: "1005544128256",
    appId: "1:1005544128256:web:d62ea46971a44415f37de5",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
    try {
        return initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
    } catch {
        // กัน error: auth already initialized (ตอน Fast Refresh)
        return getAuth(app);
    }
})();

export const db = getFirestore(app);

// ✅ เพิ่ม Storage สำหรับอัปโหลดรูป
export const storage = getStorage(app);
