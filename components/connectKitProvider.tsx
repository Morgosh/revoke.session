/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { ConnectKitProvider } from "connectkit";
import { createConfig, http } from "wagmi";
import { abstractTestnet, abstract } from "viem/chains"; // Use abstract for mainnet
import { abstractWalletConnector } from "@abstract-foundation/agw-react/connectors";


const chosenNetwork = process.env.NEXT_PUBLIC_NETWORK === "testnet" ? abstractTestnet : abstract;

export const config = createConfig({
  connectors: [abstractWalletConnector()],
  chains: [chosenNetwork],
  //@ts-ignore
  transports: {
    [chosenNetwork.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function AbstractWalletWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {/* Your application components */}
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}