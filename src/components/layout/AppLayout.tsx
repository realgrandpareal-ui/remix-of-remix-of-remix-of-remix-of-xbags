import { ReactNode } from "react";
import AppSidebar from "./AppSidebar";
import Header from "./Header";
import BottomNav from "./BottomNav";
import RightSidebar from "./RightSidebar";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="dark min-h-screen flex w-full bg-background text-foreground">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Header />
        <div className="flex-1 flex">
          <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
