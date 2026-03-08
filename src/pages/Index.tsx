import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, Users, TrendingUp, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import WalletConnect from "@/components/wallet/WalletConnect";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const features = [
  { icon: Zap, title: "Create & Earn", description: "Share content and earn crypto rewards from your community." },
  { icon: Shield, title: "Own Your Data", description: "Blockchain-backed ownership of all your creative work." },
  { icon: Users, title: "Build Community", description: "Grow your audience with built-in referral & social tools." },
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
              <Rocket className="h-4 w-4" />
              Web3 Social Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Welcome to{" "}
              <span className="text-gradient">{APP_NAME}</span>
            </h1>

            <p className="text-xl sm:text-2xl font-semibold text-primary mb-4">
              {APP_TAGLINE}
            </p>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              The next-gen social platform for creators. Share content, build your community,
              and earn crypto rewards — all powered by Solana.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <WalletConnect variant="default" />
              <Link to="/explore">
                <Button variant="outline" size="lg" className="gap-2 border-border hover:border-primary hover:bg-muted">
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
            { value: "50K+", label: "Users" },
            { value: "2.5M", label: "Posts" },
            { value: "$1.2M", label: "Earned" },
            { value: "180K", label: "Community" },
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
