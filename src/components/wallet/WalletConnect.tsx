import { useState } from "react";
import { Wallet, ChevronDown, Copy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const WalletConnect = () => {
  const [connected, setConnected] = useState(false);
  const mockAddress = "7xKX...9fGh";

  if (!connected) {
    return (
      <Button
        onClick={() => setConnected(true)}
        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/30 text-primary">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
          {mockAddress}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border">
        <DropdownMenuItem className="gap-2 text-foreground">
          <Copy className="h-4 w-4" /> Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-destructive"
          onClick={() => setConnected(false)}
        >
          <LogOut className="h-4 w-4" /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnect;
