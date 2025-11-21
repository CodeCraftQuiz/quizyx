# Quiz App
## Technologie
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React, Vite, Tailwind CSS
- **Autoryzacja:** JWT

## Struktura
- `/server` - Kod serwera (API)
- `/client` - Kod klienta (React)

## Instalacja i Uruchomienie

### 1. Backend (Serwer)
Wymagane: MongoDB uruchomione lokalnie lub skonfigurowany `MONGO_URI` w `.env`.

```bash
cd server
npm install
# Upewnij się, że masz plik .env z MONGO_URI i JWT_SECRET
npm start
```
Serwer wystartuje na porcie 5000.

### 2. Frontend (Klient)
```bash
cd client
npm install
npm run dev
```
Aplikacja dostępna pod adresem wskazanym przez Vite (zazwyczaj http://localhost:5173).

## Funkcjonalności
1. **Rejestracja i Logowanie:** Użytkownicy i Administratorzy.
2. **Tryby Gry:**
   - **Standard:** Klasyczny quiz.
   - **Rankingowy:** Punkty maleją z czasem.
   - **Egzamin:** Limit czasu na cały quiz, wyniki na końcu.
   - **Milionerzy:** Koła ratunkowe (50/50, Publiczność, Zmiana pytania).
   - **Nieskończony:** Losowe pytania do 3 błędów.
3. **Panel Admina:** Tworzenie i edycja quizów.
4. **Pojedynek:** Tryb offline dla 2 graczy (hotseat).
5. **Rankingi i Statystyki:** Globalne i per quiz.

## Konto Administratora
Aby stworzyć administratora, możesz ręcznie zmienić rolę użytkownika w bazie danych MongoDB na `ADMIN` lub użyć narzędzia typu MongoDB Compass.
Domyślnie nowi użytkownicy mają rolę `USER`.
