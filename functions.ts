import { Contract, parseEther } from "ethers";
import { Wallet } from "ethers";
import { ethers } from "ethers";
import { EIP712Signer, Provider, types, utils } from "zksync-ethers";
import eoaValidatorABI from "@/abi/EOAValidator.abi.json";
import saABI from "@/abi/SmartAccount.abi.json";


const network = process.env.NEXT_PUBLIC_NETWORK || "testnet"; // mainnet or testnet

export function getProvider() {
  if(network === "testnet") {
    return ethers.getDefaultProvider("https://api.testnet.abs.xyz");
  } else {
    return ethers.getDefaultProvider("https://api.mainnet.abs.xyz");
  }
}

export function getProviderZK() {
  if(network === "testnet") {
    return new Provider("https://api.testnet.abs.xyz");
  } else {
    return new Provider("https://api.mainnet.abs.xyz");
  }
}

export function getChainId() {
  if(network === "testnet") {
    return 11124;
  } else {
    return 2741;
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

export function getMessage() {
  return "my message 123";
}


export async function prepareEOATx(
  provider: Provider,
  account: Contract,
  tx: types.TransactionLike,
  validatorAddress: string,
  wallet: Wallet,
  hookData: Array<ethers.BytesLike> = [],
  paymasterParams?: types.PaymasterParams,
): Promise<types.TransactionLike> {
  if (tx.value == undefined) {
      tx.value = parseEther('0');
  }

  tx = {
      ...tx,
      from: await account.getAddress(),
      nonce: await provider.getTransactionCount(await account.getAddress()),
      gasLimit: 30_000_000,
      gasPrice: await provider.getGasPrice(),
      chainId: (await provider.getNetwork()).chainId,
      type: 113,
      customData: {
          gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
          paymasterParams: paymasterParams,
      } as types.Eip712Meta,
  };

  const signedTxHash = EIP712Signer.getSignedDigest(tx);

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();
  let signature = wallet.signingKey.sign(signedTxHash).serialized;

  signature = abiCoder.encode(
      ['bytes', 'address', 'bytes[]'],
      [signature, validatorAddress, hookData],
  );

  tx.customData = {
      ...tx.customData,
      customSignature: signature,
  };

  console.log("actual signer address:", wallet.address);
  await validateSignature(validatorAddress, signedTxHash, wallet.signingKey.sign(signedTxHash).serialized);
  await confirmOwner(await account.getAddress(), wallet.address);

  return tx;
}

async function validateSignature(validatorAddress: string, signedHash: any, signature: string) {
  const contract = new Contract(validatorAddress, eoaValidatorABI, getProviderZK());
  try {
    console.log("Calling validateSignature...", {
        validatorAddress,
        signedHash,
        signature,
    });
    const signerAddress = await contract.validateSignature(1, signedHash, signature);
    console.log("Signer Address:", signerAddress);
  } catch (error) {
      console.error("Error calling validateSignature:", error);
  }
}

// confirm that k1IsOwner
async function confirmOwner(smartAccountAddress: string, ownerAddress: string) {
  const provider = getProviderZK();
  const smartAccount = new Contract(smartAccountAddress, saABI, provider);
  const isOwner = await smartAccount.k1IsOwner(ownerAddress);
  console.log("Is owner:", isOwner);
  // lets list owners k1ListOwners
  const owners = await smartAccount.k1ListOwners();
  console.log("Owners:", owners);
}

export async function verifySignatureSA(
  message: string,
  signature: string,
  smartContractAddress: string,
  provider: ethers.Provider,
): Promise<boolean> {
  const digest = ethers.hashMessage(message)
  const ierc1271 = new ethers.Contract(smartContractAddress, ["function isValidSignature(bytes32, bytes) view returns (bytes4)"], provider)
  const magicValue = await ierc1271.isValidSignature(digest, ethers.getBytes(signature))
  return magicValue === "0x1626ba7e"
}