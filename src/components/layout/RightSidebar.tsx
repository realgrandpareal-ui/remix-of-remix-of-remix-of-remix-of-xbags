import { TrendingUp, Zap, UserPlus, CheckCircle2, Circle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const trendingItems = [
  { tag: "$BAGS", type: "token" },
  { name: "Luna Waves", handle: "@lunawaves", preview: "Just dropped a new collection..." },
  { name: "AZE", handle: "@aze_gen", preview: "Hey all! What features would you like to..." },
];

const topServices = [
  { name: "/launch", creator: "@bags", price: "$0.01", runs: 18 },
  { name: "/mint-nft", creator: "@bags", price: "$0.05", runs: 43 },
  { name: "/ai-generate", creator: "@xona_agent", price: "$0.50", runs: 2 },
];

const whoToFollow = [
  { name: "bags.fun", handle: "@bags", color: "bg-primary/20 text-primary" },
  { name: "Block Builder", handle: "@blockbuilder", color: "bg-info/20 text-info" },
  { name: "Melody Chain", handle: "@melodychain", color: "bg-warning/20 text-warning" },
];

const getStartedItems = [
  { label: "Upload a profile pic", done: false },
  { label: "Add a banner", done: false },
  { label: "Write a bio", done: false },
  { label: "Create your first post", done: true },
  { label: "Follow 3 people (0/3)", done: false },
  { label: "Fund your wallet", done: false, action: "Add funds" },
];

const RightSidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-[340px] border-l border-border bg-background h-screen sticky top-0 shrink-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bags.fun"
            className="w-full bg-card border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Get Started */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary">1/7</span>
              </div>
              <h3 className="font-bold text-sm text-foreground">Get Started</h3>
            </div>
          </div>
          <div className="space-y-2.5">
            {getStartedItems.map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {item.label}
                  </span>
                </div>
                {item.action && (
                  <Button size="sm" className="h-7 px-3 text-xs bg-primary text-primary-foreground hover:bg-secondary">
                    {item.action}
                  </Button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">Complete all steps to unlock full platform features</p>
        </div>

        {/* Trending */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Trending</h3>
          </div>
          <div className="space-y-3">
            {trendingItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                {item.tag ? (
                  <>
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">$</span>
                    </div>
                    <span className="text-sm font-semibold text-primary">{item.tag}</span>
                  </>
                ) : (
                  <>
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                      {item.name?.split(" ").map(w => w[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{item.name}</div>
                      <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Top Services</h3>
          </div>
          <div className="space-y-2.5">
            {topServices.map((service) => (
              <div key={service.name} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{service.name}</div>
                  <div className="text-xs text-muted-foreground">{service.creator}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-primary">{service.price}</div>
                  <div className="text-xs text-muted-foreground">{service.runs} runs</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Who to Follow */}
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm text-foreground">Who to follow</h3>
          </div>
          <div className="space-y-3">
            {whoToFollow.map((user) => (
              <div key={user.handle} className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${user.color}`}>
                  {user.name.split(" ").map(w => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.handle}</div>
                </div>
                <Button size="sm" className="h-8 px-4 text-xs bg-primary text-primary-foreground hover:bg-secondary rounded-full">
                  Follow
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
