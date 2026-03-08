import { useState, useEffect, useCallback, useRef } from "react";
import { feedAPI, Post } from "@/lib/api/feed";
import { useProfile } from "@/hooks/use-profile";
import { supabase } from "@/integrations/supabase/client";

type FeedTab = "home" | "recent" | "popular" | "following";

export function useFeed(tab: FeedTab) {
  const { profile } = useProfile();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const mountedRef = useRef(true);

  const fetchFeed = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      try {
        const result = await feedAPI.getFeed(tab, pageNum, 20, profile?.id);
        if (!mountedRef.current) return;

        if (append) {
          setPosts((prev) => [...prev, ...result.posts]);
        } else {
          setPosts(result.posts);
        }
        setHasMore(result.hasMore);
        setPage(pageNum);
      } catch (err) {
        console.error("Feed fetch error:", err);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [tab, profile?.id]
  );

  useEffect(() => {
    mountedRef.current = true;
    fetchFeed(1);
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFeed]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        // Refresh feed on new post
        fetchFeed(1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeed]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchFeed(page + 1, true);
    }
  }, [loadingMore, hasMore, page, fetchFeed]);

  const refresh = useCallback(() => fetchFeed(1), [fetchFeed]);

  const addPost = useCallback((post: Post) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const updatePostInList = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updates } : p))
    );
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchFeed: refresh,
    loadMore,
    refresh,
    addPost,
    updatePostInList,
    removePost,
  };
}
