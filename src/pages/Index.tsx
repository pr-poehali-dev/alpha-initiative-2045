import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

type Stat = 'hunger' | 'happiness' | 'energy' | 'hygiene';

type Pet = { id: string; name: string; emoji: string; img?: string };

const PETS: Pet[] = [
  { id: 'capybara', name: 'КАПИ', emoji: '🦫', img: 'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/bucket/a3eed8c8-a293-4143-ae56-aa3f6a5d3d5a.PNG' },
  { id: 'cat', name: 'МУРКА', emoji: '🐱' },
  { id: 'dog', name: 'РЕКС', emoji: '🐶' },
  { id: 'fox', name: 'ФОКСИ', emoji: '🦊' },
  { id: 'panda', name: 'ПАНДА', emoji: '🐼' },
  { id: 'frog', name: 'КВАК', emoji: '🐸' },
  { id: 'penguin', name: 'ПИНГ', emoji: '🐧' },
  { id: 'rabbit', name: 'ЗАЙ', emoji: '🐰' },
  { id: 'dragon', name: 'ДРАКО', emoji: '🐲' },
  { id: 'chick', name: 'ЦЫПА', emoji: '🐤' },
];

const STATS: { key: Stat; label: string }[] = [
  { key: 'hunger', label: 'Сытость' },
  { key: 'happiness', label: 'Радость' },
  { key: 'energy', label: 'Энергия' },
  { key: 'hygiene', label: 'Чистота' },
];

const ACTIONS: { id: string; label: string; icon: string; bump: Partial<Record<Stat, number>>; emoji: string }[] = [
  { id: 'feed', label: 'Покормить', icon: 'Apple', emoji: '🍎', bump: { hunger: 30, energy: 5, happiness: 4 } },
  { id: 'play', label: 'Играть', icon: 'Gamepad2', emoji: '🎮', bump: { happiness: 28, energy: -12, hunger: -8 } },
  { id: 'wash', label: 'Помыть', icon: 'Droplets', emoji: '🛁', bump: { hygiene: 40, happiness: 6 } },
  { id: 'sleep', label: 'Спать', icon: 'Moon', emoji: '😴', bump: { energy: 45, hunger: -6 } },
];

const clamp = (v: number) => Math.max(0, Math.min(100, v));

const Index = () => {
  const [pet, setPet] = useState<Pet | null>(null);
  const [stats, setStats] = useState<Record<Stat, number>>({
    hunger: 72, happiness: 80, energy: 65, hygiene: 90,
  });
  const [age, setAge] = useState(0);
  const [floatEmoji, setFloatEmoji] = useState<string | null>(null);
  const [wobble, setWobble] = useState(false);
  const floatKey = useRef(0);

  useEffect(() => {
    if (!pet) return;
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
  }, [pet]);

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

  const choosePet = (p: Pet) => {
    setPet(p);
    setStats({ hunger: 80, happiness: 90, energy: 80, hygiene: 95 });
    setAge(0);
  };

  // ===== ЭКРАН ВЫБОРА ПИТОМЦА =====
  if (!pet) {
    return (
      <div className="dotgrid-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-body">
        <header className="text-center mb-8 select-none">
          <h1 className="font-pixel text-xl sm:text-3xl text-white tracking-tight leading-relaxed"
            style={{ textShadow: '4px 4px 0 #d61f6e, 8px 8px 0 rgba(0,0,0,0.3)' }}>
            ВЫБЕРИ ПИТОМЦА
          </h1>
          <p className="font-pixel text-[10px] sm:text-xs text-[#ffd23f] mt-3 tracking-widest">10 ДРУЗЕЙ ЖДУТ ТЕБЯ</p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 max-w-[680px]">
          {PETS.map((p) => (
            <button key={p.id} onClick={() => choosePet(p)}
              className="retro-btn group rounded-3xl p-3 bg-[#fff5d6] hover:bg-white flex flex-col items-center gap-2 w-[150px] sm:w-auto">
              <div className="lcd-screen rounded-xl w-full aspect-square flex items-center justify-center overflow-hidden">
                {p.img ? (
                  <img src={p.img} alt={p.name} className="w-full h-full object-cover pixelated mix-blend-multiply opacity-90" />
                ) : (
                  <span className="text-4xl sm:text-5xl group-hover:animate-pet-wobble">{p.emoji}</span>
                )}
              </div>
              <span className="font-pixel text-[10px] text-[#7a1f4d] mt-1">{p.name}</span>
            </button>
          ))}
        </div>

        <p className="font-lcd text-xl text-white/50 mt-8">Нажми на питомца, чтобы начать игру</p>
        <footer className="mt-6 font-pixel text-[8px] text-white/30 tracking-widest">© 199X RETRO PET CO.</footer>
      </div>
    );
  }

  // ===== ЭКРАН ИГРЫ =====
  return (
    <div className="dotgrid-bg min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-body">
      <header className="text-center mb-6 select-none">
        <h1 className="font-pixel text-2xl sm:text-4xl text-white tracking-tight leading-relaxed"
          style={{ textShadow: '4px 4px 0 #d61f6e, 8px 8px 0 rgba(0,0,0,0.3)' }}>
          ТАМАГОЧИ
        </h1>
        <button onClick={() => setPet(null)}
          className="font-pixel text-[9px] text-[#ffd23f] mt-3 tracking-widest hover:text-white inline-flex items-center gap-1">
          <Icon name="ChevronLeft" size={12} /> СМЕНИТЬ ПИТОМЦА
        </button>
      </header>

      {/* Корпус игрушки */}
      <div className="shell-plastic relative w-[340px] sm:w-[400px] rounded-[48px] p-6 sm:p-8 pb-10">
        {['top-5 left-5', 'top-5 right-5', 'bottom-5 left-5', 'bottom-5 right-5'].map((p) => (
          <div key={p} className={`absolute ${p} w-3 h-3 rounded-full bg-black/30 shadow-inner`} />
        ))}

        {/* Экран */}
        <div className="lcd-screen animate-screen-flicker rounded-2xl px-4 pt-5 pb-4 relative overflow-hidden">
          <div className="flex items-center justify-between font-lcd text-[#0f380f] text-xl leading-none mb-2">
            <span>{pet.name}</span>
            <span>AGE:{age}</span>
          </div>

          {/* Сцена с питомцем */}
          <div className="relative h-44 flex flex-col items-center justify-end pb-2">
            {floatEmoji && (
              <span key={floatKey.current} className="absolute top-0 text-3xl animate-pop-in">{floatEmoji}</span>
            )}
            <div className={`flex flex-col items-center ${wobble ? 'animate-pet-wobble' : 'animate-pet-bounce'}`}>
              {pet.img ? (
                <img src={pet.img} alt={pet.name}
                  className="w-28 h-24 object-cover pixelated mix-blend-multiply opacity-90 rounded-md" />
              ) : (
                <span className="text-6xl">{pet.emoji}</span>
              )}
              <div className="text-2xl mt-1"
                style={{ color: '#0f380f', fontFamily: '"VT323", monospace' }}>{mood}</div>
            </div>
            <div className="w-full h-2 mt-2 bg-[#0f380f]/25"
              style={{ backgroundImage: 'repeating-linear-gradient(90deg,#0f380f33 0 6px,transparent 6px 12px)' }} />
            <div className="font-lcd text-2xl text-[#0f380f] mt-1 animate-blink">{moodText}</div>
          </div>

          {/* Статы */}
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
