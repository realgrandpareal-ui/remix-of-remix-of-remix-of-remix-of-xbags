import { motion } from "framer-motion";
import { Settings, User, Bell, Shield, Palette, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const sections = [
  {
    title: "Account",
    icon: User,
    items: [
      { label: "Edit Profile", description: "Update your display name, bio, and avatar" },
      { label: "Connected Accounts", description: "Manage linked social accounts" },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Push Notifications", description: "Receive notifications on your device", toggle: true },
      { label: "Email Notifications", description: "Get updates via email", toggle: true },
    ],
  },
  {
    title: "Privacy & Security",
    icon: Shield,
    items: [
      { label: "Private Profile", description: "Only approved followers can see your posts", toggle: true },
      { label: "Two-Factor Authentication", description: "Add extra security to your account" },
    ],
  },
  {
    title: "Appearance",
    icon: Palette,
    items: [
      { label: "Dark Mode", description: "Currently using dark theme", toggle: true, defaultChecked: true },
    ],
  },
];

const SettingsPage = () => {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="space-y-6">
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <section.icon className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm text-foreground">{section.title}</h2>
            </div>
            <div className="rounded-xl bg-card border border-border overflow-hidden divide-y divide-border">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                  {item.toggle && <Switch defaultChecked={item.defaultChecked} />}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
