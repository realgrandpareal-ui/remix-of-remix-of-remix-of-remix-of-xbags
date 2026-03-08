import { supabase } from "@/integrations/supabase/client";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  media_type: string;
  is_locked: boolean;
  unlock_price_sol: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  author?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    wallet_address: string;
  };
  // Client state
  is_liked?: boolean;
  is_unlocked?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const feedAPI = {
  async getFeed(
    tab: "home" | "recent" | "popular" | "following",
    page: number = 1,
    limit: number = 20,
    currentUserProfileId?: string
  ) {
    let query = supabase
      .from("posts")
      .select("*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url, wallet_address)")
      .range((page - 1) * limit, page * limit - 1);

    switch (tab) {
      case "recent":
        query = query.order("created_at", { ascending: false });
        break;
      case "popular":
        query = query.order("likes_count", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw error;

    const posts: Post[] = (data || []).map((p: any) => ({
      ...p,
      media_urls: p.media_urls || [],
      author: p.profiles || undefined,
    }));

    // Check likes for current user
    if (currentUserProfileId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds)
        .eq("user_id", currentUserProfileId);

      const likedSet = new Set((likes || []).map((l: any) => l.post_id));
      posts.forEach((p) => (p.is_liked = likedSet.has(p.id)));

      // Check unlocks
      const { data: unlocks } = await supabase
        .from("post_unlocks")
        .select("post_id")
        .in("post_id", postIds.filter((id) => posts.find((p) => p.id === id)?.is_locked));

      const unlockedSet = new Set((unlocks || []).map((u: any) => u.post_id));
      posts.forEach((p) => {
        if (p.is_locked) p.is_unlocked = unlockedSet.has(p.id);
      });
    }

    return { posts, hasMore: (data || []).length === limit };
  },

  async createPost(
    userId: string,
    content: string,
    mediaUrls: string[] = [],
    mediaType: string = "none",
    isLocked: boolean = false,
    unlockPrice: number = 0,
    scheduledAt?: string
  ) {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        content,
        media_urls: mediaUrls,
        media_type: mediaType,
        is_locked: isLocked,
        unlock_price_sol: unlockPrice,
        ...(scheduledAt ? { scheduled_at: scheduledAt, is_published: false } : {}),
      } as any)
      .select("*, profiles!posts_user_id_fkey(id, username, display_name, avatar_url, wallet_address)")
      .single();

    if (error) throw error;
    return { ...data, author: (data as any).profiles } as Post;
  },

  async likePost(postId: string, userId: string) {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId } as any);
    if (error && !error.message.includes("duplicate")) throw error;
  },

  async unlikePost(postId: string, userId: string) {
    await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);
  },

  async getComments(postId: string) {
    const { data, error } = await supabase
      .from("post_comments")
      .select("*, profiles!post_comments_user_id_fkey(username, display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      author: c.profiles || undefined,
    })) as Comment[];
  },

  async addComment(postId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, user_id: userId, content } as any)
      .select("*, profiles!post_comments_user_id_fkey(username, display_name, avatar_url)")
      .single();

    if (error) throw error;
    return { ...data, author: (data as any).profiles } as Comment;
  },

  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  async recordUnlock(postId: string, userWallet: string, amountSol: number, signature: string) {
    const { error } = await supabase
      .from("post_unlocks")
      .insert({
        post_id: postId,
        user_wallet: userWallet,
        amount_sol: amountSol,
        transaction_signature: signature,
      } as any);
    if (error) throw error;
  },

  async uploadMedia(file: File, userId: string) {
    const ext = file.name.split(".").pop();
    const path = `posts/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  },
};
