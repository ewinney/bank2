import "@/styles/globals.css";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/Header";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
      <Toaster />
    </>
  );
}

