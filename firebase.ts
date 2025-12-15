import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBh-Jcq9VnmbmiEMv09i5KlAmBUmw0sTb4",
  authDomain: "financeiro-aci.firebaseapp.com",
  projectId: "financeiro-aci",
  storageBucket: "financeiro-aci.firebasestorage.app",
  messagingSenderId: "652429637116",
  appId: "1:652429637116:web:2690c0657bf5f521826e79"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

export { app, auth, db };