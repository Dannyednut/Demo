import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { web3Service } from '@/lib/web3';
import { Copy, ExternalLink, Zap, Shield } from 'lucide-react';

export function ContractStatus() {
  const [contractData, setContractData] = useState<{
    currentSentiment: number;
    totalSupply: number;
    mintPrice: string;
  } | null>(null);
  const [isMockMode, setIsMockMode] = useState(true);
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    const checkContractStatus = async () => {
      setIsMockMode(web3Service.isMockMode());
      setContractAddress(web3Service.getContractAddress());
      
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
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openEtherscan = () => {
    if (contractAddress && !isMockMode) {
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