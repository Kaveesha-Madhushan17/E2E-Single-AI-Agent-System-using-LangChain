import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

const TOOL_LABELS = {
  web_search: 'Web Search',
  tavily_search: 'Web Search',
  get_weather: 'Weather Lookup',
}

export default function ChatMessage({ role, content, toolsUsed = [], elapsed }) {
  const isUser = role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {!isUser && toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toolsUsed.map((t, i) => (
              <span
                key={i}
                className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-core/30 text-core bg-core/5"
              >
                {TOOL_LABELS[t] || t}
              </span>
            ))}
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl leading-relaxed text-sm ${
            isUser
              ? 'bg-gradient-to-br from-pulse/90 to-pulse/60 text-white rounded-br-sm shadow-glow-violet'
              : 'bg-surface-2 border border-line text-ink rounded-bl-sm'
          }`}
        >
          <div className="prose-invert prose-sm max-w-none [&_p]:m-0 [&_p+p]:mt-2 [&_a]:text-core [&_code]:text-core [&_code]:bg-black/30 [&_code]:px-1 [&_code]:rounded">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>

        {!isUser && typeof elapsed === 'number' && (
          <span className="font-mono text-[10px] text-muted px-1">
            {elapsed.toFixed(1)}s
          </span>
        )}
      </div>
    </motion.div>
  )
}
