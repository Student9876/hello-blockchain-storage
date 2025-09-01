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
  const [isLoading, setIsLoading] = useState(false); // Add loading state

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
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    return provider;
  }

  async function readMessage() {
    setIsLoading(true);
    const provider = await getProvider();
    const contract = new ethers.Contract(contractAddress, HelloStorage.abi, provider);

    try {
      // Get current message
      const currentMessage = await contract.message();
      setMessage(currentMessage);

      // Get logs with proper pagination
      const filter = contract.filters.MessageUpdated();
      const currentBlock = await provider.getBlockNumber();
      const BLOCK_RANGE = 450; // Using slightly smaller range to be safe
      let startBlock = deploymentBlock;
      let allLogs = [];
      let retryCount = 0;
      const MAX_RETRIES = 3;

      while (startBlock < currentBlock && retryCount < MAX_RETRIES) {
        try {
          // Calculate end block
          let endBlock = Math.min(startBlock + BLOCK_RANGE, currentBlock);

          // Add small delay between requests
          if (allLogs.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          const logs = await contract.queryFilter(filter, startBlock, endBlock);
          allLogs = [...allLogs, ...logs];

          // Only move forward if request was successful
          startBlock = endBlock + 1;
          retryCount = 0; // Reset retry count on success
        } catch (error) {
          console.warn(`Retrying block range... Attempt ${retryCount + 1}`);
          retryCount++;

          // If we've hit max retries, break the loop
          if (retryCount >= MAX_RETRIES) {
            console.error("Max retries reached, showing partial results");
            break;
          }

          // Wait longer between retries
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Process and display logs even if we didn't get all of them
      if (allLogs.length > 0) {
        const parsed = allLogs.map((log) => ({
          sender: log.args.sender,
          oldMessage: log.args.oldMessage,
          newMessage: log.args.newMessage,
          timestamp: new Date(Number(log.args.timestamp) * 1000).toLocaleString(),
          txHash: log.transactionHash,
        }));
        setHistory(parsed.reverse());
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      alert("Error loading transaction history. Please try again later.");
    } finally {
      setIsLoading(false);
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
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            Message History
            {isLoading && (
              <span className="text-sm text-gray-500">(Loading...)</span>
            )}
          </h2>
          {/* Add this message if needed */}
          {history.length === 1 && (
            <p className="text-sm text-yellow-500 mb-4">
              Note: Only showing most recent transaction. Previous transactions may be available.
            </p>
          )}
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
