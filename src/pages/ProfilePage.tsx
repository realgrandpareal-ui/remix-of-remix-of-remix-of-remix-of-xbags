import { motion } from "framer-motion";
import { MapPin, Link as LinkIcon, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams } from "react-router-dom";

const ProfilePage = () => {
  const { username } = useParams();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      {/* Banner */}
      <div className="h-32 sm:h-48 rounded-xl bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 mb-[-40px] relative" />

      {/* Avatar & Info */}
      <div className="relative z-10 px-4">
        <div className="h-20 w-20 rounded-full bg-card border-4 border-background flex items-center justify-center text-2xl font-bold text-gradient">
          CS
        </div>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Creator Space</h1>
            <p className="text-sm text-muted-foreground">@{username || "creator"}</p>
            <p className="text-sm text-foreground mt-2 max-w-md">
              Digital artist & Web3 builder. Creating the future of decentralized content. 🎨
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Global</span>
              <span className="flex items-center gap-1"><LinkIcon className="h-3 w-3" /> creatorspace.xyz</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined Jan 2024</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 border-border self-start">
            <Edit className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mt-6">
          {[
            { value: "1,234", label: "Posts" },
            { value: "45.2K", label: "Followers" },
            { value: "892", label: "Following" },
          ].map((s) => (
            <div key={s.label}>
              <span className="font-bold text-foreground">{s.value}</span>{" "}
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-primary/10 text-primary border-primary/20">OG Creator</Badge>
          <Badge className="bg-secondary/10 text-secondary border-secondary/20">Top 100</Badge>
          <Badge className="bg-warning/10 text-warning border-warning/20">Verified</Badge>
        </div>
      </div>

      {/* Posts placeholder */}
      <div className="mt-8 space-y-4">
        {[1, 2, 3].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-5 rounded-xl bg-card border border-border shadow-card"
          >
            <div className="h-4 w-3/4 bg-muted rounded mb-3" />
            <div className="h-3 w-1/2 bg-muted rounded" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ProfilePage;
