import { ethers } from "ethers";


const network = process.env.NEXT_PUBLIC_NETWORK || "testnet"; // mainnet or testnet

export function getProvider() {
  if(network === "testnet") {
    return ethers.getDefaultProvider("https://api.testnet.abs.xyz");
  } else {
    return ethers.getDefaultProvider("https://api.mainnet.abs.xyz");
  }
}

export function getSessionContractAddress() {
  if(network === "testnet") {
    return "0x34ca1501FAE231cC2ebc995CE013Dbe882d7d081";
  } else {
    return "0x34ca1501FAE231cC2ebc995CE013Dbe882d7d081";
  }
}

export function getBlockExplorerUrl() {
  if(network === "testnet") {
    return `https://sepolia.abscan.org`;
  } else {
    return `https://abscan.org`;
  }
}