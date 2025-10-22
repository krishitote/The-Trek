// src/pages/Profile.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, session, setUser } = useAuth();
  const [weight, setWeight] = useState(user?.weight || "");
  const [height, setHeight] = useState(user?.height || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const calculateBMI = (w, h) => {
    if (!w || !h) return null;
    const heightM = h / 100;
    return (w / (heightM * heightM)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  const handleSave = async () => {
    if (!weight || !height) {
      setMessage("Please enter both weight and height.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/users/${user.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ weight: Number(weight), height: Number(height) }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      if (setUser) setUser(data);
      localStorage.setItem("user", JSON.stringify(data));

      setMessage("Profile updated successfully!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  const bmi = calculateBMI(weight, height);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

      <div className="p-6 bg-gray-50 rounded-lg shadow flex space-x-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <img
            src={
              user.profile_image
                ? `${import.meta.env.VITE_API_URL}${user.profile_image}`
                : "/default-avatar.png"
            }
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
          <label className="mt-2 cursor-pointer text-blue-600 hover:underline">
            Change Photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append("photo", file);

                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${session.token}` },
                  body: formData,
                });

                const data = await res.json();
                if (res.ok) {
                  const updatedUser = { ...user, profile_image: data.profile_image };
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  setUser(updatedUser);
                } else {
                  alert("Failed to upload photo");
                }
              }}
            />
          </label>
        </div>

        {/* User Info & Stats */}
        <div className="flex-1 space-y-4">
          <p>
            <strong>Name:</strong> {user.first_name} {user.last_name}
          </p>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Age:</strong> {user.age || "N/A"} years
          </p>

          {/* Weight & Height */}
          <div className="flex items-center space-x-6">
            <div className="flex flex-col">
              <strong>Weight (kg):</strong>
              {editing ? (
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                />
              ) : (
                <span>{weight || "N/A"}</span>
              )}
            </div>
            <div className="flex flex-col">
              <strong>Height (cm):</strong>
              {editing ? (
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="border rounded px-2 py-1 w-24"
                />
              ) : (
                <span>{height || "N/A"}</span>
              )}
            </div>
            <div className="flex flex-col">
              <strong>BMI:</strong>
              <span
                className="ml-2 px-2 py-1 text-xs font-semibold text-white rounded-full"
                style={{
                  backgroundColor:
                    bmi < 18.5
                      ? "#60A5FA"
                      : bmi < 25
                      ? "#16A34A"
                      : bmi < 30
                      ? "#FACC15"
                      : "#DC2626",
                }}
              >
                {bmi ? getBMICategory(bmi) : "N/A"}
              </span>
            </div>
          </div>

          {message && <p className="text-sm text-red-600">{message}</p>}

          {editing ? (
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 mt-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Weight & Height
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
