import { motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Award, Bell } from "lucide-react";

const notifications = [
  { id: 1, icon: Heart, color: "text-destructive bg-destructive/10", title: "Luna Waves liked your post", time: "2m ago" },
  { id: 2, icon: UserPlus, color: "text-primary bg-primary/10", title: "Block Builder started following you", time: "15m ago" },
  { id: 3, icon: MessageCircle, color: "text-secondary bg-secondary/10", title: "Melody Chain commented on your post", time: "1h ago" },
  { id: 4, icon: Award, color: "text-warning bg-warning/10", title: "You earned the 'Rising Star' badge!", time: "3h ago" },
  { id: 5, icon: Heart, color: "text-destructive bg-destructive/10", title: "12 people liked your latest post", time: "5h ago" },
  { id: 6, icon: UserPlus, color: "text-primary bg-primary/10", title: "Data Sage started following you", time: "8h ago" },
];

const NotificationsPage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {notifications.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer"
          >
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${n.color}`}>
              <n.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
