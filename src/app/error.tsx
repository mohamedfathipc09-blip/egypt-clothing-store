"use client";

import React from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  // You can log the error to an error reporting service
  console.error(error);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

