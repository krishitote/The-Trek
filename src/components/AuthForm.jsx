import React, { useState } from "react";

export default function AuthForm({ onSubmit, type = "login" }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("Male");
  const [age, setAge] = useState("");
  const [error, setError] = useState(null);

  async function handle(e) {
    e.preventDefault();
    setError(null);

    try {
      if (type === "register") {
        await onSubmit({ username, password, gender, age });
      } else {
        await onSubmit({ username, password });
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    }
  }

  return (
    <div className="card max-w-md mx-auto p-6 border rounded bg-white shadow">
      <h2 className="text-lg font-semibold mb-4">
        {type === "register" ? "Register" : "Login"}
      </h2>
      <form onSubmit={handle} className="space-y-4">
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full px-3 py-2 border rounded"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-3 py-2 border rounded"
        />

        {type === "register" && (
          <div className="flex gap-3">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Age"
              className="w-24 px-2 py-2 border rounded"
            />
          </div>
        )}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded w-full hover:bg-blue-600"
        >
          {type === "register" ? "Create Account" : "Login"}
        </button>

        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
}
