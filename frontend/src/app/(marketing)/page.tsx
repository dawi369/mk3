'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Zap, BarChart3, ArrowRight } from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          <motion.div variants={fadeInUp}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="text-foreground">Futures Trading</span>
              <br />
              <span className="text-muted-foreground">Simplified</span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
            variants={fadeInUp}
          >
            Real-time market data and intelligent insights for informed trading decisions
          </motion.p>
          
          {/* <motion.div variants={fadeInUp}>
            <button className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
              Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div> */}
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 border-t border-border">
        <motion.div 
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          {[
            { label: 'Real-time Data', value: '24/7' },
            { label: 'Markets Tracked', value: '100+' },
            { label: 'Response Time', value: '<100ms' }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              className="text-center space-y-2"
              variants={fadeInUp}
            >
              <div className="text-4xl font-bold text-foreground">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 px-6">
        <motion.div 
          className="max-w-6xl mx-auto space-y-16"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div className="text-center space-y-4" variants={fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground">
              Everything you need
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Powerful tools for modern traders
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={stagger}
          >
            {[
              {
                icon: TrendingUp,
                title: 'Market Insights',
                description: 'Track market trends with real-time data and advanced analytics'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Sub-10ms response times for critical trading decisions'
              },
              {
                icon: BarChart3,
                title: 'Data Visualization',
                description: 'Beautiful charts and intuitive dashboards for better clarity'
              }
            ].map((feature) => (
              <motion.div
                key={feature.title}
                className="group p-8 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all cursor-pointer"
                variants={fadeInUp}
                whileHover={{ y: -4 }}
              >
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-card-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 border-t border-border">
        <motion.div 
          className="max-w-4xl mx-auto text-center space-y-8"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-foreground"
            variants={fadeInUp}
          >
            Ready to start trading?
          </motion.h2>
          <motion.p 
            className="text-xl text-muted-foreground"
            variants={fadeInUp}
          >
            Join traders who rely on real-time data and intelligent insights
          </motion.p>
          <motion.div variants={fadeInUp}>
            <button className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all">
              Get Started Today
            </button>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
