"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useState } from "react";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            borderRadius: "2px",
            background: "#000000",
            color: "#ffffff",
            border: "1px solid #444444",
          },
        }}
      />
    </QueryClientProvider>
  );
}
