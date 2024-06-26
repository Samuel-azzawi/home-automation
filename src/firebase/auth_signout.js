import { getAuth, signOut as firebaseSignOut } from 'firebase/auth';

const signOut = async (onSuccess) => {
  const auth = getAuth();
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully');
    if (onSuccess) onSuccess();
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export default signOut;
