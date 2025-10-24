// src/pages/Profile.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import GoogleFitConnect from "../components/GoogleFitConnect";

export default function Profile() {
  const { user, session, setUser } = useAuth();
  const [weight, setWeight] = useState(user?.weight || "");
  const [height, setHeight] = useState(user?.height || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // Calculate BMI
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

  // inside JSX
<div className="mt-4">
  <GoogleFitConnect />
</div>
  
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
      setUser(data);
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

  const handlePhotoUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("photo", selectedFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, profile_image: data.profile_image };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSelectedFile(null);
        setPreview(null);
        alert("Photo uploaded successfully!");
      } else {
        alert("Failed to upload photo");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading photo");
    }
  };

  if (!user) return <p className="text-center mt-10 text-gray-500">Loading profile...</p>;

  const bmi = calculateBMI(weight, height);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Your Profile</h1>

      <div className="bg-white rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:space-x-8 space-y-6 md:space-y-0">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center md:items-start">
          <img
            src={preview || (user.profile_image ? `${import.meta.env.VITE_API_URL}${user.profile_image}` : "/default-avatar.png")}
            alt="Profile"
            className="w-36 h-36 rounded-full object-cover border-4 border-indigo-200 shadow-md"
          />
          <input
            type="file"
            accept="image/*"
            id="photo-upload"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setSelectedFile(file);
              setPreview(URL.createObjectURL(file));
            }}
          />
          <label
            htmlFor="photo-upload"
            className="mt-3 cursor-pointer text-indigo-600 font-medium hover:text-indigo-800"
          >
            Choose Photo
          </label>
          {selectedFile && (
            <button
              onClick={handlePhotoUpload}
              className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
            >
              Upload Photo
            </button>
          )}
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-5">
          <div className="space-y-2">
            <p className="text-gray-700"><span className="font-semibold">Name:</span> {user.first_name} {user.last_name}</p>
            <p className="text-gray-700"><span className="font-semibold">Username:</span> {user.username}</p>
            <p className="text-gray-700"><span className="font-semibold">Email:</span> {user.email}</p>
            <p className="text-gray-700"><span className="font-semibold">Age:</span> {user.age || "N/A"} years</p>
          </div>

          {/* Weight / Height / BMI */}
          <div className="flex flex-col sm:flex-row sm:space-x-8 space-y-3 sm:space-y-0">
            <div className="flex flex-col">
              <strong>Weight (kg):</strong>
              {editing ? (
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="border rounded px-3 py-1 w-28 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
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
                  className="border rounded px-3 py-1 w-28 focus:ring-2 focus:ring-indigo-300 focus:outline-none"
                />
              ) : (
                <span>{height || "N/A"}</span>
              )}
            </div>
            <div className="flex flex-col">
              <strong>BMI:</strong>
              <span
                className="ml-0 sm:ml-2 px-2 py-1 text-sm font-semibold text-white rounded-full mt-1 sm:mt-0"
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0 mt-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg shadow hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Edit Weight & Height
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
