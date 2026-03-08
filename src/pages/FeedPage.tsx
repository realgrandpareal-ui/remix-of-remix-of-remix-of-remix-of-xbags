import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const posts = [
  {
    id: 1, author: "Alex Chen", handle: "@alexchen", avatar: "AC", time: "2h ago",
    content: "Just launched my new NFT collection on bags.fun 🎨 The future of digital art is here.",
    likes: 142, comments: 23, shares: 8, color: "bg-primary/20 text-primary",
  },
  {
    id: 2, author: "Sara Kim", handle: "@sarakim", avatar: "SK", time: "4h ago",
    content: "Building in public day 45: Finally hit 10K followers on bags.fun! Thank you everyone for the support 🚀",
    likes: 389, comments: 67, shares: 24, color: "bg-info/20 text-info",
  },
  {
    id: 3, author: "Dev Marcus", handle: "@devmarcus", avatar: "DM", time: "6h ago",
    content: "New tutorial: How to integrate Solana wallet into your creator platform. Link in bio 🔗",
    likes: 256, comments: 41, shares: 15, color: "bg-warning/20 text-warning",
  },
];

const FeedPage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Feed</h1>
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${post.color}`}>{post.avatar}</div>
                <div>
                  <div className="font-semibold text-sm text-foreground">{post.author}</div>
                  <div className="text-xs text-muted-foreground">{post.handle} · {post.time}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
            </div>
            <p className="text-sm text-foreground leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive text-xs"><Heart className="h-4 w-4" /> {post.likes}</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary text-xs"><MessageCircle className="h-4 w-4" /> {post.comments}</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-primary text-xs"><Share2 className="h-4 w-4" /> {post.shares}</Button>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-warning"><Bookmark className="h-4 w-4" /></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;
