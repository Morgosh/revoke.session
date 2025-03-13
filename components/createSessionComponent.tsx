import { useAbstractClient } from "@abstract-foundation/agw-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { LimitType, SessionConfig, SessionClient, getSessionHash  } from "@abstract-foundation/agw-client/sessions";
import { useRevokeSessions } from "@abstract-foundation/agw-react";
import { abstractTestnet } from "viem/chains"; // Use abstract for mainnet
import { toFunctionSelector, parseEther, parseAbi, recoverMessageAddress } from "viem";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { useSignMessage } from 'wagmi'
import { getMessage, getProvider, verifySignatureSA } from "@/functions";
// import { signMessage } from '@wagmi/core'


export default function CreateSessionComponent() {
  const { address } = useAccount();
  const { data: signMessageData, signMessage } = useSignMessage();

  const { data: agwClient } = useAbstractClient();

  const [currentSessionClient, setCurrentSessionClient] = useState<SessionClient | null>(null);
  const [currentSessionConfig, setCurrentSessionConfig] = useState<SessionConfig | null>(null);
  const { revokeSessionsAsync } = useRevokeSessions();
  const [sessionHash, setSessionHash] = useState<`0x${string}` | undefined>();
  // const { signMessage } = useSignMessage();

  useEffect(() => {
    async function doit() {
      if (!signMessageData) return;
      console.log("signed data", signMessageData);
      const isValid = await verifySignatureSA(getMessage(), signMessageData, process.env.NEXT_PUBLIC_SA_ADDRESS!, getProvider());
      console.log("Signature is valid", isValid);
    }
    doit();
  }, [signMessageData]);

  async function handleCreateSession() {
    const sessionPrivateKey = generatePrivateKey();
    const sessionSigner = privateKeyToAccount(sessionPrivateKey);

    const { session, transactionHash } = await agwClient!.createSession({
      session: {
        signer: sessionSigner.address,
        expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60 * 60 * 24), // 24 hours
        feeLimit: {
          limitType: LimitType.Lifetime,
          limit: parseEther("1"), // 1 ETH lifetime gas limit
          period: BigInt(0),
        },
        callPolicies: [
          {
            target: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA", // Contract address
            selector: toFunctionSelector("mint(address,uint256)"), // Allowed function
            valueLimit: {
              limitType: LimitType.Unlimited,
              limit: BigInt(0),
              period: BigInt(0),
            },
            maxValuePerUse: BigInt(0),
            constraints: [],
          }
        ],
        transferPolicies: [],
      }
    });

    console.log("Session created with hash", transactionHash);
    setCurrentSessionConfig(session);
    setCurrentSessionClient(agwClient!.toSessionClient(sessionSigner, session));
    setSessionHash(transactionHash);
  }

  async function sendTransactionWithSessionKey() {
    if (!agwClient || !address || !currentSessionClient) return;

    // Use the existing session signer and session that you created with useCreateSession
    // Likely you want to store these inside a database or solution like AWS KMS and load them

    const hash = await currentSessionClient.writeContract({
        abi: parseAbi(["function mint(address,uint256) external"]),
        account: currentSessionClient.account,
        chain: abstractTestnet,
        address: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA",
        functionName: "mint",
        args: [address, BigInt(1)],
    });
    console.log("Transaction sent with hash", hash);
  }

  async function handleRevokeSession() {
    console.log("Revoking session with hash", sessionHash);
    // Revoke a single session using its creation transaction hash
    const res1 = await revokeSessionsAsync({
      sessions: [getSessionHash(currentSessionConfig!)!],
    });
    console.log("res1", res1);
  }

  async function handleSignMessage() {
    try {
      const message = getMessage();
      await signMessage({ message });
    } catch (error) {
      console.error("Error signing message", error);
    }
    // console.log("here?", )
    // const recoveredAddress2 = await recoverMessageAddress({
    //   message,
    //   signature: "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000074b9ae28ec45e3fa11533c7954752597c3de3e7a0000000000000000000000000000000000000000000000000000000000000041a9e80b446c9dfeeaab4530040d3b7ae62468bbd774a8c07bb140d7a313ab4c891d24992a1939c3588a30b3a0a15c512b8859c3c5529bac5a34658b6083488e161c00000000000000000000000000000000000000000000000000000000000000"
    // })
    // console.log("Recovered address2", recoveredAddress2);

    // const recoveredAddress = await recoverMessageAddress({
    //   message,
    //   signature: "0x000000000000000000000000000000000000000000000000000000000000004000000000000000000000000074b9ae28ec45e3fa11533c7954752597c3de3e7a000000000000000000000000000000000000000000000000000000000000004149174a28bdbdde00500f753a6286434ce683dde724ba2f765ee7683833a720967d942fb79250fbe0df9ab40130ac7504ad5b308bebc5f8ba89133f42995c91401b00000000000000000000000000000000000000000000000000000000000000"
    // })
    // console.log("here.");
    // console.log("Recovered address1", recoveredAddress);
  }

  return <div>
    <h1>Admin panel</h1>
    <button onClick={handleCreateSession} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Create Test Session</button>
    <button onClick={sendTransactionWithSessionKey} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Send session Transaction</button>
    <button onClick={handleRevokeSession} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Revoke Session</button>
    <button onClick={handleSignMessage} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Sign Message wagmi</button>
  </div>
}
