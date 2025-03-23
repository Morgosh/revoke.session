/* eslint-disable @typescript-eslint/ban-ts-comment */
"use client"
import { useGlobalWalletSignerClient } from "@abstract-foundation/agw-react";
import { useEffect } from "react";
import { useAccount, useSwitchChain } from "wagmi"

export default function NetworkSwitcher({
  children,
}: {
  children: React.ReactNode;
}) {
  const { switchChain } = useSwitchChain()
  const { address, isConnected } = useAccount();
  const { data: signerClient } = useGlobalWalletSignerClient();


  useEffect(() => {
    const shouldBeChainId = process.env.NEXT_PUBLIC_NETWORK === 'testnet' ? 11124 : 2741;
    if(isConnected && signerClient?.chain?.id !== shouldBeChainId) {
      console.log("changing chain id to", shouldBeChainId);
      switchChain({ chainId: shouldBeChainId });
    }
  }, [address, isConnected, signerClient]);

  return (
    <>
      {children}
    </>
  );
}