import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Import the Web3Service CLASS
import { Web3Service } from '@/lib/web3';
import { Copy, ExternalLink, Zap, Shield } from 'lucide-react';

// Create a frontend-specific instance of Web3Service with VITE_CONTRACT_ADDRESS
const web3Service = new Web3Service(import.meta.env.VITE_CONTRACT_ADDRESS);


export function ContractStatus() {
  const [contractData, setContractData] = useState<{
    currentSentiment: number;
    totalSupply: number;
    mintPrice: string;
  } | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  // Initialize with an empty string or a suitable default
  const [contractAddress, setContractAddress] = useState(''); 

  useEffect(() => {
    const checkContractStatus = async () => {
      setIsMockMode(web3Service.isMockMode());
      
      // Safely get contract address, providing an empty string as fallback if undefined
      const address = web3Service.getContractAddress() || ''; 
      setContractAddress(address);
      
      if (!web3Service.isMockMode()) {
        try {
          const data = await web3Service.getContractData();
          setContractData(data);
        } catch (error) {
          console.warn('Failed to fetch contract data:', error);
        }
      }
    };

    checkContractStatus();
    const interval = setInterval(checkContractStatus, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  const copyToClipboard = (text: string) => {
    // navigator.clipboard.writeText(text); // Use document.execCommand('copy') for better iframe compatibility
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        // Optionally, add a toast notification for success
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Optionally, add a toast notification for failure
    }
    document.body.removeChild(textarea);
  };

  const openEtherscan = () => {
    // Ensure contractAddress is not empty and not in mock mode before opening
    if (contractAddress && !isMockMode) {
      // You might need to dynamically determine the correct Etherscan URL based on the connected network.
      // For now, assuming Ethereum Mainnet or a generic EVM explorer.
      // You could extend Web3Service to return the current chain ID/network name for a more accurate URL.
      window.open(`https://etherscan.io/address/${contractAddress}`, '_blank');
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Contract Status</CardTitle>
          <Badge 
            variant={isMockMode ? "secondary" : "default"}
            className={isMockMode ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}
          >
            {isMockMode ? (
              <><Zap className="w-3 h-3 mr-1" />Demo Mode</>
            ) : (
              <><Shield className="w-3 h-3 mr-1" />Live Blockchain</>
            )}
          </Badge>
        </div>
        <CardDescription>
          {isMockMode 
            ? "Using mock data for demonstration" 
            : "Connected to deployed smart contract"
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isMockMode ? (
          <div className="text-sm text-muted-foreground space-y-2">
            <p>🎭 <strong>Demo Features:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Simulated wallet connections</li>
              <li>Mock transaction processing</li>
              <li>Generated sentiment data</li>
              <li>No real blockchain interaction</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>To enable real blockchain:</strong><br/>
                Deploy the smart contract and set VITE_CONTRACT_ADDRESS
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contract Address</label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                  {contractAddress}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(contractAddress)}
                  className="h-7 w-7 p-0"
                >
                  <Copy className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={openEtherscan}
                  className="h-7 w-7 p-0"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {contractData && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Total NFTs</label>
                  <p className="text-lg font-semibold">{contractData.totalSupply}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Current Price</label>
                  <p className="text-lg font-semibold">{parseFloat(contractData.mintPrice).toFixed(4)} ETH</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Chain Sentiment</label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${contractData.currentSentiment * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {(contractData.currentSentiment * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
