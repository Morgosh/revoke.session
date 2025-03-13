import { Contract, utils, Wallet } from "zksync-ethers";
import SmartAcountABI from "@/abi/SmartAccount.abi.json";

// import "@matterlabs/hardhat-zksync-verify/dist/src/type-extensions";
// import "@matterlabs/hardhat-zksync-node/dist/type-extensions";
import { getMessage, getProviderZK, prepareEOATx, verifySignatureSA } from "@/functions";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

export default function InteractWithKey() {
  // An example of a deploy script that will deploy and call a simple contract.
  async function sendRawTx() {
    console.log(`Running script...`);
    // Setup the EOA wallet to deploy from (reads private key from hardhat config)
    const provider = getProviderZK() //madecustom
    if(!process.env.NEXT_PUBLIC_PRIVATE_KEY) throw new Error("No private key found");
    if(!process.env.NEXT_PUBLIC_SA_ADDRESS) throw new Error("No SA address found");
    const eoaWallet = new Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY, provider);
    const SAAddress = process.env.NEXT_PUBLIC_SA_ADDRESS;

    const account = new Contract(
      SAAddress,
      SmartAcountABI,
      provider
    );

    const txData = {
      to: SAAddress,
      value: 1,
      data: "0x",
    };

    const validator = await getValidator();
    console.log(`Sending transaction...`, {
      provider,
      account,
      txData,
      validator,
      eoaWallet
    } );

    const tx = await prepareEOATx(
      provider,
      account,
      txData,
      validator,
      eoaWallet
    );

    // await validateSignature(await getValidator(), tx.hash!, tx.signature);
    console.log(`Transaction prepared:`, tx);

    const txReceipt = await provider.broadcastTransaction(
        utils.serializeEip712(tx),
    );
    await txReceipt.wait();
  
    console.log(`✅ Transaction submitted from smart contract: ${txReceipt.hash}`);
  }

  const [eoaAddress, setEOAAddress] = useState("");
  useEffect(() => {
    if(!process.env.NEXT_PUBLIC_PRIVATE_KEY) {setEOAAddress("No private key found");} else {
      const provider = getProviderZK();
      const eoaWallet = new Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY!, provider);
      setEOAAddress(eoaWallet.address);
    }
  }, [process.env.NEXT_PUBLIC_PRIVATE_KEY]);


  async function getValidator() {
    if(!process.env.NEXT_PUBLIC_SA_ADDRESS) throw new Error("No SA address found");
    const SAAddress = process.env.NEXT_PUBLIC_SA_ADDRESS;
    const provider = getProviderZK();


    const newAccountContract: Contract = new Contract(
      SAAddress,
      SmartAcountABI,
      provider
    );

    const k1ListValidators = await newAccountContract.k1ListValidators();
    console.log("Validators", k1ListValidators);
    const validatorAddress = k1ListValidators[0];
    return validatorAddress;
  }

  async function signMessageWithKey(messageText: string) {
    if(!process.env.NEXT_PUBLIC_PRIVATE_KEY) throw new Error("No private key found");
    const provider = getProviderZK();
    const eoaWallet = new Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY!, provider);
    const messageHash = ethers.hashMessage(messageText)


    const contract = new Contract(process.env.NEXT_PUBLIC_SA_ADDRESS!,SmartAcountABI,provider);
    const digest = await contract.getEip712Hash({ signedHash: messageHash });

    const signature = eoaWallet.signingKey.sign(digest).serialized;
    //ethers.concat([ethers.Signature.from(eoaWallet.signingKey.sign(digest)).serialized]);

    const validator = await getValidator();

    const signatureAndValidator = ethers.AbiCoder.defaultAbiCoder().encode(
      ['bytes', 'address'],
      [signature, validator]
    );
  
    return signatureAndValidator;
  }

  async function signAndCheck(messageText: string) {
    const signatureAndValidator = await signMessageWithKey(messageText);
    const isValid = await verifySignatureSA(messageText, signatureAndValidator, process.env.NEXT_PUBLIC_SA_ADDRESS!, getProviderZK());
    console.log('Signature with validator is valid:', isValid);
  }

  return <div>
    Interact with key
    SA address: {process.env.NEXT_PUBLIC_SA_ADDRESS}
    <div>
      EOA address:  {eoaAddress}
    </div>
    <div className="px-6 py-4 whitespace-nowrap text-sm text-white">
      <button onClick={sendRawTx} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Create key tx</button>
      <button onClick={getValidator} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Get Validators</button>
      <button onClick={() => signAndCheck(getMessage())} className="bg-green border border-green-500/20 text-green-400 px-3 py-1 rounded hover:bg-green-500/20 transition-colors">Sign message Key</button>
    </div>
  </div>
}