import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string) => void;
}

export function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const walletOptions = [
    {
      name: "MetaMask",
      icon: "🦊",
      address: "0x1234567890123456789012345678901234567890"
    },
    {
      name: "WalletConnect",
      icon: "⚡",
      address: "0x0987654321098765432109876543210987654321"
    },
    {
      name: "Coinbase Wallet",
      icon: "💼",
      address: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
    }
  ];

  const handleConnect = (address: string) => {
    onConnect(address);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white text-center mb-2">
            Connect Wallet
          </DialogTitle>
          <p className="text-slate-400 text-center">Choose your preferred wallet to continue</p>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.name}
              variant="outline"
              onClick={() => handleConnect(wallet.address)}
              className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 hover:border-green-400 text-white"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 crypto-gradient rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">{wallet.icon}</span>
                </div>
                <span className="font-medium">{wallet.name}</span>
              </div>
              <span className="text-slate-400">→</span>
            </Button>
          ))}
        </div>
        
        <Button
          variant="ghost"
          onClick={onClose}
          className="mt-6 w-full text-slate-400 hover:text-white"
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}