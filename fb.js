import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,onAuthStateChanged,signOut,signInAnonymously,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,setDoc,deleteDoc,onSnapshot} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
const app=initializeApp({apiKey:"AIzaSyATaNVaiJDedncR05srz3Lf75yrtx6quDI",authDomain:"asif-coal.firebaseapp.com",projectId:"asif-coal",storageBucket:"asif-coal.firebasestorage.app",messagingSenderId:"938716653120",appId:"1:938716653120:web:3038e1c6cffc6e9566e1a5"});
const auth=getAuth(app);setPersistence(auth,browserLocalPersistence).catch(()=>{});
let db;try{db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}catch(e){db=initializeFirestore(app,{})}
getRedirectResult(auth).catch(e=>console.error(e));
const prov=new GoogleAuthProvider();prov.setCustomParameters({prompt:'select_account'});
window.FB={
  onAuth:cb=>onAuthStateChanged(auth,cb),
  login:async()=>{try{return await signInWithPopup(auth,prov)}catch(e){if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment','auth/cancelled-popup-request'].includes(e.code))return signInWithRedirect(auth,prov);throw e}},
  logout:()=>signOut(auth),
  anon:()=>signInAnonymously(auth),
  set:(b,id,d)=>setDoc(doc(db,...b,id),d),
  del:(b,id)=>deleteDoc(doc(db,...b,id)),
  listen:(b,next,err)=>onSnapshot(collection(db,...b),{includeMetadataChanges:true},next,err),
};
window.dispatchEvent(new Event('fb-ready'));
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
