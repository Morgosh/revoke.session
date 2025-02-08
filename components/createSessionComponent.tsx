import { useAbstractClient } from "@abstract-foundation/agw-react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { LimitType, SessionConfig, SessionClient, getSessionHash  } from "@abstract-foundation/agw-client/sessions";
import { useRevokeSessions } from "@abstract-foundation/agw-react";
import { abstractTestnet } from "viem/chains"; // Use abstract for mainnet
import { toFunctionSelector, parseEther, parseAbi } from "viem";
import { useAccount } from "wagmi";
import { useState } from "react";

export default function CreateSessionComponent() {
  const { address } = useAccount();
  const { data: agwClient } = useAbstractClient();

  const [currentSessionClient, setCurrentSessionClient] = useState<SessionClient | null>(null);
  const [currentSessionConfig, setCurrentSessionConfig] = useState<SessionConfig | null>(null);
  const { revokeSessionsAsync } = useRevokeSessions();
  const [sessionHash, setSessionHash] = useState<`0x${string}` | undefined>();

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

  return <div>
    <button onClick={handleCreateSession}>Create Session</button>;
    <button onClick={sendTransactionWithSessionKey}>Send Transaction</button>;
    <button onClick={handleRevokeSession}>Revoke Session</button>;
  </div>
}
