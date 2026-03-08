import { useState } from "react";
import { motion } from "framer-motion";
import {
  Heart, MessageCircle, Share2, Eye, Lock, MoreHorizontal,
  Trash2, Loader2, Diamond,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Post, feedAPI } from "@/lib/api/feed";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { toast } from "sonner";
import CommentSection from "./CommentSection";
import TipModal from "./TipModal";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

interface PostCardProps {
  post: Post;
  onUpdate: (postId: string, updates: Partial<Post>) => void;
  onDelete: (postId: string) => void;
  index: number;
}

export default function PostCard({ post, onUpdate, onDelete, index }: PostCardProps) {
  const { profile } = useProfile();
  const { sendTransaction, address, solPrice } = useWallet();
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isOwn = profile?.id === post.user_id;
  const isLocked = post.is_locked && !post.is_unlocked && !isOwn;
  const displayName = post.author?.display_name || post.author?.username || "Anonymous";
  const username = post.author?.username ? `@${post.author.username}` : "";
  const contentLong = post.content.length > 200;

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

  const handleDelete = async () => {
    try {
      await feedAPI.deletePost(post.id);
      onDelete(post.id);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleUnlock = async () => {
    if (!address || !post.author?.wallet_address) return;
    setUnlocking(true);
    try {
      const sig = await sendTransaction(post.author.wallet_address, post.unlock_price_sol);
      if (sig) {
        await feedAPI.recordUnlock(post.id, address, post.unlock_price_sol, sig);
        onUpdate(post.id, { is_unlocked: true });
        toast.success("Content unlocked! 🔓");
      }
    } catch (err) {
      toast.error("Unlock failed");
    } finally {
      setUnlocking(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied!");
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
          <Avatar className="h-10 w-10 shrink-0">
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
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
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
            {isLocked ? (
              <div className="mt-2">
                <div className="h-32 rounded-lg bg-muted/50 border border-border flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 backdrop-blur-sm bg-background/50" />
                  <Lock className="h-6 w-6 text-muted-foreground relative z-10 mb-2" />
                  <span className="text-xs text-muted-foreground relative z-10">Locked Content</span>
                </div>
                <Button
                  onClick={handleUnlock}
                  disabled={unlocking}
                  size="sm"
                  className="mt-2 bg-primary text-primary-foreground hover:bg-secondary text-xs font-semibold"
                >
                  {unlocking ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Lock className="h-3 w-3 mr-1" />
                  )}
                  Unlock for {post.unlock_price_sol} SOL
                  {solPrice && (
                    <span className="ml-1 opacity-70">
                      (≈${(post.unlock_price_sol * solPrice).toFixed(2)})
                    </span>
                  )}
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground leading-relaxed mt-1 whitespace-pre-line">
                  {contentLong && !expanded ? `${post.content.slice(0, 200)}...` : post.content}
                </p>
                {contentLong && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="text-xs text-primary mt-1 hover:underline"
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                )}

                {/* Media */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    {post.media_type === "video" ? (
                      <video src={post.media_urls[0]} controls className="w-full max-h-80 object-cover" />
                    ) : (
                      <div className={`grid gap-1 ${post.media_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                        {post.media_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-full max-h-80 object-cover" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex items-center gap-0.5 mt-3 -ml-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={liking}
                className={`gap-1 text-xs h-8 px-2 ${
                  post.is_liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${post.is_liked ? "fill-current" : ""}`} />
                {post.likes_count > 0 && post.likes_count}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="gap-1 text-muted-foreground hover:text-primary text-xs h-8 px-2"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {post.comments_count > 0 && post.comments_count}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="gap-1 text-muted-foreground hover:text-primary text-xs h-8 px-2"
              >
                <Share2 className="h-3.5 w-3.5" />
                {post.shares_count > 0 && post.shares_count}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTipModal(true)}
                className="gap-1 text-muted-foreground hover:text-warning text-xs h-8 px-2"
              >
                <Diamond className="h-3.5 w-3.5" />
                Tip
              </Button>

              <div className="flex-1" />
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="h-3 w-3" /> {post.views_count}
              </span>
            </div>

            {/* Comments */}
            {showComments && (
              <CommentSection
                postId={post.id}
                onCommentAdded={() =>
                  onUpdate(post.id, { comments_count: post.comments_count + 1 })
                }
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Tip Modal */}
      {showTipModal && post.author && (
        <TipModal
          isOpen={showTipModal}
          onClose={() => setShowTipModal(false)}
          recipientWallet={post.author.wallet_address}
          recipientName={displayName}
          recipientUsername={post.author.username}
        />
      )}
    </>
  );
}
