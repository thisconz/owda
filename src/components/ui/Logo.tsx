import { motion } from 'motion/react'; // FIXED: was 'framer-motion'

export const Logo = ({ className = 'w-10 h-10' }: { className?: string }) => {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className={`${className} filter drop-shadow-[0_0_8px_rgba(86,160,153,0.4)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      whileHover="hover"
    >
      <defs>
        <linearGradient
          id="hexGradient"
          x1="15"
          y1="15"
          x2="85"
          y2="85"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#56a099" />
          <stop offset="1" stopColor="#313280" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Crystal Lattice */}
      <motion.path
        d="M50 15L85 35V65L50 85L15 65V35L50 15Z"
        stroke="url(#hexGradient)"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        animate={{
          strokeDasharray: ['10, 200', '150, 200', '10, 200'],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Inner Core Ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="22"
        stroke="#56a099"
        strokeWidth="0.5"
        strokeDasharray="2 6"
        className="opacity-20"
        animate={{ rotate: -360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '50px', originY: '50px' }}
      />

      {/* Bonding Vectors */}
      <motion.g className="opacity-30">
        <path
          d="M50 38L50 15M50 62L50 85M60 44L85 35M40 56L15 65M60 56L85 65M40 44L15 35"
          stroke="#56a099"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </motion.g>

      {/* Nucleus */}
      <motion.circle
        cx="50"
        cy="50"
        r="8"
        fill="url(#hexGradient)"
        filter="url(#glow)"
        animate={{
          scale: [1, 1.15, 1],
          fillOpacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Orbital Electrons */}
      {[
        { offset: 15, radius: 1.7, color: '#56a099', dur: 3 },
        { offset: 20, radius: 1.5, color: '#313280', dur: 5 },
        { offset: 25, radius: 1.3, color: '#56a099', dur: 7 },
      ].map((e, i) => (
        <motion.circle
          key={i}
          cx="50"
          cy={50 - e.offset}
          r={e.radius}
          fill={e.color}
          className="filter drop-shadow-[0_0_3px_#56a099]"
          animate={{ rotate: 360 }}
          transition={{
            duration: e.dur,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ originX: '50px', originY: '50px' }}
        />
      ))}

      {/* Scanline HUD polish */}
      <motion.rect
        x="15"
        y="15"
        width="70"
        height="2"
        fill="#56a099"
        fillOpacity="0.1"
        animate={{ y: [15, 85, 15] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      />
    </motion.svg>
  );
};