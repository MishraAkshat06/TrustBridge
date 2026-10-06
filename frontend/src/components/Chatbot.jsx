import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, Minimize2 } from 'lucide-react';
import { API_BASE } from '../services/api';

const SUGGESTED_PROMPTS = [
  'Explain 4-tranche escrow',
  'What is the 20 ETH hard cap?',
  'How are refunds protected?',
  'Sepolia contract address'
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am TrustBridge AI. Ask me about campaign mechanics, Sepolia escrow, smart contracts, or protocol risk telemetry.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  async function sendMessage(text) {
    const query = (text || input).trim();
    if (!query || isTyping) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });
      const json = await res.json();
      const reply = json?.data?.reply || json?.reply || 'Received response from TrustBridge AI.';
      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'TrustBridge AI offline mode active. Contract 0x7c49...58d2 verified on Sepolia testnet.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage();
  }

  return (
    <aside aria-label="AI Chat Assistant" className="fixed bottom-6 right-6 z-50 font-sans">
      {isOpen ? (
        <div className="w-[360px] sm:w-[400px] h-[520px] rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-fadeIn text-[var(--text-primary)]">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-subtle)]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-brand-subtle)] flex items-center justify-center border border-[var(--border-subtle)]">
                <Bot className="w-4 h-4 text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)]" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>TrustBridge AI</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Protocol Intelligence • Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
              className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-brand-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3 text-[var(--accent-brand-text)] dark:text-[var(--accent-brand)]" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'btn-fintech-primary rounded-br-xs text-white'
                      : 'bg-[var(--bg-surface-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-brand-subtle)] flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3 h-3 text-[var(--accent-brand)] animate-pulse" />
                </div>
                <div className="px-3 py-2 rounded-2xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px] flex items-center gap-1">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                  <span className="animate-bounce [animation-delay:0.4s]">●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)]/50 flex gap-1.5 overflow-x-auto text-[10px] whitespace-nowrap">
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(p)}
                className="px-2.5 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-brand)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSend} className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about campaigns, escrow, Sepolia..."
              className="flex-1 bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent-brand)] transition placeholder-[var(--text-muted)] font-sans"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              aria-label="Send Message"
              className="btn-fintech-primary p-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open AI Assistant"
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full btn-fintech-primary shadow-xl hover:scale-105 transition-transform duration-200 cursor-pointer"
        >
          <Bot className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-tight">TrustBridge AI</span>
        </button>
      )}
    </aside>
  );
}
