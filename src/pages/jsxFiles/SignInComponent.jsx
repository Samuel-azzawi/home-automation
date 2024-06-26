import React, { useState } from "react";
import signIn from "../../firebase/auth_signin_password";
import { useNavigate } from "react-router-dom";
import "../css/SignInComponent.css";

const SignInComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    signIn(email, password)
      .then(() => {
        navigate("/");
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        setError(error.message);
      });
  };

  return (
    <div className="sign-in-container">
      <form onSubmit={handleSubmit} className="sign-in-form">
        <p className={`error-message ${error ? "show" : ""}`}>
          {error ? "Wrong username or password" : ""}
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default SignInComponent;
