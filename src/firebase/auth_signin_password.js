import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "./firebaseConfig";

const auth = getAuth(app);

const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Authentication successful
      return userCredential.user;
    })
    .catch((error) => {
      // Handle errors here
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error(`Error during sign-in (${errorCode}): ${errorMessage}`);
      throw new Error(errorMessage);
    });
};

export default signIn;
