import xbagsLogo from "@/assets/xbags-logo.png";
import WalletConnect from "@/components/wallet/WalletConnect";

const Header = () => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <img src={xbagsLogo} alt="xbags" className="h-7 w-auto" />
      </div>
      <WalletConnect variant="header" />
    </header>
  );
};

export default Header;
