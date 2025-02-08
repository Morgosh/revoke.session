/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRevokeSessions } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { getBlockExplorerUrl, getProvider, getSessionContractAddress } from "@/functions";
import { ethers } from "ethers";
import { SessionKeyValidatorAbi } from "@abstract-foundation/agw-client/sessions";

export default function SessionsComponent() {
  const { revokeSessionsAsync } = useRevokeSessions();
  const { address } = useAccount();

  type Session = {
    account: string;
    sessionHash: `0x${string}`;
    sessionSpec: string;
    blockNumber: number;
    transactionHash: string;
  };

  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (address) {
      fetchSessionCreatedEvents();
    }
  }, [address]);

  async function fetchSessionCreatedEvents() {
    console.log("Fetching SessionCreated events...");
    const provider = getProvider();
    const contract = new ethers.Contract(getSessionContractAddress(), SessionKeyValidatorAbi, provider);

    const sessionCreatedEvents = await contract.queryFilter(contract.filters.SessionCreated(address)) as any;
    const sessionRevokedEvents = await contract.queryFilter(contract.filters.SessionRevoked(address)) as any;

    const sessionsCreated = sessionCreatedEvents.map((event: any) => ({
      account: event.args[0],
      sessionHash: event.args[1],
      sessionSpec: event.args[2],
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
    }));

    const sessionsRevoked = sessionRevokedEvents.map((event: any) => event.args[1]);

    const unrevokedSessions = sessionsCreated.filter((session: any) => !sessionsRevoked.includes(session.sessionHash));

    console.log("Unrevoked Sessions", unrevokedSessions);
    setActiveSessions(unrevokedSessions);
  }

  async function handleRevokeSessions(hashes: `0x${string}`[]) {
    console.log("Revoking sessions with hash", hashes);
    await revokeSessionsAsync({
      sessions: hashes,
    });
    // fetchSessionCreatedEvents();
    // lets just remove from array directly no need to refetch
    setActiveSessions(activeSessions.filter(session => !hashes.includes(session.sessionHash)));
  }

  const shortenHash = (hash: string, startLength = 6, endLength = 4) => {
    return `${hash.slice(0, startLength)}...${hash.slice(-endLength)}`;
  };

  const openInBlockExplorer = (txHash: string) => {
    const explorerUrl = `${getBlockExplorerUrl()}/tx/${txHash}`; // Replace with your block explorer URL
    window.open(explorerUrl, "_blank");
  };

  const [hoveredHash, setHoveredHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleCopy = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 1500); // Hide after 1.5 seconds
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">Active Sessions</h1>
      {activeSessions.length === 0 ? (
        <p className="text-green-500 font-bold">You have no sessions for this account.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-black/50 border border-white/10 rounded-lg backdrop-blur-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Session Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Block Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Transaction Hash</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">Revoke</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {activeSessions.map((session, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  <button
                      onClick={() => handleCopy(session.sessionHash)}
                      onMouseEnter={() => setHoveredHash(session.sessionHash)}
                      onMouseLeave={() => setHoveredHash(null)}
                      className="relative flex items-center text-green-400 hover:text-green-300"
                    >
                      {shortenHash(session.sessionHash)}

                      {/* Tooltip */}
                      {hoveredHash === session.sessionHash && (
                        <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-md">
                          {copiedHash === session.sessionHash ? "Copied!" : "Copy to clipboard"}
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{session.blockNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <button
                      onClick={() => openInBlockExplorer(session.transactionHash)}
                      className="text-green-400 hover:text-green-300"
                    >
                      {shortenHash(session.transactionHash)}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    <button
                      onClick={() => handleRevokeSessions([session.sessionHash])}
                      className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => handleRevokeSessions(activeSessions.map(session => session.sessionHash))}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500 transition-colors"
            >
              Revoke All Sessions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}