import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { initializeOpenAIApiKey } from "@/lib/settings";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {
  useEffect(() => {
    initializeOpenAIApiKey();
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}
