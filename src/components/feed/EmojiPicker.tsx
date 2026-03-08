import { useState } from "react";
import { Smile } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const emojiCategories = [
  {
    name: "Smileys",
    emojis: ["😀", "😂", "🥹", "😍", "🤩", "😎", "🥳", "😤", "🫡", "🤔", "😴", "🥺", "😭", "💀", "🤡", "👻"],
  },
  {
    name: "Gestures",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "✌️", "🤞", "💪", "🫶", "❤️", "🔥", "⭐", "✨", "💎", "🚀", "🎉"],
  },
  {
    name: "Objects",
    emojis: ["💰", "💸", "🪙", "📈", "📉", "🎯", "💡", "📸", "🎵", "🎮", "⚡", "🌙", "☀️", "🌈", "🍕", "☕"],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary h-8 px-2">
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2 bg-card border-border" align="start" side="top">
        {/* Category tabs */}
        <div className="flex gap-1 mb-2 border-b border-border pb-2">
          {emojiCategories.map((cat, i) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(i)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                activeCategory === i
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="grid grid-cols-8 gap-0.5">
          {emojiCategories[activeCategory].emojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSelect(emoji)}
              className="h-8 w-8 flex items-center justify-center text-lg hover:bg-muted rounded transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
