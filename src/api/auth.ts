// src/api/auth.ts
// Handles authentication API requests

export async function exchangeGoogleToken(googleToken: string) {
  // Replace with your backend endpoint
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token: googleToken })
  });

  if (!response.ok) {
    throw new Error("Token exchange failed");
  }
  return response.json(); // Should return user info and app token
}
