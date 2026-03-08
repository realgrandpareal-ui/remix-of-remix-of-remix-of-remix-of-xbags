import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, AlertCircle, RefreshCw } from "lucide-react";
import { useWallet, WalletName } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

const WalletModal = ({ open, onClose }: WalletModalProps) => {
  const { wallets, connect, status, errorMessage, retryConnect } = useWallet();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open && firstFocusRef.current) firstFocusRef.current.focus();
  }, [open]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleSelect = async (walletName: WalletName) => {
    await connect(walletName);
  };

  useEffect(() => {
    if (status === "connected" && open) onClose();
  }, [status, open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Connect Wallet"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25 }}
            className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-foreground">Connect Wallet</h2>
              <button
                ref={firstFocusRef}
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Choose your preferred wallet</p>

            {/* Error */}
            {status === "error" && errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3"
              >
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retryConnect}
                    className="mt-2 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  >
                    <RefreshCw className="h-3 w-3" /> Retry
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Wallet list */}
            <div className="space-y-2.5" role="listbox" aria-label="Available wallets">
              {wallets.map((wallet) => {
                const isConnecting = status === "connecting";
                return (
                  <motion.button
                    key={wallet.name}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(wallet.name)}
                    disabled={isConnecting}
                    role="option"
                    aria-selected={false}
                    aria-label={`Connect to ${wallet.label}${!wallet.installed ? " (not installed)" : ""}`}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-muted/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <span className="text-2xl w-10 h-10 flex items-center justify-center" aria-hidden="true">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {wallet.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {wallet.installed ? wallet.description : "Not installed"}
                      </div>
                    </div>
                    {!wallet.installed && <ExternalLink className="h-4 w-4 text-muted-foreground" />}
                    {wallet.installed && <div className="h-2 w-2 rounded-full bg-success" />}
                  </motion.button>
                );
              })}
            </div>

            {/* Connecting overlay */}
            <AnimatePresence>
              {status === "connecting" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-2xl bg-card/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                >
                  <div className="h-10 w-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-foreground">Connecting...</p>
                  <p className="text-xs text-muted-foreground">Approve the request in your wallet</p>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-xs text-muted-foreground text-center mt-5">
              By connecting, you agree to our Terms of Service
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WalletModal;
