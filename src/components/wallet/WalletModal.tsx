import { useEffect } from 'react';
import { useWallet } from '@/hooks/use-wallet';

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

const WalletModal = ({ open, onClose }: WalletModalProps) => {
  const { connect, status } = useWallet();

  useEffect(() => {
    if (open) {
      connect();
      // Privy shows its own modal, close ours immediately
      onClose();
    }
  }, [open, connect, onClose]);

  // Close when connected
  useEffect(() => {
    if (status === "connected" && open) onClose();
  }, [status, open, onClose]);

  return null;
};

export default WalletModal;
