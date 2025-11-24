"use client";

import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <div>
      <motion.h1
        className="text-4xl font-bold mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Dashboard Overview
      </motion.h1>

      <div className="grid grid-cols-3 gap-8">
        {["Users", "Payments Pending", "Active Plans"].map((title, i) => (
          <motion.div
            key={i}
            className="p-6 rounded-xl bg-black/30 backdrop-blur-xl border border-white/10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <p className="text-pink-300 text-3xl font-bold">Loading...</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
