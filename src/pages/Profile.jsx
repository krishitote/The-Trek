import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, session, setUser } = useAuth();
  const [weight, setWeight] = useState(user?.weight || "");
  const [height, setHeight] = useState(user?.height || "");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Photo upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // BMI functions
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

  // Weight & height save
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

  // Photo upload handler
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

  if (!user) return <p className="text-center mt-10">Loading profile...</p>;

  const bmi = calculateBMI(weight, height);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Profile</h1>

      <div className="p-6 bg-gray-50 rounded-lg shadow flex flex-col md:flex-row md:space-x-6 space-y-6 md:space-y-0">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center md:items-start mb-4">
          <img
            src={
              preview || user.profile_image
                ? preview || `${import.meta.env.VITE_API_URL}${user.profile_image}`
                : "/default-avatar.png"
            }
            alt="Profile"
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="photo-upload"
            onChange={(e) => {
              const file = e.target.files[0];
              if (!file) return;
              setSelectedFile(file);
              setPreview(URL.createObjectURL(file));
            }}
          />
          <label
            htmlFor="photo-upload"
            className="mt-2 cursor-pointer text-blue-600 hover:underline"
          >
            Choose Photo
          </label>

          {selectedFile && (
            <button
              onClick={handlePhotoUpload}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Upload Photo
            </button>
          )}
        </div>

        {/* User Info & Stats */}
        <div className="flex-1 space-y-4">
          {/* ...rest of your profile fields like weight, height, BMI */}
        </div>
      </div>
    </div>
  );
}
