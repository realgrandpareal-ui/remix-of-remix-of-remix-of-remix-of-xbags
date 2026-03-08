import { NavLink } from "@/components/NavLink";
import { MOBILE_NAV_ITEMS } from "@/lib/constants";
import { useLocation } from "react-router-dom";
import WalletConnect from "@/components/wallet/WalletConnect";

const BottomNav = () => {
  const location = useLocation();

  // Replace the last item (Profile) with wallet on mobile
  const navItems = MOBILE_NAV_ITEMS.slice(0, 4);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-surface/95 backdrop-blur-lg">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive ? "" : "text-muted-foreground"
              }`}
              activeClassName="text-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </NavLink>
          );
        })}
        <WalletConnect variant="mobile-icon" />
      </div>
    </nav>
  );
};

export default BottomNav;
