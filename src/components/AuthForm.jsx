import React, { useState } from "react";
import "./AuthForm.css";

const AuthForm = ({ mode, setMode }) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Tryb: ${mode.toUpperCase()}\n${JSON.stringify(formData, null, 2)}`);
    // 🔗 Tu możesz dodać fetch('/api/login') lub axios do backendu
  };

  return (
    <div className="form-container">
      <h2>{mode === "login" ? "Zaloguj się" : "Rejestracja"}</h2>

      <form onSubmit={handleSubmit}>
        {mode === "register" && (
          <input
            type="text"
            name="username"
            placeholder="Nazwa użytkownika"
            value={formData.username}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Hasło"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">
          {mode === "login" ? "Zaloguj" : "Utwórz konto"}
        </button>
      </form>

      {mode === "login" ? (
        <p>
          Nie masz konta?{" "}
          <span className="toggle" onClick={() => setMode("register")}>
            Zarejestruj się
          </span>
        </p>
      ) : (
        <p>
          Masz już konto?{" "}
          <span className="toggle" onClick={() => setMode("login")}>
            Zaloguj się
          </span>
        </p>
      )}
    </div>
  );
};

export default AuthForm;