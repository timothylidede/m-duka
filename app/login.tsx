// Login.tsx
import { useState } from "react";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase"; // Ensure Firebase is initialized

const db = getFirestore(app);

export function Login() {
  const [contact, setContact] = useState<string>("");
  const [passcode, setPasscode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleLogin = async () => {
    setError("");
    if (!contact || !passcode) {
      setError("All fields are required.");
      return;
    }
    if (!/^[0-9]{4}$/.test(passcode)) {
      setError("Invalid passcode format.");
      return;
    }

    try {
      const shopsRef = doc(db, "shops", contact);
      const shopSnapshot = await getDoc(shopsRef);
      if (shopSnapshot.exists() && shopSnapshot.data().password === passcode) {
        alert("Login successful!");
      } else {
        setError("Invalid contact or passcode.");
      }
    } catch (err) {
      setError("Login failed. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="p-8 rounded-lg shadow-md w-96 bg-gray-100">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input
          className="w-full p-2 mb-2 border rounded"
          type="text"
          placeholder="Contact Info"
          onChange={(e) => setContact(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded"
          type="password"
          placeholder="4-digit Passcode"
          maxLength={4}
          onChange={(e) => setPasscode(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          className="w-full bg-blue-500 text-white p-2 rounded mt-2"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}