import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { firebaseConfig } from "../config/firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// register form
const form = document.getElementById("register-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
});

function validateRegistrationCredentials(username, email, password, confirmPassword){
  if (!username || !email || !password || !confirmPassword) {
    alert("Please fill in all fields");
    return false;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match");
    return false;
  }

  return true;
}

function validateLoginCredentials(email, password){
  if (!email || !password) {
    alert("Please fill in all fields");
    return false;
  }

  return true;
}

document.getElementById("register-button").addEventListener("click", async () => {
  const name = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("register-confirm-password").value;

  if (!validateRegistrationCredentials(name, email, password, confirmPassword)) {
    return;
  }

  try {
    const userCredentials = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredentials.user;

    await set(ref(db, `users/${user.uid}`), {
      username: name,
      email: email,
    });

    alert("User registered successfully");
    
    window.location.href = "home.html";
  } catch (error) {
    console.log(error);
    let errorMessage = "An error occurred. Please try again.";
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = "The email address is already in use.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "The email address is invalid.";
    }
    
    alert(errorMessage);
  }
});

// login form
const loginForm = document.getElementById("login-form");
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
});

document.getElementById("login-button").addEventListener("click", async () => {
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  if (!validateLoginCredentials(email, password)) {
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("User logged in successfully");
    window.location.href = "home.html";
  } catch (error) {
    console.log(error);
    let errorMessage = "An error occurred. Please try again.";
    if (error.code === 'auth/user-not-found') {
      errorMessage = "User not found";
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = "Incorrect password";
    }
    
    alert(errorMessage);
  }
});

