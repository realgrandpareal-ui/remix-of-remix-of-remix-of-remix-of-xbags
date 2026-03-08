import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Zap, Shield, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import WalletConnect from "@/components/wallet/WalletConnect";

const features = [
  { icon: Zap, title: "Create & Earn", description: "Share your content and earn rewards from your community." },
  { icon: Shield, title: "Own Your Data", description: "Blockchain-backed ownership of all your creative work." },
  { icon: Users, title: "Build Community", description: "Grow your audience with built-in referral tools." },
  { icon: TrendingUp, title: "Track Growth", description: "Real-time analytics to optimize your content strategy." },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const Index = () => {
  return (
    <div className="relative">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative container mx-auto px-4 pt-20 pb-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Web3 Creator Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Your Space to{" "}
              <span className="text-gradient">Create</span>,{" "}
              <span className="text-gradient">Connect</span> &{" "}
              <span className="text-gradient">Earn</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join the next generation of creators. Share content, build your community,
              and earn rewards — all powered by blockchain technology.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WalletConnect />
              <Link to="/explore">
                <Button variant="outline" size="lg" className="gap-2 border-border hover:bg-muted">
                  Explore Creators <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={item}
              className="p-6 rounded-xl bg-card border border-border shadow-card hover:border-primary/30 transition-colors group"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          {[
            { value: "12K+", label: "Creators" },
            { value: "1.2M", label: "Posts" },
            { value: "$340K", label: "Earned" },
            { value: "98K", label: "Community" },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <div className="text-3xl font-extrabold text-gradient mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
