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
  reposts_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    wallet_address: string;
  };
  is_liked?: boolean;
  is_reposted?: boolean;
  is_unlocked?: boolean;
  quoted_post?: Post;
  quote_content?: string;
  // Repost metadata
  repost_type?: "repost" | "quote";
  reposted_by?: {
    id: string;
    username: string | null;
    display_name: string | null;
  };
  repost_created_at?: string;
  /** Used for feed sorting — repost time or post created_at */
  sort_time?: string;
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

const PROFILE_SELECT = "id, username, display_name, avatar_url, wallet_address";

export const feedAPI = {
  // ─── FEED ──────────────────────────────────────────────
  async getFeed(
    tab: "home" | "recent" | "popular" | "following",
    page: number = 1,
    limit: number = 20,
    currentUserProfileId?: string
  ) {
    let query = supabase
      .from("posts")
      .select(`*, profiles!posts_user_id_fkey(${PROFILE_SELECT})`)
      .eq("is_published", true)
      .range((page - 1) * limit, page * limit - 1);

    switch (tab) {
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
      reposts_count: p.reposts_count || 0,
      author: p.profiles || undefined,
    }));

    if (currentUserProfileId && posts.length > 0) {
      const postIds = posts.map((p) => p.id);

      const [likesRes, repostsRes] = await Promise.all([
        supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", postIds)
          .eq("user_id", currentUserProfileId),
        supabase
          .from("post_reposts")
          .select("post_id")
          .in("post_id", postIds)
          .eq("user_id", currentUserProfileId),
      ]);

      const likedSet = new Set((likesRes.data || []).map((l: any) => l.post_id));
      const repostedSet = new Set((repostsRes.data || []).map((r: any) => r.post_id));

      posts.forEach((p) => {
        p.is_liked = likedSet.has(p.id);
        p.is_reposted = repostedSet.has(p.id);
      });

      // Check unlocks for locked posts
      const lockedIds = postIds.filter((id) => posts.find((p) => p.id === id)?.is_locked);
      if (lockedIds.length > 0) {
        const { data: unlocks } = await supabase
          .from("post_unlocks")
          .select("post_id")
          .in("post_id", lockedIds);
        const unlockedSet = new Set((unlocks || []).map((u: any) => u.post_id));
        posts.forEach((p) => {
          if (p.is_locked) p.is_unlocked = unlockedSet.has(p.id);
        });
      }
    }

    return { posts, hasMore: (data || []).length === limit };
  },

  // ─── CREATE POST ───────────────────────────────────────
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
      .select(`*, profiles!posts_user_id_fkey(${PROFILE_SELECT})`)
      .single();

    if (error) throw error;
    return { ...data, author: (data as any).profiles } as Post;
  },

  // ─── LIKE / UNLIKE (toggle, 1 per user) ────────────────
  async toggleLike(postId: string, userId: string, currentlyLiked: boolean) {
    if (currentlyLiked) {
      // Unlike
      const { error } = await supabase
        .from("post_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
      await supabase.rpc("decrement_likes" as any, { p_post_id: postId });
      return false;
    } else {
      // Like — unique constraint prevents duplicates
      const { error } = await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: userId } as any);
      if (error) {
        if (error.code === "23505") return true; // already liked
        throw error;
      }
      await supabase.rpc("increment_likes" as any, { p_post_id: postId });
      return true;
    }
  },

  // ─── REPOST / UNREPOST (toggle, 1 per user) ────────────
  async toggleRepost(postId: string, userId: string, currentlyReposted: boolean) {
    if (currentlyReposted) {
      const { error } = await supabase
        .from("post_reposts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
      if (error) throw error;
      await supabase.rpc("decrement_reposts" as any, { p_post_id: postId });
      return false;
    } else {
      const { error } = await supabase
        .from("post_reposts")
        .insert({ post_id: postId, user_id: userId } as any);
      if (error) {
        if (error.code === "23505") return true; // already reposted
        throw error;
      }
      await supabase.rpc("increment_reposts" as any, { p_post_id: postId });
      return true;
    }
  },

  // ─── QUOTE TWEET ───────────────────────────────────────
  async quoteRetweet(postId: string, userId: string, quoteText: string) {
    const { error } = await supabase
      .from("post_reposts")
      .insert({
        post_id: postId,
        user_id: userId,
        quote_content: quoteText,
      } as any);
    if (error) {
      if (error.code === "23505") throw new Error("Already quoted this post");
      throw error;
    }
    await supabase.rpc("increment_reposts" as any, { p_post_id: postId });
  },

  // ─── COMMENTS ──────────────────────────────────────────
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
    await supabase.rpc("increment_comments" as any, { p_post_id: postId });
    return { ...data, author: (data as any).profiles } as Comment;
  },

  // ─── DELETE POST ───────────────────────────────────────
  async deletePost(postId: string) {
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) throw error;
  },

  // ─── VIEWS & SHARES ───────────────────────────────────
  async incrementViews(postId: string) {
    await supabase.rpc("increment_views" as any, { post_id: postId });
  },

  async incrementShares(postId: string) {
    const { data } = await supabase.from("posts").select("shares_count").eq("id", postId).single();
    if (data) {
      await supabase.from("posts").update({ shares_count: (data.shares_count || 0) + 1 } as any).eq("id", postId);
    }
  },

  // ─── MEDIA UPLOAD ──────────────────────────────────────
  async uploadMedia(file: File, userId: string) {
    const ext = file.name.split(".").pop();
    const path = `posts/${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return urlData.publicUrl;
  },

  // ─── UNLOCK ────────────────────────────────────────────
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
};
