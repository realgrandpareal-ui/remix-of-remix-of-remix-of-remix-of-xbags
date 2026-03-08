import { useState, useRef } from "react";
import { ImagePlus, Lock, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { useWallet } from "@/hooks/use-wallet";
import { feedAPI, Post } from "@/lib/api/feed";
import { toast } from "sonner";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { profile } = useProfile();
  const { status } = useWallet();
  const [content, setContent] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPrice, setUnlockPrice] = useState("0.01");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxChars = 280;
  const remaining = maxChars - content.length;

  if (status !== "connected" || !profile) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...mediaFiles, ...files].slice(0, 4);
    setMediaFiles(newFiles);

    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setMediaPreviews(previews);
  };

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (!content.trim() || !profile) return;
    setPosting(true);

    try {
      // Upload media
      let mediaUrls: string[] = [];
      for (const file of mediaFiles) {
        const url = await feedAPI.uploadMedia(file, profile.id);
        mediaUrls.push(url);
      }

      const mediaType = mediaFiles.length > 0
        ? (mediaFiles[0].type.startsWith("video") ? "video" : "image")
        : "none";

      const post = await feedAPI.createPost(
        profile.id,
        content.trim(),
        mediaUrls,
        mediaType,
        isLocked,
        isLocked ? parseFloat(unlockPrice) || 0 : 0
      );

      onPostCreated(post);
      setContent("");
      setMediaFiles([]);
      setMediaPreviews([]);
      setIsLocked(false);
      setUnlockPrice("0.01");
      toast.success("Post created! 🎉");
    } catch (err: any) {
      console.error("Post error:", err);
      toast.error("Failed to create post", { description: err?.message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="border-b border-border p-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={profile.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {(profile.display_name || profile.username || "?")[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
            placeholder="What's on your mind?"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-sm min-h-[80px]"
            rows={3}
          />

          {/* Media previews */}
          {mediaPreviews.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {mediaPreviews.map((src, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeMedia(i)}
                    className="absolute top-1 right-1 h-5 w-5 bg-background/80 rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lock toggle */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Lock</span>
              <Switch checked={isLocked} onCheckedChange={setIsLocked} className="scale-75" />
            </div>

            {isLocked && (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={unlockPrice}
                  onChange={(e) => setUnlockPrice(e.target.value)}
                  className="w-16 bg-muted rounded px-2 py-1 text-xs text-foreground outline-none"
                  step="0.01"
                  min="0.01"
                />
                <span className="text-xs text-muted-foreground">SOL</span>
              </div>
            )}

            <div className="flex-1" />

            {/* Character count */}
            <span className={`text-xs ${remaining < 20 ? "text-destructive" : "text-muted-foreground"}`}>
              {remaining}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-primary h-8 px-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              onClick={handlePost}
              disabled={!content.trim() || posting}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-secondary font-semibold px-6"
            >
              {posting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
