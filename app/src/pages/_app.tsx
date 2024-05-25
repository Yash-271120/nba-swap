import Head from "next/head";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ToastContainer } from "react-toastify";
import { ContentContainer } from "@/components/ContentContainer";
import "react-toastify/dist/ReactToastify.css";
require("@solana/wallet-adapter-react-ui/styles.css");

import { WalletContextProvider } from "@/contexts/ContextProvider";
import { AppBar } from "@/components/AppBar";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>NBA Swap</title>
      </Head>
      <WalletContextProvider>
        <div className="flex flex-col h-screen">
          <AppBar />
          <ContentContainer>
            <Component {...pageProps} />
          </ContentContainer>
          <ToastContainer />
        </div>
      </WalletContextProvider>
    </>
  );
}
