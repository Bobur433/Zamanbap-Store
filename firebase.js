import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    updateDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


const firebaseConfig = {

    apiKey: "AIzaSyC88cNGtkRAQJoQ5HvDNFjfEAW-xGxExJU",

    authDomain: "zamanbap-store.firebaseapp.com",

    projectId: "zamanbap-store",

    storageBucket: "zamanbap-store.firebasestorage.app",

    messagingSenderId: "959886660564",

    appId: "1:959886660564:web:4404160ee0835d0c40bc41"

};



const app = initializeApp(firebaseConfig);


const db = getFirestore(app);



export {

    db,

    collection,

    addDoc,

    getDocs,

    deleteDoc,

    doc,

    updateDoc,

    getDoc

};