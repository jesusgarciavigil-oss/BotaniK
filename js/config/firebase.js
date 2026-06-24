import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    updateDoc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDReChwrnr6zHLumpR5OLTrNlvfhcAH_BA",
    authDomain: "plantdex-984e6.firebaseapp.com",
    projectId: "plantdex-984e6",
    storageBucket: "plantdex-984e6.firebasestorage.app",
    messagingSenderId: "247992735441",
    appId: "1:247992735441:web:91b0ce9ec849c5876457f0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {
    db,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    updateDoc,
    onSnapshot
};
