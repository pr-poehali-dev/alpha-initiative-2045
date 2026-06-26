import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
  ts: number;
}

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  'накорми кошку',
  'добавь дерево',
  'поиграй с Рексом',
  'уложи Зайку спать',
  'помой Хому',
  'брось мяч',
  'посади цветок',
  'как их состояние?',
];

export default function Chat({ messages, onSend, loading }: Props) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const t = input.trim();
    if (!t || loading) return;
    onSend(t);
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full bg-[#0e0e1a] border-r border-white/10">
      {/* Заголовок */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#3bceac] animate-pulse" />
        <span className="font-pixel text-[11px] text-[#3bceac]">ЧАТ С ПИТОМЦАМИ</span>
        <span className="ml-auto font-lcd text-base text-white/30">LLM mode</span>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
              msg.role === 'user'
                ? 'bg-[#d61f6e] text-white rounded-br-sm font-body'
                : msg.role === 'system'
                ? 'bg-[#ffd23f]/10 text-[#ffd23f] rounded-bl-sm font-lcd text-base border border-[#ffd23f]/20'
                : 'bg-white/10 text-white/90 rounded-bl-sm font-lcd text-base'
            }`}>
              {msg.role === 'bot' && <span className="text-[#3bceac] font-pixel text-[9px] block mb-0.5">LLM</span>}
              {msg.role === 'system' && <span className="text-[#ffd23f] font-pixel text-[9px] block mb-0.5">СИСТЕМА</span>}
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-white/50"
                  style={{ animation: `blink 1s ${i * 0.25}s infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Быстрые команды */}
      <div className="px-3 py-2 border-t border-white/8 flex gap-1.5 flex-wrap">
        {SUGGESTIONS.slice(0, 4).map(s => (
          <button key={s} onClick={() => onSend(s)} disabled={loading}
            className="font-lcd text-base px-2.5 py-1 rounded-full bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-colors text-xs disabled:opacity-40">
            {s}
          </button>
        ))}
      </div>

      {/* Поле ввода */}
      <div className="px-3 pb-3 pt-1">
        <div className="flex gap-2 items-end bg-white/8 rounded-2xl px-3 py-2 focus-within:bg-white/12 transition-colors border border-white/10 focus-within:border-[#d61f6e]/50">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Напиши команду..."
            rows={1}
            className="flex-1 bg-transparent text-white font-body text-sm resize-none outline-none placeholder-white/30 max-h-24"
            style={{ lineHeight: 1.5 }}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{ background: input.trim() && !loading ? '#d61f6e' : '#ffffff15' }}>
            <Icon name="Send" size={15} className="text-white" />
          </button>
        </div>
        <div className="font-pixel text-[8px] text-white/20 mt-1.5 text-center">Enter — отправить</div>
      </div>
    </div>
  );
}
