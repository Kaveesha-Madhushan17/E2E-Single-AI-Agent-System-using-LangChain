import { useState } from 'react'
import { motion } from 'framer-motion'

const SUGGESTIONS = [
  'What\u2019s the weather in Colombo right now?',
  'Latest news on AI regulation today',
  'Who holds the current world record in the 100m?',
]

export default function InputBar({ onSend, disabled }) {
  const [value, setValue] = useState('')

  const submit = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="w-full">
      {value === '' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setValue(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-line text-muted hover:text-core hover:border-core/40 transition-colors font-body"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex items-end gap-2 bg-surface-2 border border-line rounded-2xl px-4 py-3 focus-within:border-core/50 transition-colors">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask the agent anything…"
          disabled={disabled}
          className="flex-1 bg-transparent resize-none outline-none text-sm text-ink placeholder:text-muted max-h-32 font-body"
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={submit}
          disabled={disabled || !value.trim()}
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-core to-pulse disabled:opacity-30 disabled:cursor-not-allowed shadow-glow"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12L20 4L13 20L11 13L4 12Z"
              stroke="#05070D"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="#05070D"
            />
          </svg>
        </motion.button>
      </div>
      <p className="text-center text-[11px] text-muted mt-2 font-mono tracking-wide">
        Powered by Gemini &middot; Tavily Search &middot; OpenWeather
      </p>
    </div>
  )
}
