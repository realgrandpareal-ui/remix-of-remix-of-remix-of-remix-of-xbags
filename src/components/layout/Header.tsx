import { APP_NAME } from "@/lib/constants";
import WalletConnect from "@/components/wallet/WalletConnect";

const Header = () => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-xs font-black text-primary-foreground">B</span>
        </div>
        <span className="text-base font-bold text-gradient">{APP_NAME}</span>
      </div>
      <WalletConnect variant="header" />
    </header>
  );
};

export default Header;
