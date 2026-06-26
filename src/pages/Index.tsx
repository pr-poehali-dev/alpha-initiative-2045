import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

type Stat = 'hunger' | 'happiness' | 'energy' | 'hygiene';

const STATS: { key: Stat; label: string; icon: string; color: string }[] = [
  { key: 'hunger', label: 'Сытость', icon: 'Drumstick', color: '#ff6b35' },
  { key: 'happiness', label: 'Радость', icon: 'Smile', color: '#ffd23f' },
  { key: 'energy', label: 'Энергия', icon: 'Zap', color: '#3bceac' },
  { key: 'hygiene', label: 'Чистота', icon: 'Droplets', color: '#4d96ff' },
];

const ACTIONS: { id: string; label: string; icon: string; bump: Partial<Record<Stat, number>>; emoji: string }[] = [
  { id: 'feed', label: 'Покормить', icon: 'Apple', emoji: '🍎', bump: { hunger: 30, energy: 5, happiness: 4 } },
  { id: 'play', label: 'Играть', icon: 'Gamepad2', emoji: '🎮', bump: { happiness: 28, energy: -12, hunger: -8 } },
  { id: 'wash', label: 'Помыть', icon: 'Droplets', emoji: '🛁', bump: { hygiene: 40, happiness: 6 } },
  { id: 'sleep', label: 'Спать', icon: 'Moon', emoji: '😴', bump: { energy: 45, hunger: -6 } },
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

const Index = () => {
  const [stats, setStats] = useState<Record<Stat, number>>({
    hunger: 72, happiness: 80, energy: 65, hygiene: 90,
  });
  const [name] = useState('ПИКСИ');
  const [age, setAge] = useState(0);
  const [floatEmoji, setFloatEmoji] = useState<string | null>(null);
  const [wobble, setWobble] = useState(false);
  const floatKey = useRef(0);

  useEffect(() => {
    const decay = setInterval(() => {
      setStats((s) => ({
        hunger: clamp(s.hunger - 2),
        happiness: clamp(s.happiness - 1.5),
        energy: clamp(s.energy - 1),
        hygiene: clamp(s.hygiene - 1.2),
      }));
    }, 3000);
    const grow = setInterval(() => setAge((a) => a + 1), 15000);
    return () => { clearInterval(decay); clearInterval(grow); };
  }, []);

  const avg = (stats.hunger + stats.happiness + stats.energy + stats.hygiene) / 4;
  const mood = avg > 70 ? '◕‿◕' : avg > 40 ? '·_·' : avg > 20 ? '╥﹏╥' : '✕_✕';
  const moodText = avg > 70 ? 'Счастлив!' : avg > 40 ? 'Нормально' : avg > 20 ? 'Грустит...' : 'Болеет!';

  const doAction = (a: typeof ACTIONS[number]) => {
    setStats((s) => {
      const next = { ...s };
      (Object.keys(a.bump) as Stat[]).forEach((k) => { next[k] = clamp(next[k] + (a.bump[k] || 0)); });
      return next;
    });
    floatKey.current += 1;
    setFloatEmoji(a.emoji);
    setWobble(true);
    setTimeout(() => setWobble(false), 600);
    setTimeout(() => setFloatEmoji(null), 1000);
  };

  return (
    <div className="dotgrid-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-body">
      <header className="text-center mb-8 select-none">
        <h1 className="font-pixel text-2xl sm:text-4xl text-white tracking-tight leading-relaxed"
          style={{ textShadow: '4px 4px 0 #d61f6e, 8px 8px 0 rgba(0,0,0,0.3)' }}>
          ТАМАГОЧИ
        </h1>
        <p className="font-pixel text-[10px] sm:text-xs text-[#ffd23f] mt-3 tracking-widest">RETRO PET • 199X</p>
      </header>

      {/* Корпус игрушки */}
      <div className="shell-plastic relative w-[340px] sm:w-[400px] rounded-[48px] p-6 sm:p-8 pb-10">
        {/* Декоративные винтики */}
        {['top-5 left-5', 'top-5 right-5', 'bottom-5 left-5', 'bottom-5 right-5'].map((p) => (
          <div key={p} className={`absolute ${p} w-3 h-3 rounded-full bg-black/30 shadow-inner`} />
        ))}

        {/* Экран */}
        <div className="lcd-screen animate-screen-flicker rounded-2xl px-4 pt-5 pb-4 relative overflow-hidden">
          {/* Шапка экрана */}
          <div className="flex items-center justify-between font-lcd text-[#0f380f] text-xl leading-none mb-2">
            <span>{name}</span>
            <span>AGE:{age}</span>
          </div>

          {/* Сцена с питомцем */}
          <div className="relative h-40 flex flex-col items-center justify-end pb-2">
            {floatEmoji && (
              <span key={floatKey.current} className="absolute top-2 text-3xl animate-pop-in">{floatEmoji}</span>
            )}
            <div className={`text-5xl ${wobble ? 'animate-pet-wobble' : 'animate-pet-bounce'}`}
              style={{ color: '#0f380f', fontFamily: '"VT323", monospace', textShadow: '2px 2px 0 rgba(15,56,15,0.2)' }}>
              {mood}
            </div>
            {/* "пол" пиксельный */}
            <div className="w-full h-2 mt-3 bg-[#0f380f]/25"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg,#0f380f33 0 6px,transparent 6px 12px)' }} />
            <div className="font-lcd text-2xl text-[#0f380f] mt-1 animate-blink">{moodText}</div>
          </div>

          {/* Статы внутри экрана */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {STATS.map((st) => (
              <div key={st.key} className="font-lcd text-lg text-[#0f380f] leading-none">
                <div className="flex items-center justify-between mb-0.5">
                  <span>{st.label}</span>
                  <span>{Math.round(stats[st.key])}</span>
                </div>
                <div className="h-2 bg-[#0f380f]/15 border border-[#0f380f]/40">
                  <div className="h-full bg-[#0f380f] transition-all duration-500"
                    style={{ width: `${stats[st.key]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="grid grid-cols-2 gap-3 mt-7">
          {ACTIONS.map((a) => (
            <button key={a.id} onClick={() => doAction(a)}
              className="retro-btn rounded-2xl py-3 px-2 bg-[#fff5d6] text-[#7a1f4d] font-pixel text-[10px] flex flex-col items-center gap-2 active:bg-[#ffe9b0]">
              <Icon name={a.icon} size={22} className="text-[#d61f6e]" />
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Онлайн с друзьями */}
      <div className="mt-8 w-[340px] sm:w-[400px] rounded-3xl bg-white/5 backdrop-blur border border-white/10 p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-[#3bceac] font-pixel text-[10px] mb-3">
          <span className="w-2 h-2 rounded-full bg-[#3bceac] animate-blink" />
          ИГРАТЬ С ДРУЗЬЯМИ ОНЛАЙН
        </div>
        <button className="retro-btn rounded-2xl w-full py-3 bg-[#ffd23f] text-[#7a1f4d] font-pixel text-[11px] flex items-center justify-center gap-2">
          <Icon name="Users" size={18} />
          СОЗДАТЬ КОМНАТУ
        </button>
        <p className="font-lcd text-xl text-white/50 mt-3">Позови друга и ухаживайте за питомцем вместе</p>
      </div>

      <footer className="mt-8 font-pixel text-[8px] text-white/30 tracking-widest">© 199X RETRO PET CO.</footer>
    </div>
  );
};

export default Index;
