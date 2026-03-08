import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Copy,
  LogOut,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronDown,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, truncateAddress, addressToColor } from "@/hooks/use-wallet";
import WalletModal from "./WalletModal";

interface WalletConnectProps {
  variant?: "default" | "header" | "mobile-icon";
}

const WalletConnect = ({ variant = "default" }: WalletConnectProps) => {
  const {
    status,
    address,
    balance,
    network,
    showBalance,
    disconnect,
    copyAddress,
    toggleBalance,
    setNetwork,
    explorerUrl,
  } = useWallet();

  const [modalOpen, setModalOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setConfirmDisconnect(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDropdownOpen(false);
        setConfirmDisconnect(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dropdownOpen]);

  // Not connected state
  if (status !== "connected" || !address) {
    if (variant === "mobile-icon") {
      return (
        <>
          <button
            onClick={() => setModalOpen(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors hover:text-primary"
            aria-label="Connect wallet"
          >
            <Wallet className="h-5 w-5" />
            <span className="text-[10px] font-medium">Wallet</span>
          </button>
          <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
      );
    }

    if (variant === "header") {
      return (
        <>
          <Button
            onClick={() => setModalOpen(true)}
            size="sm"
            className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity"
            aria-label="Connect wallet"
          >
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-semibold">Connect</span>
          </Button>
          <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </>
      );
    }

    return (
      <>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setModalOpen(true)}
            size="lg"
            className="gap-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:opacity-90 transition-opacity glow-primary animate-pulse-glow"
            aria-label="Connect wallet"
          >
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </Button>
        </motion.div>
        <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Connected state
  const avatarColor = addressToColor(address);
  const initials = address.slice(0, 2).toUpperCase();

  if (variant === "mobile-icon") {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-primary transition-colors"
          aria-label="Wallet menu"
          aria-expanded={dropdownOpen}
        >
          <div className="relative">
            <div
              className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold text-foreground"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-success border border-surface" />
          </div>
          <span className="text-[10px] font-medium">Wallet</span>
        </button>
        <WalletDropdown
          open={dropdownOpen}
          address={address}
          balance={balance}
          network={network}
          showBalance={showBalance}
          avatarColor={avatarColor}
          initials={initials}
          explorerUrl={explorerUrl}
          confirmDisconnect={confirmDisconnect}
          onCopy={copyAddress}
          onToggleBalance={toggleBalance}
          onSetNetwork={setNetwork}
          onDisconnect={disconnect}
          onConfirmDisconnect={() => setConfirmDisconnect(true)}
          onCancelDisconnect={() => setConfirmDisconnect(false)}
          position="bottom"
        />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary/30 transition-all bg-card ${
          variant === "header" ? "h-9" : ""
        }`}
        aria-label="Wallet menu"
        aria-expanded={dropdownOpen}
      >
        <div className="relative">
          <div
            className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
        </div>
        <span className="text-sm font-medium text-foreground">{truncateAddress(address)}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
      </motion.button>

      <WalletDropdown
        open={dropdownOpen}
        address={address}
        balance={balance}
        network={network}
        showBalance={showBalance}
        avatarColor={avatarColor}
        initials={initials}
        explorerUrl={explorerUrl}
        confirmDisconnect={confirmDisconnect}
        onCopy={copyAddress}
        onToggleBalance={toggleBalance}
        onSetNetwork={setNetwork}
        onDisconnect={disconnect}
        onConfirmDisconnect={() => setConfirmDisconnect(true)}
        onCancelDisconnect={() => setConfirmDisconnect(false)}
        position="top"
      />
    </div>
  );
};

// Dropdown component
interface WalletDropdownProps {
  open: boolean;
  address: string;
  balance: number | null;
  network: string;
  showBalance: boolean;
  avatarColor: string;
  initials: string;
  explorerUrl: string | null;
  confirmDisconnect: boolean;
  onCopy: () => void;
  onToggleBalance: () => void;
  onSetNetwork: (n: "mainnet-beta" | "devnet") => void;
  onDisconnect: () => void;
  onConfirmDisconnect: () => void;
  onCancelDisconnect: () => void;
  position: "top" | "bottom";
}

function WalletDropdown({
  open,
  address,
  balance,
  network,
  showBalance,
  avatarColor,
  initials,
  explorerUrl,
  confirmDisconnect,
  onCopy,
  onToggleBalance,
  onSetNetwork,
  onDisconnect,
  onConfirmDisconnect,
  onCancelDisconnect,
  position,
}: WalletDropdownProps) {
  const positionClass =
    position === "bottom"
      ? "bottom-full mb-2 right-0"
      : "top-full mt-2 right-0";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: position === "bottom" ? 8 : -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position === "bottom" ? 8 : -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className={`absolute ${positionClass} z-50 w-72 rounded-xl bg-card border border-border shadow-modal p-4`}
          role="menu"
          aria-label="Wallet options"
        >
          {/* Profile header */}
          <div className="flex items-center gap-3 pb-3 border-b border-border mb-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-foreground"
              style={{ backgroundColor: avatarColor }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">{truncateAddress(address)}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success" />
                <span className="text-xs text-muted-foreground">
                  {network === "mainnet-beta" ? "Mainnet" : "Devnet"}
                </span>
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-3">
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Balance</div>
              <div className="text-sm font-bold text-foreground">
                {showBalance ? `${balance?.toFixed(4)} SOL` : "••••••"}
              </div>
            </div>
            <button
              onClick={onToggleBalance}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-1">
            <DropdownItem icon={<Copy className="h-4 w-4" />} label="Copy Address" onClick={onCopy} />
            {explorerUrl && (
              <DropdownItem
                icon={<ExternalLink className="h-4 w-4" />}
                label="View on Explorer"
                onClick={() => window.open(explorerUrl, "_blank")}
              />
            )}
            <DropdownItem
              icon={<Globe className="h-4 w-4" />}
              label={`Switch to ${network === "mainnet-beta" ? "Devnet" : "Mainnet"}`}
              onClick={() => onSetNetwork(network === "mainnet-beta" ? "devnet" : "mainnet-beta")}
            />
          </div>

          {/* Disconnect */}
          <div className="mt-3 pt-3 border-t border-border">
            {!confirmDisconnect ? (
              <DropdownItem
                icon={<LogOut className="h-4 w-4" />}
                label="Disconnect"
                onClick={onConfirmDisconnect}
                destructive
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <p className="text-xs text-muted-foreground text-center">Are you sure you want to disconnect?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs border-border"
                    onClick={onCancelDisconnect}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={onDisconnect}
                  >
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DropdownItem({
  icon,
  label,
  onClick,
  destructive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted"
      }`}
      role="menuitem"
    >
      {icon}
      {label}
    </button>
  );
}

export default WalletConnect;
