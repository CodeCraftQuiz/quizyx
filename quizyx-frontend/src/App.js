import React, { useState } from "react";
import AuthForm from "./components/AuthForm";
import "./App.css";

function App() {
  const [mode, setMode] = useState("login"); // "login" lub "register"

  return (
    <div className="app-container">
      <div className="auth-wrapper">
        <div className="logo">🧠 Quizyx</div>
        <AuthForm mode={mode} setMode={setMode} />
      </div>
    </div>
  );
}

export default App;