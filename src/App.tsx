import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/hooks/use-wallet";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import FeedPage from "./pages/FeedPage";
import ExplorePage from "./pages/ExplorePage";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ReferralPage from "./pages/ReferralPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/referral" element={<ReferralPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
