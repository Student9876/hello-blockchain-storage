"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import HelloStorage from "../contracts/HelloStorage.json";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const deploymentBlock = parseInt(process.env.NEXT_PUBLIC_DEPLOYMENT_BLOCK);
const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;

export default function Home() {
  const [account, setAccount] = useState(null);
  const [message, setMessage] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [history, setHistory] = useState([]);

  async function connectWallet() {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }
    const [selectedAccount] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    setAccount(selectedAccount);
  }

  async function getProvider() {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("wallet_switchEthereumChain", [{ chainId }]); // using env variable
    return provider;
  }

  async function readMessage() {
    const provider = await getProvider();
    const contract = new ethers.Contract(contractAddress, HelloStorage.abi, provider);
    const currentMessage = await contract.message();
    setMessage(currentMessage);

    try {
      const filter = contract.filters.MessageUpdated();
      const logs = await contract.queryFilter(filter, deploymentBlock, "latest");
      const parsed = logs.map((log) => {
        const { sender, oldMessage, newMessage, timestamp } = log.args;
        return {
          sender,
          oldMessage,
          newMessage,
          timestamp: new Date(Number(timestamp) * 1000).toLocaleString(),
          txHash: log.transactionHash,
        };
      });
      setHistory(parsed.reverse());
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  }


  async function writeMessage() {
    const provider = await getProvider();
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, HelloStorage.abi, signer);
    const tx = await contract.setMessage(newMessage);
    await tx.wait();
    readMessage();
  }

  useEffect(() => {
    if (account) readMessage();
  }, [account]);

  return (
    <main className="p-4 md:p-8 font-sans">
      <h1 className="text-2xl font-bold mb-4">Hello Blockchain (Next.js)</h1>
      {!account ? (
        <button onClick={connectWallet} className="w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Connect Wallet
        </button>
      ) : (
        <p className="break-all">Connected as: {account}</p>
      )}

      <div className="mt-4 space-y-4 md:space-y-0">
        <p><strong>Stored Message:</strong> {message}</p>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Enter new message"
            className="px-3 py-2 border rounded flex-grow"
          />
          <button onClick={writeMessage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Set Message
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Message History</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-800">
                  <th className="border border-white p-2 text-left">Sender</th>
                  <th className="border border-white p-2 text-left">Old Message</th>
                  <th className="border border-white p-2 text-left">New Message</th>
                  <th className="border border-white p-2 text-left">Timestamp</th>
                  <th className="border border-white p-2 text-left">Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {history.map((tx, i) => (
                  <tr key={i} className="hover:bg-gray-900">
                    <td className="border border-white p-2 truncate max-w-[150px]">{tx.sender}</td>
                    <td className="border border-white p-2 truncate max-w-[150px]">{tx.oldMessage}</td>
                    <td className="border border-white p-2 truncate max-w-[150px]">{tx.newMessage}</td>
                    <td className="border border-white p-2 whitespace-nowrap">{tx.timestamp}</td>
                    <td className="border border-white p-2">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
