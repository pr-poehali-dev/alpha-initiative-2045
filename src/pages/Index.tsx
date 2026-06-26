import { useState, useEffect, useCallback, useRef } from 'react';
import type { PetData, Action, Season } from '@/game/types';
import { applyAction, getActionDuration, decayStats, getXpToLevel } from '@/game/stateMachine';
import StatsPanel from '@/components/StatsPanel';
import ActionBar from '@/components/ActionBar';
import PetSprite from '@/components/PetSprite';
import Shop from '@/components/Shop';
import SeasonOverlay from '@/components/SeasonOverlay';
import Icon from '@/components/ui/icon';

const INITIAL_PETS: PetData[] = [
  { id: 'dog1',     kind: 'dog',     name: 'РЕКС',  state: 'walking', stats: { hunger: 80, happiness: 85, energy: 70, hygiene: 90 }, x: 10, y: 55, dir: 1,  targetX: 30, targetY: 55, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'cat1',     kind: 'cat',     name: 'МУРКА', state: 'idle',    stats: { hunger: 75, happiness: 90, energy: 80, hygiene: 85 }, x: 40, y: 60, dir: -1, targetX: 60, targetY: 60, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'rabbit1',  kind: 'rabbit',  name: 'ЗАЙ',   state: 'walking', stats: { hunger: 70, happiness: 78, energy: 65, hygiene: 80 }, x: 65, y: 58, dir: 1,  targetX: 80, targetY: 58, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'hamster1', kind: 'hamster', name: 'ХОМА',  state: 'idle',    stats: { hunger: 85, happiness: 72, energy: 75, hygiene: 92 }, x: 80, y: 62, dir: -1, targetX: 50, targetY: 62, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
];

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_LABELS: Record<Season, string> = { spring: '🌸 Весна', summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима' };
const SEASON_BG: Record<Season, string> = {
  spring: 'linear-gradient(180deg,#1a2a14 0%,#0e1a0a 100%)',
  summer: 'linear-gradient(180deg,#1a2a0a 0%,#0a1a00 100%)',
  autumn: 'linear-gradient(180deg,#2a1a0a 0%,#1a0a00 100%)',
  winter: 'linear-gradient(180deg,#0a1a2a 0%,#060e18 100%)',
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number) => Math.max(0, Math.min(100, v));

function leveled(pet: PetData): PetData {
  const needed = getXpToLevel(pet.level);
  if (pet.xp >= needed) return { ...pet, level: pet.level + 1, xp: pet.xp - needed };
  return pet;
}

export default function Index() {
  const [pets, setPets] = useState<PetData[]>(INITIAL_PETS);
  const [selectedId, setSelectedId] = useState<string>('dog1');
  const [notification, setNotification] = useState<string | null>(null);
  const [season, setSeason] = useState<Season>('summer');
  const [shopOpen, setShopOpen] = useState(false);
  const [rickrollVisible, setRickrollVisible] = useState(false);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTickRef = useRef<number>(Date.now());

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  };

  // Смена сезонов каждые 40 секунд
  useEffect(() => {
    const t = setInterval(() => {
      setSeason(s => {
        const idx = SEASONS.indexOf(s);
        const next = SEASONS[(idx + 1) % SEASONS.length];
        notify(`Сезон сменился: ${SEASON_LABELS[next]}`);
        return next;
      });
    }, 40000);
    return () => clearInterval(t);
  }, []);

  // Движение питомцев
  useEffect(() => {
    const roam = setInterval(() => {
      setPets(prev => prev.map(pet => {
        if (pet.state === 'dead') return pet;
        if (pet.state !== 'idle' && pet.state !== 'walking' && pet.state !== 'dying') return pet;
        if (pet.state === 'dying') return pet;
        const dx = Math.abs(pet.x - pet.targetX);
        const dy = Math.abs(pet.y - pet.targetY);
        const arrived = dx < 2 && dy < 2;
        if (arrived) {
          const newTarget = { targetX: rand(5, 88), targetY: rand(50, 72) };
          const newDir: 1 | -1 = newTarget.targetX > pet.x ? 1 : -1;
          const newState = Math.random() > 0.35 ? 'walking' as const : 'idle' as const;
          return { ...pet, ...newTarget, state: newState, dir: newDir };
        }
        const speed = pet.state === 'frozen' ? 0 : 1.5;
        const newX = pet.x + Math.sign(pet.targetX - pet.x) * Math.min(speed, dx);
        const newY = pet.y + Math.sign(pet.targetY - pet.y) * Math.min(speed * 0.3, dy);
        const dir: 1 | -1 = pet.targetX > pet.x ? 1 : -1;
        return { ...pet, x: newX, y: newY, dir, state: 'walking' };
      }));
    }, 300);
    return () => clearInterval(roam);
  }, []);

  // Деградация статов + здоровье + холод
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setPets(prev => prev.map(p => {
        if (p.state === 'dead') return p;
        const updated = leveled(decayStats(p, delta, season));
        if (updated.state === 'dead' && p.state !== 'dead') {
          notify(`💀 ${p.name} умер... Воскреси в магазине!`);
        }
        if (updated.state === 'frozen' && p.state !== 'frozen') {
          notify(`🥶 ${p.name} замёрз! Помой горячей водой или уложи спать!`);
        }
        return updated;
      }));
    }, 2000);
    return () => clearInterval(tick);
  }, [season]);

  const handlePetSelect = (id: string) => {
    setSelectedId(id);
    setRickrollVisible(true);
    setTimeout(() => setRickrollVisible(false), 7000);
  };

  const handleAction = useCallback((action: Action) => {
    const pet = pets.find(p => p.id === selectedId);
    if (!pet || pet.state === 'dead') return;

    if (timersRef.current[selectedId]) clearTimeout(timersRef.current[selectedId]);

    // Зимой — горячая вода/сон снимают холод
    const actionLabels: Record<Action, string> = {
      sleep: `${pet.name} ложится спать... 😴`,
      play:  `${pet.name} бежит играть! 🎮`,
      feed:  `${pet.name} мчится к миске! 🍖`,
      wash:  `${pet.name} идёт мыться! 🛁`,
    };
    notify(actionLabels[action]);

    const destinations: Record<Action, { x: number; y: number }> = {
      sleep: { x: 45, y: 60 }, play: { x: 70, y: 55 }, feed: { x: 20, y: 65 }, wash: { x: 55, y: 55 },
    };
    const dest = destinations[action];

    setPets(prev => prev.map(p => p.id !== selectedId ? p : {
      ...applyAction(p, action),
      targetX: dest.x, targetY: dest.y,
      x: dest.x, y: dest.y,
    }));

    const duration = getActionDuration(action);
    timersRef.current[selectedId] = setTimeout(() => {
      const afterLabels: Record<Action, string> = {
        sleep: `${pet.name} выспался! ⭐`,
        play:  `${pet.name} наигрался! 🌟`,
        feed:  `${pet.name} наелся! ✨`,
        wash:  `${pet.name} чистый! 💫`,
      };
      if (action === 'wash') {
        setPets(prev => prev.map(p => p.id !== selectedId ? p : { ...p, state: 'drying' }));
        setTimeout(() => {
          notify(afterLabels[action]);
          setPets(prev => prev.map(p => p.id !== selectedId ? p : { ...p, state: 'idle', cold: clamp(p.cold - 50) }));
        }, 2000);
      } else {
        notify(afterLabels[action]);
        setPets(prev => prev.map(p => p.id !== selectedId ? p : { ...p, state: 'idle' }));
      }
    }, duration);
  }, [pets, selectedId]);

  const handleRevive = (id: string) => {
    const totalCoins = pets.reduce((s, p) => s + p.coins, 0);
    if (totalCoins < 30) { notify('Недостаточно монет! 🪙'); return; }
    // Вычесть монеты из первого живого питомца
    let coinsTaken = 30;
    setPets(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, state: 'idle', health: 60, cold: 0, stats: { hunger: 50, happiness: 50, energy: 50, hygiene: 50 } };
      }
      if (coinsTaken > 0 && p.coins > 0) {
        const take = Math.min(p.coins, coinsTaken);
        coinsTaken -= take;
        return { ...p, coins: p.coins - take };
      }
      return p;
    }));
    notify('🎉 Питомец воскрешён!');
    setShopOpen(false);
  };

  const livePets = pets.filter(p => p.state !== 'dead');
  const deadPets = pets.filter(p => p.state === 'dead');
  const selectedPet = pets.find(p => p.id === selectedId) ?? livePets[0];
  const totalCoins = pets.reduce((s, p) => s + p.coins, 0);
  const kindEmoji: Record<string, string> = { dog: '🐕', cat: '🐈', rabbit: '🐇', hamster: '🐹' };

  return (
    <div className="min-h-screen flex flex-col font-body px-4 sm:px-8 py-6 gap-5"
      style={{ background: SEASON_BG[season], transition: 'background 3s ease' }}>

      {/* Rickroll popup */}
      {rickrollVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setRickrollVisible(false)}>
          <div className="relative w-[560px] max-w-[95vw] aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-[#ffd23f]"
            onClick={e => e.stopPropagation()}>
            <iframe
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
              allow="autoplay"
              className="w-full h-full"
            />
            <button onClick={() => setRickrollVisible(false)}
              className="absolute top-3 right-3 bg-black/60 rounded-full p-2 text-white hover:bg-black">
              <Icon name="X" size={18} />
            </button>
          </div>
        </div>
      )}

      <Shop open={shopOpen} onClose={() => setShopOpen(false)} deadPets={deadPets} totalCoins={totalCoins} onRevive={handleRevive} />

      {/* Уведомление */}
      {notification && (
        <div className="fixed top-5 left-1/2 z-50 bg-[#ffd23f] text-[#1a1033] font-pixel text-[11px] px-5 py-3 rounded-2xl shadow-xl"
          style={{ transform: 'translateX(-50%)', animation: 'fade-in 0.3s ease' }}>
          {notification}
        </div>
      )}

      {/* Шапка */}
      <header className="flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          {/* Кнопка магазина */}
          <button onClick={() => setShopOpen(true)}
            className="retro-btn rounded-2xl px-4 py-3 flex flex-col items-center gap-1 relative"
            style={{ background: '#6c63ff', color: 'white', boxShadow: '0 5px 0 #4a42cc' }}>
            <Icon name="ShoppingBag" size={20} />
            <span className="font-pixel text-[9px]">МАГАЗИН</span>
            {deadPets.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full font-pixel text-[9px] flex items-center justify-center text-white">
                {deadPets.length}
              </span>
            )}
          </button>
          <div>
            <h1 className="font-pixel text-lg sm:text-2xl text-white leading-tight"
              style={{ textShadow: '3px 3px 0 #d61f6e' }}>ТАМАГОЧИ</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-lcd text-lg text-[#ffd23f]">🪙 {totalCoins}</span>
              <span className="font-pixel text-[9px] text-white/40">{SEASON_LABELS[season]}</span>
            </div>
          </div>
        </div>

        {/* Табы питомцев */}
        <div className="flex gap-2 flex-wrap">
          {pets.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className="retro-btn rounded-xl px-3 py-2 font-pixel text-[9px] flex flex-col items-center gap-1"
              style={{
                background: p.state === 'dead' ? '#333' : p.id === selectedId ? '#d61f6e' : '#ffffff18',
                color: p.state === 'dead' ? '#666' : 'white',
                outline: p.id === selectedId ? '2px solid #ffd23f' : 'none',
                filter: p.state === 'dead' ? 'grayscale(1)' : 'none',
              }}>
              <span className="text-xl">{kindEmoji[p.kind]}</span>
              {p.name}
              {p.state === 'dead' && <span className="text-[9px]">💀</span>}
            </button>
          ))}
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Игровое поле */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="relative rounded-3xl overflow-hidden border-2 border-white/15"
            style={{ minHeight: 420, background: 'rgba(0,0,0,0.3)' }}>

            {/* Фон */}
            <img src="https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/da0e4bd0-3d2e-4aa3-bcab-045172ee60cc.jpg"
              alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />

            <SeasonOverlay season={season} />

            {/* Пол */}
            <div className="absolute bottom-0 left-0 right-0 h-20"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />

            {/* Питомцы */}
            {pets.map(pet => (
              <PetSprite
                key={pet.id}
                pet={pet}
                selected={pet.id === selectedId}
                onSelect={() => handlePetSelect(pet.id)}
              />
            ))}

            <div className="absolute top-4 left-1/2 -translate-x-1/2 font-lcd text-base text-white/40 pointer-events-none z-10">
              Нажми на питомца — сюрприз! 🎵
            </div>
          </div>

          <ActionBar
            onAction={handleAction}
            disabled={!selectedPet || selectedPet.state === 'dead'}
            activePetState={selectedPet?.state ?? 'idle'}
          />
        </div>

        {/* Панель статов */}
        {selectedPet && <StatsPanel pet={selectedPet} />}
      </div>

      {/* Зимнее предупреждение */}
      {season === 'winter' && (
        <div className="w-full rounded-2xl bg-[#0a1a3a] border border-[#7ef]/30 px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">❄️</span>
          <div className="font-lcd text-xl text-[#7ef]">
            <b>Зима!</b> Следи за полосой холода над питомцами.
            Чтобы согреть — помой горячей водой (🛁) или уложи спать (😴).
            Если холод достигнет 100 — питомец замёрзнет!
          </div>
        </div>
      )}

      <footer className="text-center font-pixel text-[8px] text-white/20 tracking-widest pb-2">
        © 199X RETRO PET CO. • STATE MACHINE v2.0
      </footer>
    </div>
  );
}
