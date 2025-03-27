/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { getProvider } from '@/functions';
import K1Abi from '@/abi/SmartAccount.abi.json';
import { useAbstractClient } from '@abstract-foundation/agw-react';

export default function R1SignersComponent() {
  const { address } = useAccount();
  const { data: agwClient } = useAbstractClient();
  const [r1Owners, setR1Owners] = useState<string[]>([]);
  const [newOwner, setNewOwner] = useState<`0x{string}`>('' as `0x{string}`)
  const [hoveredOwner, setHoveredOwner] = useState<string | null>(null);

  useEffect(() => {
    if (address) {
      fetchR1OwnerList();
    }
  }, [address]);

  async function fetchR1OwnerList() {
    console.log('Fetching R1 owner list...');
    const provider = getProvider();
    const contract = new ethers.Contract(address!, K1Abi, provider);
    const owners = await contract.r1ListOwners();
    console.log('R1 Owners:', owners);
    setR1Owners(owners);
  }

  async function handleAddOwner() {
    if (!newOwner || !agwClient) return;
    console.log('Adding owner:', newOwner);
    const transactionHash = await agwClient.writeContract({
      abi: K1Abi,
      address: address!,
      functionName: 'r1AddOwner',
      args: [newOwner],
    });
    console.log('Owner added:', newOwner, transactionHash);
    setNewOwner('' as `0x{string}`);
    fetchR1OwnerList();
  }

  async function handleRemoveOwner(owner: `0x{string}`) {
    if (r1Owners.length <= 1 || !agwClient) return;
    console.log('Removing owner:', owner);
    const transactionHash = await agwClient.writeContract({
      abi: K1Abi,
      address: address!,
      functionName: 'r1RemoveOwner',
      args: [owner],
    });
    console.log('Owner removed:', owner, transactionHash);
    fetchR1OwnerList();
  }

  const shortenAddress = (addr: string, startLength = 6, endLength = 4) => {
    return `${addr.slice(0, startLength)}...${addr.slice(-endLength)}`;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-white">R1 Signers</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter new owner address"
          value={newOwner}
          onChange={(e) => setNewOwner(e.target.value as any)}
          className="px-3 py-2 rounded border border-gray-300 bg-black text-white"
        />
        <button
          onClick={handleAddOwner}
          className="ml-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition-colors"
        >
          Add Owner
        </button>
      </div>
      {r1Owners.length === 0 ? (
        <p className="text-green-500 font-bold">
          No R1 owners found for this smart wallet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-black/50 border border-white/10 rounded-lg backdrop-blur-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                  Owner Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-green-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {r1Owners.map((owner, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {shortenAddress(owner)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {r1Owners.length > 1 ? (
                      <button
                        onClick={() => handleRemoveOwner(owner as any)}
                        onMouseEnter={() => setHoveredOwner(owner)}
                        onMouseLeave={() => setHoveredOwner(null)}
                        className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1 rounded hover:bg-red-500/20 transition-colors relative"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        disabled
                        onMouseEnter={() => setHoveredOwner(owner)}
                        onMouseLeave={() => setHoveredOwner(null)}
                        className="bg-gray-500/10 border border-gray-500/20 text-gray-400 px-3 py-1 rounded cursor-not-allowed relative"
                      >
                        Remove
                        {hoveredOwner === owner && (
                          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded shadow-md">
                            At least 1 owner required
                          </span>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 