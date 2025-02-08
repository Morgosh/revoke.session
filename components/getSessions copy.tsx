// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { getProvider } from "@/functions";
// import { SessionKeyValidatorAbi } from "@abstract-foundation/agw-client/sessions";
// import { useRevokeSessions } from "@abstract-foundation/agw-react";
// import { ethers } from "ethers";
// import { useState } from "react";


// export default function GetSessions() {
//   const { revokeSessionsAsync } = useRevokeSessions();

//   // Replace with your Ethereum provider URL (e.g., Infura, Alchemy, or local node)

//   // Replace with the contract address
//   const contractAddress = "0x34ca1501FAE231cC2ebc995CE013Dbe882d7d081";

//   // Replace with the ABI of the contract, specifically including the SessionCreated event
//   // Replace with the account address you want to filter by
//   const accountAddress = "0xB9f873637dE04C10af415921D216E2ed101d6aC2";

//   // Create a contract instance

//   const [activeSessionHashes, setActiveSessionHashes] = useState<any[]>([])

//   async function fetchSessionCreatedEvents() {
//     console.log("Fetching SessionCreated events...");
//     const provider = getProvider();
//     const contract = new ethers.Contract(contractAddress, SessionKeyValidatorAbi, provider);
//     // Define the filter for the SessionCreated event
  
//     // Query the events
//     const sessionCreatedEvents = await contract.queryFilter(contract.filters.SessionCreated(accountAddress)) as any
//     const sessionRevokedEvents = await contract.queryFilter(contract.filters.SessionRevoked(accountAddress)) as any

//     // lets map all of the session spec hashes

//     const sessionsCreated = sessionCreatedEvents.map((event: any) => {
//       console.log("Event", event)
//       console.log("arg0", event.args[0])
//       return event.args[1] //.sessionSpec
//     })
//     console.log("Sessions Created", sessionsCreated)

//     const sessionsRevoked = sessionRevokedEvents.map((event: any) => {
//       return event.args[1] //.sessionSpec
//     })
//     console.log("Sessions Revoked", sessionsRevoked)

//     // now lets filter out the sessions that have been revoked

//     const unrevokeSessions = sessionsCreated.filter((session: any) => {
//       return !sessionsRevoked.includes(session)
//     })

//     console.log("Unrevoked Sessions", unrevokeSessions)
//     setActiveSessionHashes(unrevokeSessions)
  
//     // Process and log the events
//     // events.forEach((event) => {
//     //   const eventAny = event as any;
//     //   const args = eventAny.args as any;
//     //   // console.log("SessionCreated Event:");
//     //   // console.log("Account:", event.args.account);
//     //   console.log("Account:", args[0])
//     //   // console.log("Session Hash:", event.args.sessionHash);
//     //   console.log("Session Hash:", args[1])
//     //   // console.log("Session Spec:", event.args.sessionSpec);
//     //   console.log("Session Spec:", args[2])
//     //   // console.log("Block Number:", event.blockNumber);
//     //   console.log("Block Number:", eventAny.blockNumber)
//     //   // console.log("Transaction Hash:", event.transactionHash);
//     //   // console.log("----------------------------------");
//     // });
//   }

//   async function revokeAllActiveSessions() {
//     console.log("Revoking sessions", activeSessionHashes);
//       // Revoke a single session using its creation transaction hash
//       const res1 = await revokeSessionsAsync({
//         sessions: activeSessionHashes,
//       });
//       console.log("Revoking result", res1);
//   }

//   return <div>
//     <button onClick={fetchSessionCreatedEvents}>Get Sessions</button>
//     <button onClick={revokeAllActiveSessions}>revokeAllActiveSessions</button>
//   </div>
// }
