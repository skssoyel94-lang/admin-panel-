import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

const app = initializeApp({
  "apiKey": "AIzaSyBsBGxWbL6DIgMlND3eUAVNRHsBH4VKquo",
  "authDomain": "v-cloud-storage.firebaseapp.com",
  "projectId": "v-cloud-storage"
});

const auth = getAuth(app);

async function run() {
  try {
    await sendPasswordResetEmail(auth, "sks584845@gmail.com");
    console.log("Success");
  } catch(e) {
    console.log("Error:", e.message);
  }
}
run();
