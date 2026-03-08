import { motion } from "framer-motion";
import { MessageSquare, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const conversations = [
  { id: 1, name: "Luna Waves", handle: "@lunawaves", lastMessage: "Hey, love your latest NFT drop! 🔥", time: "2m ago", unread: 3, color: "bg-primary/20 text-primary" },
  { id: 2, name: "Block Builder", handle: "@blockbuilder", lastMessage: "Let's collab on the new project", time: "1h ago", unread: 0, color: "bg-info/20 text-info" },
  { id: 3, name: "Melody Chain", handle: "@melodychain", lastMessage: "Sent you the tracks 🎵", time: "3h ago", unread: 1, color: "bg-warning/20 text-warning" },
  { id: 4, name: "Pixel Prime", handle: "@pixelprime", lastMessage: "Check out this new feature", time: "1d ago", unread: 0, color: "bg-destructive/20 text-destructive" },
  { id: 5, name: "Data Sage", handle: "@datasage", lastMessage: "Analytics report is ready", time: "2d ago", unread: 0, color: "bg-success/20 text-success" },
];

const MessagesPage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search conversations..." className="pl-10 bg-card border-border" />
      </div>

      <div className="space-y-2">
        {conversations.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer"
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${c.color}`}>
              {c.name.split(" ").map(w => w[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
            </div>
            {c.unread > 0 && (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-primary-foreground">{c.unread}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MessagesPage;
