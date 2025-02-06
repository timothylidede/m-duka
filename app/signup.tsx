// SignUp.tsx
import { useState } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { app } from "../config/firebase"; // Ensure Firebase is initialized

const db = getFirestore(app);

export function SignUp() {
  const [shopName, setShopName] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [passcode, setPasscode] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSignUp = async () => {
    setError("");
    if (!shopName || !contact || !passcode) {
      setError("All fields are required.");
      return;
    }
    if (!/^[0-9]{4}$/.test(passcode)) {
      setError("Passcode must be a 4-digit number.");
      return;
    }

    const shopId = shopName.toLowerCase().replace(/\s+/g, "-");
    try {
      const shopRef = doc(db, "shops", shopId);
      const shopSnapshot = await getDoc(shopRef);
      if (shopSnapshot.exists()) {
        setError("Shop name already exists. Choose another.");
        return;
      }
      await setDoc(shopRef, {
        name: shopName,
        contact,
        password: passcode,
      });
      alert("Shop registered successfully!");
    } catch (err) {
      setError("Error creating shop. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-white">
      <div className="p-8 rounded-lg shadow-md w-96 bg-gray-100">
        <h2 className="text-2xl font-bold mb-4">Register Shop</h2>
        <input
          className="w-full p-2 mb-2 border rounded"
          type="text"
          placeholder="Shop Name"
          onChange={(e) => setShopName(e.target.value)}
        />
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
          onClick={handleSignUp}
        >
          Register
        </button>
      </div>
    </div>
  );
}