const { initializeApp } = require('firebase/app');
const { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword } = require('firebase/auth');

const app = initializeApp({
  "apiKey": "AIzaSyBsBGxWbL6DIgMlND3eUAVNRHsBH4VKquo",
  "authDomain": "v-cloud-storage.firebaseapp.com",
  "databaseURL": "https://v-cloud-storage-default-rtdb.asia-southeast1.firebasedatabase.app",
  "projectId": "v-cloud-storage",
  "storageBucket": "v-cloud-storage.firebasestorage.app",
  "messagingSenderId": "367814757584",
  "appId": "1:367814757584:web:83848f9cbbf07006a1a2d5",
  "measurementId": "G-KXZ5S9V004"
});

const auth = getAuth(app);

async function test() {
  try {
    const testEmail = "testuser_random123@example.com";
    console.log("Trying to reset password for non-existent email...");
    await sendPasswordResetEmail(auth, testEmail);
    console.log("Success (Email Enumeration Protection is ON or it sent)");
    
    // Attempt to register a real one? (Wait, I shouldn't register a real one unless needed)
  } catch (e) {
    console.log("Error:", e.message);
  }
}
test();
