import React, { createContext, useContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getMQTTCredentials } from "./mqttUtils";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [mqttCredentials, setMqttCredentials] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        const credentials = await getMQTTCredentials(user.uid);
        setMqttCredentials(credentials);
      } else {
        // User is not signed in
        setCurrentUser(null);
        setMqttCredentials(null);
      }
    });

    return unsubscribe; // Unsubscribe on cleanup
  }, []);

  const value = { currentUser, mqttCredentials };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
