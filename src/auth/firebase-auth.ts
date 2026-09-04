import {
    getApp,
    getApps,
    initializeApp,
    type FirebaseOptions,
} from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    signInWithPopup,
    type Auth,
    type User,
} from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim(),
    messagingSenderId:
        import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
};

const hasFirebaseConfig = [
    firebaseConfig.apiKey,
    firebaseConfig.authDomain,
    firebaseConfig.projectId,
    firebaseConfig.appId,
    firebaseConfig.messagingSenderId,
].every(Boolean);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let authInstance: Auth | null | undefined;

class FirebaseAuthSetupError extends Error {
    readonly code = "auth/configuration-not-found";

    constructor() {
        super("Firebase environment variables are missing.");
        this.name = "FirebaseAuthSetupError";
    }
}

function getConfiguredAuth() {
    if (authInstance !== undefined) return authInstance;

    if (!hasFirebaseConfig) {
        authInstance = null;
        return authInstance;
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    authInstance.useDeviceLanguage();

    return authInstance;
}

export function isFirebaseConfigured() {
    return hasFirebaseConfig;
}

export function observeFirebaseAuth(
    onUserChanged: (user: User | null) => void,
    onError: (error: unknown) => void,
) {
    const auth = getConfiguredAuth();

    if (!auth) {
        onUserChanged(null);
        return () => undefined;
    }

    return onAuthStateChanged(auth, onUserChanged, onError);
}

export async function openGoogleSignIn() {
    const auth = getConfiguredAuth();

    if (!auth) throw new FirebaseAuthSetupError();

    await setPersistence(auth, browserLocalPersistence);
    await signInWithPopup(auth, googleProvider);
}
