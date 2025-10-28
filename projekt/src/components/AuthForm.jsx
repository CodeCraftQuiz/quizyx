// src/components/AuthForm.jsx
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = {
        email: formData.email,
        password: formData.password,
      };

      // Backend nie przyjmuje username — usuwamy to pole
      // (Twój model User ma tylko email i password)

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ " + data.message);
        if (mode === "login") {
          window.location.href = "/profile"; // przekierowanie do profilu
        }
      } else {
        alert("❌ " + (data.details ? data.details.join(", ") : data.message));
      }
    } catch (err) {
      alert("❌ Błąd połączenia z serwerem");
    }
  };

  return (
    <div className="form-container">
      <h2>{mode === "login" ? "Zaloguj się" : "Rejestracja"}</h2>

      <form onSubmit={handleSubmit}>
        {/* UWAGA: Twój backend NIE przyjmuje username — usuwamy to pole */}
        {/* Jeśli chcesz dodać username, musisz zmodyfikować model User */}
        
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