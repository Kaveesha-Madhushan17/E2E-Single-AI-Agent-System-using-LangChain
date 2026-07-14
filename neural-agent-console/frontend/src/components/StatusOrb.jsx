import { motion, AnimatePresence } from 'framer-motion'

// status: 'idle' | 'thinking' | 'tool:web_search' | 'tool:get_weather' | 'error'
const STATUS_META = {
  idle: { label: 'Standing by', color: '#5EEAD4' },
  thinking: { label: 'Reasoning', color: '#8B7CF6' },
  'tool:web_search': { label: 'Searching the web', color: '#F0B93B' },
  'tool:get_weather': { label: 'Reading weather data', color: '#5EEAD4' },
  error: { label: 'Something went wrong', color: '#F0736A' },
}

export default function StatusOrb({ status = 'idle' }) {
  const meta = STATUS_META[status] || STATUS_META.idle
  const active = status !== 'idle'

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* outer orbit rings */}
        <motion.div
          className="absolute inset-0 rounded-full border"
          style={{ borderColor: `${meta.color}33` }}
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 6 : 18, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-3 rounded-full border border-dashed"
          style={{ borderColor: `${meta.color}22` }}
          animate={{ rotate: -360 }}
          transition={{ duration: active ? 9 : 26, repeat: Infinity, ease: 'linear' }}
        />

        {/* orbiting particle */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: active ? 2.4 : 10, repeat: Infinity, ease: 'linear' }}
        >
          <div
            className="absolute top-0 left-1/2 w-2 h-2 rounded-full -translate-x-1/2"
            style={{ background: meta.color, boxShadow: `0 0 12px 2px ${meta.color}` }}
          />
        </motion.div>

        {/* core */}
        <motion.div
          className="relative w-20 h-20 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${meta.color}55, ${meta.color}11 60%, transparent 70%)`,
            boxShadow: `0 0 60px 10px ${meta.color}33`,
          }}
          animate={
            active
              ? { scale: [1, 1.08, 1] }
              : { scale: [1, 1.03, 1] }
          }
          transition={{ duration: active ? 1.1 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="w-10 h-10 rounded-full"
            style={{
              background: meta.color,
              filter: 'blur(1px)',
              boxShadow: `0 0 30px 6px ${meta.color}88`,
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-3 flex items-center gap-2 font-mono text-xs tracking-widest uppercase"
          style={{ color: meta.color }}
        >
          <span className="relative flex h-1.5 w-1.5">
            {active && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: meta.color }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: meta.color }}
            />
          </span>
          {meta.label}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
