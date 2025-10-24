import React from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function GoogleFitConnect() {
  const connectGoogleFit = () => {
    const scope = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.location.read",
    ].join(" ");
    const redirectUri = "https://the-trek.onrender.com/api/googlefit/callback";

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    window.location.href = authUrl;
  };

  return (
    <button
      onClick={connectGoogleFit}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      Connect Google Fit
    </button>
  );
}
