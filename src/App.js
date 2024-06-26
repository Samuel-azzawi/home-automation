import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import HomePage from "./pages/jsxFiles/HomePage/HomePage";
import Toolbar from "./pages/jsxFiles/Toolbar";
import Graphs from "./pages/jsxFiles/Graphs";
import About from "./pages/jsxFiles/About";
import SignInComponent from "./pages/jsxFiles/SignInComponent";
import { AuthProvider, useAuth } from "./firebase/useAuth";
import "./App.css";
import { DataProvider } from "./pages/DataContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Audio } from "react-loader-spinner";

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <AppRoutes />
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;

const AppRoutes = () => {
  const { currentUser } = useAuth();
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  if (!authInitialized) {
    return <Audio />;
  }

  return (
    <>
      {currentUser && <Toolbar />}
      <div className="main-content">
        <Routes>
          <Route
            path="/SignIn"
            element={
              currentUser ? <Navigate replace to="/" /> : <SignInComponent />
            }
          />
          {currentUser ? (
            <>
              <Route path="/" element={<HomePage />} />
              <Route path="/Graphs" element={<Graphs />} />
              <Route path="/About" element={<About />} />
            </>
          ) : (
            <Route path="*" element={<Navigate replace to="/SignIn" />} />
          )}
        </Routes>
      </div>
    </>
  );
};
