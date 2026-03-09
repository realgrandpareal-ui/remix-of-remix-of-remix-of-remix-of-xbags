import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Eye, MoreHorizontal,
  Trash2, Diamond, Repeat2, Link2, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Post, feedAPI } from "@/lib/api/feed";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";
import CommentSection from "./CommentSection";
import TipModal from "./TipModal";
import QuoteModal from "./QuoteModal";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? String(n) : "";
}

interface PostCardProps {
  post: Post;
  onUpdate: (postId: string, updates: Partial<Post>) => void;
  onDelete: (postId: string) => void;
  index: number;
}

export default function PostCard({ post, onUpdate, onDelete, index }: PostCardProps) {
  const { profile } = useProfile();
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [reposting, setReposting] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasViewed, setHasViewed] = useState(false);

  const isOwn = profile?.id === post.user_id;
  const displayName = post.author?.display_name || post.author?.username || "Anonymous";
  const username = post.author?.username ? `@${post.author.username}` : "";
  const contentLong = post.content.length > 200;

  // Track views
  useEffect(() => {
    if (!hasViewed) {
      setHasViewed(true);
      feedAPI.incrementViews(post.id).catch(() => {});
      onUpdate(post.id, { views_count: post.views_count + 1 });
    }
  }, [post.id, hasViewed, onUpdate, post.views_count]);

  const handleLike = async () => {
    if (!profile) return toast.error("Connect wallet first");
    setLiking(true);
    try {
      if (post.is_liked) {
        await feedAPI.unlikePost(post.id, profile.id);
        onUpdate(post.id, { is_liked: false, likes_count: Math.max(0, post.likes_count - 1) });
      } else {
        await feedAPI.likePost(post.id, profile.id);
        onUpdate(post.id, { is_liked: true, likes_count: post.likes_count + 1 });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLiking(false);
    }
  };

  const handleRepost = async () => {
    if (!profile) return toast.error("Connect wallet first");
    setReposting(true);
    try {
      if (post.is_reposted) {
        await feedAPI.unrepost(post.id, profile.id);
        onUpdate(post.id, { is_reposted: false, reposts_count: Math.max(0, (post.reposts_count || 0) - 1) });
        toast.success("Repost removed");
      } else {
        await feedAPI.repost(post.id, profile.id);
        onUpdate(post.id, { is_reposted: true, reposts_count: (post.reposts_count || 0) + 1 });
        toast.success("Reposted!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to repost");
    } finally {
      setReposting(false);
    }
  };

  const handleQuote = async (quoteContent: string): Promise<void> => {
    if (!profile) {
      toast.error("Connect wallet first");
      return;
    }
    await feedAPI.repost(post.id, profile.id, quoteContent);
    onUpdate(post.id, { reposts_count: (post.reposts_count || 0) + 1 });
    toast.success("Quote posted!");
  };

  const handleDelete = async () => {
    try {
      await feedAPI.deletePost(post.id);
      onDelete(post.id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard.writeText(url);
    await feedAPI.incrementShares(post.id);
    toast.success("Link copied!");
    onUpdate(post.id, { shares_count: post.shares_count + 1 });
  };

  const handleShareToX = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const text = encodeURIComponent("Check out this post on bags.fun! 🎒");
    const url = encodeURIComponent(postUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank");
    await feedAPI.incrementShares(post.id);
    onUpdate(post.id, { shares_count: post.shares_count + 1 });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.3 }}
        className="px-4 py-4 hover:bg-muted/30 transition-colors border-b border-border"
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-transparent hover:ring-primary/30 transition-all">
            <AvatarImage src={post.author?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
              {displayName[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-sm text-foreground truncate">{displayName}</span>
                <span className="text-sm text-muted-foreground truncate">{username}</span>
                <span className="text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
              </div>
              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete Post
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Content */}
            <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-line">
              {contentLong && !expanded ? `${post.content.slice(0, 200)}...` : post.content}
            </p>
            {contentLong && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-primary mt-1 hover:underline">
                {expanded ? "Show less" : "Show more"}
              </button>
            )}

            {/* Media */}
            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-2 rounded-xl overflow-hidden border border-border">
                {post.media_type === "video" ? (
                  <video src={post.media_urls[0]} controls className="w-full max-h-80 object-cover" />
                ) : (
                  <div className={`grid gap-0.5 ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {post.media_urls.map((url, i) => (
                      <img key={i} src={url} alt="" className="w-full max-h-80 object-cover" loading="lazy" />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between mt-3 -ml-2">
              <div className="flex items-center gap-0.5">
                {/* Comment */}
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="gap-1.5 text-muted-foreground hover:text-primary text-xs h-8 px-2 group"
                >
                  <div className="p-1 rounded-full group-hover:bg-primary/10 transition-colors">
                    <MessageCircle className="h-3.5 w-3.5" />
                  </div>
                  <span>{formatCount(post.comments_count)}</span>
                </Button>

                {/* Repost dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="sm" disabled={reposting}
                      className={`gap-1.5 text-xs h-8 px-2 group ${
                        post.is_reposted ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <div className={`p-1 rounded-full transition-colors ${
                        post.is_reposted ? "bg-primary/10" : "group-hover:bg-primary/10"
                      }`}>
                        <Repeat2 className="h-3.5 w-3.5" />
                      </div>
                      <span>{formatCount(post.reposts_count || 0)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    <DropdownMenuItem onClick={handleRepost}>
                      <Repeat2 className="h-4 w-4 mr-2" />
                      {post.is_reposted ? "Undo Repost" : "Repost"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowQuoteModal(true)}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Quote Tweet
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Like */}
                <Button
                  variant="ghost" size="sm" onClick={handleLike} disabled={liking}
                  className={`gap-1.5 text-xs h-8 px-2 group ${
                    post.is_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                  }`}
                >
                  <motion.div
                    className={`p-1 rounded-full transition-colors ${
                      post.is_liked ? "bg-destructive/10" : "group-hover:bg-destructive/10"
                    }`}
                    whileTap={{ scale: 1.4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Heart className={`h-3.5 w-3.5 ${post.is_liked ? "fill-current" : ""}`} />
                  </motion.div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={post.likes_count}
                      initial={{ y: -8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 8, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {formatCount(post.likes_count)}
                    </motion.span>
                  </AnimatePresence>
                </Button>

                {/* Tip */}
                {!isOwn && post.author?.wallet_address && (
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => setShowTipModal(true)}
                    className="gap-1.5 text-muted-foreground hover:text-warning text-xs h-8 px-2 group"
                  >
                    <div className="p-1 rounded-full group-hover:bg-warning/10 transition-colors">
                      <Diamond className="h-3.5 w-3.5" />
                    </div>
                  </Button>
                )}

                {/* Share dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost" size="sm"
                      className="gap-1.5 text-muted-foreground hover:text-primary text-xs h-8 px-2 group"
                    >
                      <div className="p-1 rounded-full group-hover:bg-primary/10 transition-colors">
                        <Share2 className="h-3.5 w-3.5" />
                      </div>
                      <span>{formatCount(post.shares_count)}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-[160px]">
                    <DropdownMenuItem onClick={handleShareToX}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Share to X
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleCopyLink}>
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Views */}
              <span className="flex items-center gap-1 text-xs text-muted-foreground pr-1">
                <Eye className="h-3 w-3" />
                <AnimatePresence mode="wait">
                  <motion.span
                    key={post.views_count}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {formatCount(post.views_count)}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>

            {/* Comments section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <CommentSection
                    postId={post.id}
                    onCommentAdded={() => onUpdate(post.id, { comments_count: post.comments_count + 1 })}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {showTipModal && post.author && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          recipientWallet={post.author.wallet_address}
          recipientName={displayName}
          recipientUsername={post.author.username}
        />
      )}

      {showQuoteModal && (
        <QuoteModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          onQuote={handleQuote}
          originalPost={{
            content: post.content,
            author: post.author,
          }}
        />
      )}
    </>
  );
}
