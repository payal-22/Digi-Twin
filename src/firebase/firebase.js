import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyDuyGH9dDhj_OApdzcuj75ai4hQ9sj4mpA',
  authDomain: 'fin-twin.firebaseapp.com',
  projectId: 'fin-twin',
  storageBucket: 'fin-twin.appspot.com',
  messagingSenderId: '626538386220',
  appId: '1:626538386220:web:1b4e89f1ca23ce749a1289',
  measurementId: 'G-MB8P2XP3LJ',
  clientId: '626538386220-id8ic7ecu7u50aaa90ft7ircad04lhmk.apps.googleusercontent.com',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

export { auth, db, functions };