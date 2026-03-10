import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { feedAPI } from "@/lib/api/feed";
import type { Profile } from "@/hooks/use-profile";
import type { Post } from "@/lib/api/feed";
import PostCard from "@/components/feed/PostCard";
import PostSkeleton from "@/components/feed/PostSkeleton";

const ProfilePage = () => {
  const { username } = useParams();
  const { profile: myProfile, setShowSetupModal } = useProfile();
  const { address } = useWallet();
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reposts, setReposts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [repostsLoading, setRepostsLoading] = useState(false);
  const [postsCount, setPostsCount] = useState(0);
  const [activeTab, setActiveTab] = useState("posts");

  const isOwnProfile = !username || username === "me" || username === myProfile?.username;

  useEffect(() => {
    if (isOwnProfile) {
      setViewProfile(myProfile);
    } else if (username) {
      setIsLoading(true);
      supabase
        .from("profiles")
        .select("*")
        .ilike("username", username)
        .maybeSingle()
        .then(({ data }) => {
          setViewProfile(data);
          setIsLoading(false);
        });
    }
  }, [username, myProfile, isOwnProfile]);

  // Load all user posts (tweets + reposts + quotes, like Twitter)
  useEffect(() => {
    if (!viewProfile?.id) return;
    setPostsLoading(true);
    
    Promise.all([
      feedAPI.getUserPosts(viewProfile.id),
      supabase
        .from("posts")
        .select("id", { count: "exact" })
        .eq("user_id", viewProfile.id)
        .eq("is_published", true),
    ]).then(([userPosts, countRes]) => {
      setPosts(userPosts);
      setPostsCount(countRes.count || 0);
      setPostsLoading(false);
    }).catch(() => setPostsLoading(false));
  }, [viewProfile?.id]);

  // Load reposts when tab is active
  useEffect(() => {
    if (activeTab !== "reposts" || !viewProfile?.id) return;
    setRepostsLoading(true);
    feedAPI.getUserReposts(viewProfile.id).then((data) => {
      setReposts(data);
      setRepostsLoading(false);
    }).catch(() => setRepostsLoading(false));
  }, [activeTab, viewProfile?.id]);

  const handlePostUpdate = useCallback((postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
    setReposts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  }, []);

  const handlePostDelete = useCallback((postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setReposts(prev => prev.filter(p => p.id !== postId));
    setPostsCount(c => c - 1);
  }, []);

  const profile = viewProfile;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <div className="h-32 sm:h-48 rounded-xl bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 mb-[-40px] relative" />
      <div className="relative z-10 px-4">
        <Avatar className="h-20 w-20 border-4 border-background">
          {profile?.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name || ""} />
          ) : null}
          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
            {profile?.display_name?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">{profile?.display_name || "Unknown User"}</h1>
            <p className="text-sm text-muted-foreground">@{profile?.username || "—"}</p>
            {profile?.bio && (
              <p className="text-sm text-foreground mt-2 max-w-md">{profile.bio}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Global</span>
              <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> bags.fun</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"}</span>
            </div>
          </div>
          {isOwnProfile && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border self-start hover:border-primary"
              onClick={() => setShowSetupModal(true)}
            >
              <Edit className="h-3.5 w-3.5" /> Edit Profile
            </Button>
          )}
        </div>
        <div className="flex gap-6 mt-6">
          {[{ value: String(postsCount), label: "Posts" }, { value: "0", label: "Followers" }, { value: "0", label: "Following" }].map((s) => (
            <div key={s.label}><span className="font-bold text-foreground">{s.value}</span> <span className="text-sm text-muted-foreground">{s.label}</span></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">OG Creator</Badge>
        </div>
      </div>

      {/* Posts Section with Tabs */}
      <div className="mt-8">
        <Tabs defaultValue="posts" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-card border border-border">
            <TabsTrigger value="posts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Posts
            </TabsTrigger>
            <TabsTrigger value="reposts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Reposts
            </TabsTrigger>
            <TabsTrigger value="replies" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Replies
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-muted-foreground">
              Media
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-0">
            {isLoading || postsLoading ? (
              [1, 2, 3].map((_, i) => <PostSkeleton key={i} />)
            ) : posts.length > 0 ? (
              posts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                  index={i}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No posts yet</div>
            )}
          </TabsContent>

          <TabsContent value="reposts" className="mt-4 space-y-0">
            {repostsLoading ? (
              [1, 2, 3].map((_, i) => <PostSkeleton key={i} />)
            ) : reposts.length > 0 ? (
              reposts.map((post, i) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={handlePostUpdate}
                  onDelete={handlePostDelete}
                  index={i}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">No reposts yet</div>
            )}
          </TabsContent>

          <TabsContent value="replies" className="mt-4">
            <div className="text-center py-12 text-muted-foreground text-sm">Replies coming soon</div>
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <div className="text-center py-12 text-muted-foreground text-sm">Media posts coming soon</div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
