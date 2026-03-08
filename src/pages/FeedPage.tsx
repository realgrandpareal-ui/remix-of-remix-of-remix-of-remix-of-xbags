import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, Lock, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const tabs = ["Home", "Recent", "Popular", "Following"];

const posts = [
  {
    id: 1, author: "AZE", handle: "@aze_gen", avatar: "AZ", time: "about 4 hours",
    content: "Unlock or Don't.\nChoice is yours....",
    likes: 6, comments: 0, shares: 0, views: 41,
    color: "bg-primary/20 text-primary",
    hasPaywall: true, paywallPrice: "$0.05",
    verified: true,
  },
  {
    id: 2, author: "aassouma", handle: "@aasmabhima", avatar: "aa", time: "about 3 hours",
    content: "I didn't expect a Women's Day surprise tonight but I'm not complaining....",
    likes: 5, comments: 1, shares: 0, views: 17,
    color: "bg-info/20 text-info",
    hasPaywall: true, paywallPrice: "$0.10",
    verified: true,
  },
  {
    id: 3, author: "Dev Marcus", handle: "@devmarcus", avatar: "DM", time: "6h ago",
    content: "New tutorial: How to integrate Solana wallet into your creator platform. Link in bio 🔗\n\nThis is a game changer for Web3 creators who want to monetize their content directly.",
    likes: 256, comments: 41, shares: 15, views: 1200,
    color: "bg-warning/20 text-warning",
    verified: false,
  },
  {
    id: 4, author: "Sara Kim", handle: "@sarakim", avatar: "SK", time: "8h ago",
    content: "Building in public day 45: Finally hit 10K followers on bags.fun! Thank you everyone for the support 🚀",
    likes: 389, comments: 67, shares: 24, views: 3400,
    color: "bg-primary/20 text-primary",
    repostedBy: "Christoph",
    verified: false,
  },
];

const FeedPage = () => {
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="max-w-2xl mx-auto">
      {/* Tabs */}
      <div className="flex border-b border-border sticky top-0 z-10 bg-background">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3.5 text-sm font-medium transition-colors relative ${
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="feed-tab-indicator"
                className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="divide-y divide-border">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="px-4 py-4 hover:bg-muted/30 transition-colors"
          >
            {/* Repost indicator */}
            {post.repostedBy && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 pl-12">
                <Repeat2 className="h-3 w-3" />
                <span>{post.repostedBy} reposted</span>
              </div>
            )}

            <div className="flex gap-3">
              {/* Avatar */}
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${post.color}`}>
                {post.avatar}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-foreground">{post.author}</span>
                    {post.verified && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                    <span className="text-sm text-muted-foreground">{post.handle}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                {/* Body */}
                <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-line">{post.content}</p>

                {/* Paywall */}
                {post.hasPaywall && (
                  <div className="mt-3">
                    <div className="h-32 rounded-lg bg-muted/50 border border-border flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 backdrop-blur-sm bg-background/50" />
                      <Lock className="h-6 w-6 text-muted-foreground relative z-10" />
                    </div>
                    <button className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-secondary transition-colors">
                      <Lock className="h-3 w-3" />
                      Unlock for {post.paywallPrice}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-0.5 mt-3 -ml-2">
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-destructive text-xs h-8 px-2">
                    <Heart className="h-3.5 w-3.5" /> {post.likes > 0 && post.likes}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary text-xs h-8 px-2">
                    <MessageCircle className="h-3.5 w-3.5" /> {post.comments > 0 && post.comments}
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary text-xs h-8 px-2">
                    <Repeat2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary text-xs h-8 px-2">
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1" />
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {post.views}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">· {post.time}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeedPage;
