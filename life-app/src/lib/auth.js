import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "./firebase";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { Capacitor } from "@capacitor/core";

export const googleLogin = async () => {
  if (Capacitor.isNativePlatform()) {
    const result = await FirebaseAuthentication.signInWithGoogle();

    if (result.credential?.idToken) {
      const { GoogleAuthProvider, signInWithCredential } =
        await import("firebase/auth");

      const credential = GoogleAuthProvider.credential(
        result.credential.idToken
      );

      return await signInWithCredential(auth, credential);
    }

    throw new Error("Google ID token nahi mila. Firebase configuration check karein.");
  }

  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

export const setupRecaptcha = (elementId) => {
  if (window.recaptchaVerifier) {
    return window.recaptchaVerifier;
  }

  window.recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: "normal",
  });

  return window.recaptchaVerifier;
};

export const phoneLogin = (phoneNumber, verifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
};

export { auth, onAuthStateChanged, signOut };