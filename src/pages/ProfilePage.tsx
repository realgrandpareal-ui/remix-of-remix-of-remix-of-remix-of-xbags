import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/use-profile";

const ProfilePage = () => {
  const { username } = useParams();
  const { profile: myProfile, setShowSetupModal } = useProfile();
  const { address } = useWallet();
  const [viewProfile, setViewProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          {[{ value: "0", label: "Posts" }, { value: "0", label: "Followers" }, { value: "0", label: "Following" }].map((s) => (
            <div key={s.label}><span className="font-bold text-foreground">{s.value}</span> <span className="text-sm text-muted-foreground">{s.label}</span></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">OG Creator</Badge>
        </div>
      </div>
      <div className="mt-8 space-y-4">
        {isLoading ? (
          [1, 2, 3].map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="h-4 w-3/4 bg-muted rounded mb-3" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">No posts yet</div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
