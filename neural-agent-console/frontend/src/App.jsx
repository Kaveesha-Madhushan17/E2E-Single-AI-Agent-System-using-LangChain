import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StatusOrb from './components/StatusOrb.jsx'
import ChatMessage from './components/ChatMessage.jsx'
import InputBar from './components/InputBar.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('idle') // idle | thinking | error
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setLoading(true)
    setStatus('thinking')

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error(`Server responded ${res.status}`)
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
          toolsUsed: data.tools_used || [],
          elapsed: data.elapsed_seconds,
        },
      ])
      setStatus('idle')
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Couldn't reach the agent backend. Make sure \`agent_server.py\` is running on ${API_URL}.\n\n_Details: ${err.message}_`,
          toolsUsed: [],
        },
      ])
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-screen w-screen flex flex-col bg-void grid-overlay text-ink font-body overflow-hidden">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-line/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-core to-pulse flex items-center justify-center shadow-glow">
            <div className="w-3 h-3 rounded-full bg-void" />
          </div>
          <div>
            <h1 className="font-display font-semibold text-base tracking-tight">
              Neural <span className="text-gradient">Console</span>
            </h1>
            <p className="text-[11px] text-muted font-mono -mt-0.5">agent runtime // v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-muted">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-core opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-core" />
          </span>
          ONLINE
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex overflow-hidden">
        {/* Side status panel */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col items-center justify-center border-r border-line/60 px-4">
          <StatusOrb status={loading ? 'thinking' : status === 'error' ? 'error' : 'idle'} />
          <div className="mt-8 w-full space-y-2">
            <PanelRow label="Model" value="Gemini Flash" />
            <PanelRow label="Tools" value="2 connected" />
            <PanelRow label="Session" value={`${messages.length} msgs`} />
          </div>
        </aside>

        {/* Chat column */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
            {isEmpty ? (
              <EmptyState onPick={sendMessage} />
            ) : (
              <div className="flex flex-col gap-5 max-w-3xl mx-auto">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <ChatMessage
                      key={i}
                      role={m.role}
                      content={m.content}
                      toolsUsed={m.toolsUsed}
                      elapsed={m.elapsed}
                    />
                  ))}
                </AnimatePresence>

                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted font-mono text-xs pl-1"
                  >
                    <TypingDots />
                    agent is thinking…
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 pb-6 pt-2">
            <div className="max-w-3xl mx-auto">
              <InputBar onSend={sendMessage} disabled={loading} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function PanelRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-2/60 border border-line/60">
      <span className="text-[11px] text-muted font-mono uppercase tracking-wide">{label}</span>
      <span className="text-[11px] text-ink font-mono">{value}</span>
    </div>
  )
}

function TypingDots() {
  return (
    <span className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-core"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

function EmptyState({ onPick }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <StatusOrb status="idle" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-xl font-semibold mt-6"
      >
        What do you want to know?
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="text-muted text-sm mt-2"
      >
        This agent can search the live web and pull real-time weather data
        before answering.
      </motion.p>
    </div>
  )
}
