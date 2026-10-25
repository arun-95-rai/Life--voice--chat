import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCPhLWnhCK8To6HVagVMruxpgglsxjWv60",
  authDomain: "life-voice-chat.firebaseapp.com",
  projectId: "life-voice-chat",
  storageBucket: "life-voice-chat.firebasestorage.app",
  messagingSenderId: "595515385773",
  appId: "1:595515385773:web:0c6ab62bae75e8a33be324"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
