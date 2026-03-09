import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/feed/PostCard";
import { feedAPI, Post } from "@/lib/api/feed";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles!posts_user_id_fkey(id, username, display_name, avatar_url, wallet_address),
            parent_post:posts!posts_parent_post_id_fkey(
              *,
              profiles!posts_user_id_fkey(id, username, display_name, avatar_url, wallet_address)
            )
          `)
          .eq("id", postId)
          .eq("is_published", true)
          .single();

        if (error) throw error;

        const parentRaw = (data as any).parent_post;
        const parentPost = parentRaw && !Array.isArray(parentRaw)
          ? { ...parentRaw, media_urls: parentRaw.media_urls || [], author: parentRaw.profiles || undefined, post_type: parentRaw.post_type || "tweet" as const, parent_post_id: parentRaw.parent_post_id || null }
          : Array.isArray(parentRaw) && parentRaw.length > 0
          ? { ...parentRaw[0], media_urls: parentRaw[0].media_urls || [], author: parentRaw[0].profiles || undefined, post_type: parentRaw[0].post_type || "tweet" as const, parent_post_id: parentRaw[0].parent_post_id || null }
          : undefined;

        const p: Post = {
          ...data,
          media_urls: data.media_urls || [],
          reposts_count: data.reposts_count || 0,
          post_type: (data as any).post_type || "tweet",
          parent_post_id: (data as any).parent_post_id || null,
          author: (data as any).profiles || undefined,
          parent_post: parentPost,
        };

        // Check like/repost status
        if (profile?.id) {
          const [likesRes, repostsRes] = await Promise.all([
            supabase.from("post_likes").select("id").eq("post_id", postId).eq("user_id", profile.id).maybeSingle(),
            supabase.from("post_reposts").select("id").eq("post_id", postId).eq("user_id", profile.id).maybeSingle(),
          ]);
          p.is_liked = !!likesRes.data;
          p.is_reposted = !!repostsRes.data;
        }

        setPost(p);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, profile?.id]);

  const handleUpdate = (id: string, updates: Partial<Post>) => {
    setPost((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));
  };

  const handleDelete = () => {
    navigate("/");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Post</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : post ? (
        <PostCard post={post} onUpdate={handleUpdate} onDelete={handleDelete} index={0} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-semibold text-foreground mb-1">Post not found</p>
          <p className="text-sm text-muted-foreground">It may have been deleted.</p>
        </div>
      )}
    </div>
  );
}
