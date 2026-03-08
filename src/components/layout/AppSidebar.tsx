import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { Sparkles } from "lucide-react";
import WalletConnect from "@/components/wallet/WalletConnect";

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-surface h-screen sticky top-0 shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold text-gradient">{APP_NAME}</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? ""
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              activeClassName="bg-primary/10 text-primary font-medium"
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <WalletConnect variant="default" />
      </div>
    </aside>
  );
};

export default AppSidebar;
