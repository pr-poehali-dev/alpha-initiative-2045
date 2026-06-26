import { useState, useEffect, useCallback, useRef } from 'react';
import type { PetData, Action, Season } from '@/game/types';
import { applyAction, getActionDuration, decayStats, getXpToLevel } from '@/game/stateMachine';
import StatsPanel from '@/components/StatsPanel';
import ActionBar from '@/components/ActionBar';
import PetSprite from '@/components/PetSprite';
import Shop from '@/components/Shop';
import SeasonOverlay from '@/components/SeasonOverlay';
import Icon from '@/components/ui/icon';

/* ────────── константы ────────── */
const PET_RADIUS = 38; // px условных единиц в % — будем считать в %
const FIELD_W = 100;   // % ширины поля
const GROUND_TOP = 20; // % от верха — нижняя граница неба
const GROUND_BOT = 82; // % от верха — нижняя граница поля

const INITIAL_PETS: PetData[] = [
  { id: 'dog1',     kind: 'dog',     name: 'РЕКС',  state: 'walking', stats: { hunger: 80, happiness: 85, energy: 70, hygiene: 90 }, x: 15, y: 65, dir: 1,  targetX: 35, targetY: 65, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'cat1',     kind: 'cat',     name: 'МУРКА', state: 'idle',    stats: { hunger: 75, happiness: 90, energy: 80, hygiene: 85 }, x: 40, y: 68, dir: -1, targetX: 60, targetY: 68, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'rabbit1',  kind: 'rabbit',  name: 'ЗАЙ',   state: 'walking', stats: { hunger: 70, happiness: 78, energy: 65, hygiene: 80 }, x: 65, y: 66, dir: 1,  targetX: 80, targetY: 66, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'hamster1', kind: 'hamster', name: 'ХОМА',  state: 'idle',    stats: { hunger: 85, happiness: 72, energy: 75, hygiene: 92 }, x: 82, y: 70, dir: -1, targetX: 55, targetY: 70, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
];

/* ── птицы ── */
const BIRDS_COUNT = 6;
function makeBird(id: number) {
  return { id, x: Math.random() * 80 + 5, y: Math.random() * 14 + 2, speed: 0.3 + Math.random() * 0.4, dir: Math.random() > 0.5 ? 1 : -1 as 1 | -1, frame: 0 };
}
type Bird = ReturnType<typeof makeBird>;

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_LABELS: Record<Season, string> = { spring: '🌸 Весна', summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима' };
const SEASON_SKY: Record<Season, string> = {
  spring: 'linear-gradient(180deg,#7ec8e3 0%,#b5e8a0 100%)',
  summer: 'linear-gradient(180deg,#36b0e8 0%,#90d8f0 100%)',
  autumn: 'linear-gradient(180deg,#c87030 0%,#e0a040 100%)',
  winter: 'linear-gradient(180deg,#8098b8 0%,#c0d8f0 100%)',
};
const SEASON_GROUND: Record<Season, string> = {
  spring: 'linear-gradient(180deg,#5a9a30 0%,#3a6a18 100%)',
  summer: 'linear-gradient(180deg,#3a8a20 0%,#2a6010 100%)',
  autumn: 'linear-gradient(180deg,#8a6030 0%,#6a4010 100%)',
  winter: 'linear-gradient(180deg,#d0e8f8 0%,#a8c8e0 100%)',
};

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const clamp = (v: number) => Math.max(0, Math.min(100, v));

/* Проверка коллизии двух питомцев (в % пространстве) */
function collides(a: PetData, b: PetData): boolean {
  const dx = a.x - b.x;
  const dy = (a.y - b.y) * 2.5; // по Y разница меньше выражена
  return Math.sqrt(dx * dx + dy * dy) < 9;
}

/* Отталкивание: корректируем targetX/Y чтобы не сталкивались */
function resolveCollisions(pets: PetData[]): PetData[] {
  const result = pets.map(p => ({ ...p }));
  for (let i = 0; i < result.length; i++) {
    for (let j = i + 1; j < result.length; j++) {
      const a = result[i];
      const b = result[j];
      if (a.state === 'dead' || b.state === 'dead') continue;
      if (collides(a, b)) {
        const dx = a.x - b.x || 0.1;
        const dy = (a.y - b.y) * 2.5 || 0.1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const push = (9 - len) / 2 + 0.5;
        const nx = (dx / len) * push;
        const ny = (dy / len) * push * 0.4;
        result[i] = { ...a, x: clamp(a.x + nx), y: Math.max(GROUND_TOP, Math.min(GROUND_BOT, a.y + ny)) };
        result[j] = { ...b, x: clamp(b.x - nx), y: Math.max(GROUND_TOP, Math.min(GROUND_BOT, b.y - ny)) };
      }
    }
  }
  return result;
}

function leveled(pet: PetData): PetData {
  const needed = getXpToLevel(pet.level);
  if (pet.xp >= needed) {
    // Бонус +5 к статам при повышении уровня
    return {
      ...pet,
      level: pet.level + 1,
      xp: pet.xp - needed,
      health: clamp(pet.health + 5),
      stats: {
        hunger:    clamp(pet.stats.hunger    + 5),
        happiness: clamp(pet.stats.happiness + 5),
        energy:    clamp(pet.stats.energy    + 5),
        hygiene:   clamp(pet.stats.hygiene   + 5),
      },
    };
  }
  return pet;
}

export default function Index() {
  const [pets, setPets] = useState<PetData[]>(INITIAL_PETS);
  const [selectedId, setSelectedId] = useState<string>('dog1');
  const [notification, setNotification] = useState<string | null>(null);
  const [season, setSeason] = useState<Season>('summer');
  const [shopOpen, setShopOpen] = useState(false);
  const [birds, setBirds] = useState<Bird[]>(() => Array.from({ length: BIRDS_COUNT }, (_, i) => makeBird(i)));
  const [birdFrame, setBirdFrame] = useState(0);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTickRef = useRef<number>(Date.now());
  const notifyQueue = useRef<string | null>(null);

  const notify = useCallback((msg: string) => {
    notifyQueue.current = msg;
    setNotification(msg);
    setTimeout(() => setNotification(null), 2800);
  }, []);

  /* Смена сезонов */
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
  }, [notify]);

  /* Птицы */
  useEffect(() => {
    const t = setInterval(() => {
      setBirdFrame(f => f + 1);
      setBirds(prev => prev.map(b => {
        let nx = b.x + b.speed * b.dir;
        let nd = b.dir;
        if (nx > 96) { nx = 96; nd = -1; }
        if (nx < 2)  { nx = 2;  nd = 1; }
        return { ...b, x: nx, dir: nd as 1 | -1 };
      }));
    }, 100);
    return () => clearInterval(t);
  }, []);

  /* Движение + коллизии */
  useEffect(() => {
    const roam = setInterval(() => {
      setPets(prev => {
        const moved = prev.map(pet => {
          if (pet.state === 'dead' || pet.state === 'dying') return pet;
          if (pet.state !== 'idle' && pet.state !== 'walking') return pet;
          const dx = Math.abs(pet.x - pet.targetX);
          const dy = Math.abs(pet.y - pet.targetY);
          const arrived = dx < 2 && dy < 2;
          if (arrived) {
            const tX = rand(5, 90);
            const tY = rand(GROUND_TOP + 5, GROUND_BOT - 5);
            const newDir: 1 | -1 = tX > pet.x ? 1 : -1;
            const newState = Math.random() > 0.35 ? 'walking' as const : 'idle' as const;
            return { ...pet, targetX: tX, targetY: tY, state: newState, dir: newDir };
          }
          const speed = pet.state === 'frozen' ? 0 : 1.4;
          const newX = pet.x + Math.sign(pet.targetX - pet.x) * Math.min(speed, dx);
          const newY = pet.y + Math.sign(pet.targetY - pet.y) * Math.min(speed * 0.25, dy);
          const dir: 1 | -1 = pet.targetX > pet.x ? 1 : -1;
          return { ...pet, x: newX, y: newY, dir, state: 'walking' };
        });
        return resolveCollisions(moved);
      });
    }, 280);
    return () => clearInterval(roam);
  }, []);

  /* Деградация статов */
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setPets(prev => prev.map(p => {
        if (p.state === 'dead') return p;
        const prev_level = p.level;
        const updated = leveled(decayStats(p, delta, season));
        if (updated.state === 'dead' && p.state !== 'dead') notify(`💀 ${p.name} умер... Воскреси в магазине!`);
        if (updated.state === 'frozen' && p.state !== 'frozen') notify(`🥶 ${p.name} замёрз! Помой или уложи спать!`);
        if (updated.level > prev_level) notify(`🎉 ${p.name} достиг уровня ${updated.level}! +5 ко всем статам!`);
        return updated;
      }));
    }, 2000);
    return () => clearInterval(tick);
  }, [season, notify]);

  const handleAction = useCallback((action: Action) => {
    const pet = pets.find(p => p.id === selectedId);
    if (!pet || pet.state === 'dead') return;
    if (timersRef.current[selectedId]) clearTimeout(timersRef.current[selectedId]);

    const actionLabels: Record<Action, string> = {
      sleep: `${pet.name} ложится спать... 😴`,
      play:  `${pet.name} бежит играть! 🎮`,
      feed:  `${pet.name} мчится к миске! 🍖`,
      wash:  `${pet.name} идёт мыться! 🛁`,
    };
    notify(actionLabels[action]);

    const destinations: Record<Action, { x: number; y: number }> = {
      sleep: { x: 45, y: 65 }, play: { x: 70, y: 60 }, feed: { x: 20, y: 68 }, wash: { x: 55, y: 62 },
    };
    const dest = destinations[action];

    setPets(prev => prev.map(p => p.id !== selectedId ? p : {
      ...applyAction(p, action),
      targetX: dest.x, targetY: dest.y, x: dest.x, y: dest.y,
    }));

    const duration = getActionDuration(action);
    timersRef.current[selectedId] = setTimeout(() => {
      const afterLabels: Record<Action, string> = {
        sleep: `${pet.name} выспался! ⭐`, play: `${pet.name} наигрался! 🌟`,
        feed:  `${pet.name} наелся! ✨`,   wash: `${pet.name} чистый! 💫`,
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
  }, [pets, selectedId, notify]);

  const handleRevive = (id: string) => {
    const totalCoins = pets.reduce((s, p) => s + p.coins, 0);
    if (totalCoins < 30) { notify('Недостаточно монет! 🪙'); return; }
    let coinsTaken = 30;
    setPets(prev => prev.map(p => {
      if (p.id === id) return { ...p, state: 'idle', health: 60, cold: 0, stats: { hunger: 50, happiness: 50, energy: 50, hygiene: 50 } };
      if (coinsTaken > 0 && p.coins > 0) { const take = Math.min(p.coins, coinsTaken); coinsTaken -= take; return { ...p, coins: p.coins - take }; }
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
    <div className="min-h-screen flex flex-col font-body px-4 sm:px-8 py-5 gap-4">

      <Shop open={shopOpen} onClose={() => setShopOpen(false)} deadPets={deadPets} totalCoins={totalCoins} onRevive={handleRevive} />

      {/* Уведомление */}
      {notification && (
        <div className="fixed top-5 left-1/2 z-50 bg-[#ffd23f] text-[#1a1033] font-pixel text-[11px] px-5 py-3 rounded-2xl shadow-xl pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}>
          {notification}
        </div>
      )}

      {/* Шапка */}
      <header className="flex flex-wrap items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-3">
          <button onClick={() => setShopOpen(true)}
            className="retro-btn rounded-2xl px-4 py-3 flex flex-col items-center gap-1 relative"
            style={{ background: '#6c63ff', color: 'white', boxShadow: '0 5px 0 #4a42cc' }}>
            <Icon name="ShoppingBag" size={20} />
            <span className="font-pixel text-[9px]">МАГАЗИН</span>
            {deadPets.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full font-pixel text-[9px] flex items-center justify-center text-white">{deadPets.length}</span>
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
        <div className="flex gap-2 flex-wrap">
          {pets.map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)}
              className="retro-btn rounded-xl px-3 py-2 font-pixel text-[9px] flex flex-col items-center gap-0.5"
              style={{
                background: p.state === 'dead' ? '#333' : p.id === selectedId ? '#d61f6e' : '#ffffff18',
                color: p.state === 'dead' ? '#666' : 'white',
                outline: p.id === selectedId ? '2px solid #ffd23f' : 'none',
              }}>
              <span className="text-xl">{kindEmoji[p.kind]}</span>
              {p.name}
              {p.state === 'dead' && <span>💀</span>}
            </button>
          ))}
        </div>
      </header>

      {/* Основной контент */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 flex flex-col gap-3">

          {/* ═══ ИГРОВОЕ ПОЛЕ ═══ */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-white/15" style={{ minHeight: 480 }}>

            {/* НЕБО — верхние ~22% */}
            <div className="absolute left-0 right-0 top-0" style={{ height: '22%', background: SEASON_SKY[season], transition: 'background 3s ease', zIndex: 0 }}>
              {/* Солнце / луна */}
              {season !== 'winter' && (
                <div className="absolute top-3 right-8 text-4xl select-none" style={{ filter: 'drop-shadow(0 0 8px #fff8)' }}>
                  {season === 'summer' ? '☀️' : season === 'spring' ? '🌤️' : '🌥️'}
                </div>
              )}
              {season === 'winter' && <div className="absolute top-3 right-8 text-3xl select-none">🌙</div>}
              {/* Облака */}
              <div className="absolute top-2 left-[15%] text-3xl select-none opacity-80">☁️</div>
              <div className="absolute top-4 left-[50%] text-2xl select-none opacity-60">☁️</div>

              {/* ПТИЦЫ */}
              {birds.map(b => (
                <div key={b.id} className="absolute select-none pointer-events-none"
                  style={{ left: `${b.x}%`, top: `${b.y * 4.5}%`, fontSize: 18, transform: b.dir === -1 ? 'scaleX(-1)' : 'none', transition: 'left 0.1s linear' }}>
                  {birdFrame % 4 < 2 ? '🐦' : '🕊️'}
                </div>
              ))}
            </div>

            {/* ЗЕМЛЯ — нижние ~78% */}
            <div className="absolute left-0 right-0 bottom-0" style={{ top: '22%', background: SEASON_GROUND[season], transition: 'background 3s ease', zIndex: 0 }}>
              {/* Трава / снег */}
              <div className="absolute top-0 left-0 right-0 h-4 opacity-60"
                style={{ backgroundImage: season === 'winter' ? 'repeating-linear-gradient(90deg,#e8f4ff 0 14px,#c8e4f8 14px 28px)' : 'repeating-linear-gradient(90deg,#4a9a28 0 14px,#3a7a1a 14px 28px)' }} />
              {/* Кусты/деревья */}
              <div className="absolute bottom-8 left-[8%]  text-4xl select-none">{season === 'winter' ? '🌲' : '🌳'}</div>
              <div className="absolute bottom-8 right-[8%] text-4xl select-none">{season === 'winter' ? '🌲' : '🌳'}</div>
              <div className="absolute bottom-6 left-[30%] text-2xl select-none opacity-70">{season === 'autumn' ? '🍂' : '🌿'}</div>
              <div className="absolute bottom-6 right-[25%] text-2xl select-none opacity-70">{season === 'spring' ? '🌸' : '🌱'}</div>
            </div>

            {/* Разделитель неба и земли */}
            <div className="absolute left-0 right-0" style={{ top: '22%', height: 3, background: 'rgba(0,0,0,0.15)', zIndex: 1 }} />

            <SeasonOverlay season={season} />

            {/* Питомцы */}
            {pets.map(pet => (
              <PetSprite
                key={pet.id}
                pet={pet}
                selected={pet.id === selectedId}
                onSelect={() => setSelectedId(pet.id)}
              />
            ))}

            <div className="absolute top-[23%] left-1/2 -translate-x-1/2 font-lcd text-sm text-white/30 pointer-events-none" style={{ zIndex: 5 }}>
              Нажми на питомца 🎵
            </div>
          </div>

          <ActionBar
            onAction={handleAction}
            disabled={!selectedPet || selectedPet.state === 'dead'}
            activePetState={selectedPet?.state ?? 'idle'}
          />
        </div>

        {selectedPet && <StatsPanel pet={selectedPet} />}
      </div>

      {/* Зимнее предупреждение */}
      {season === 'winter' && (
        <div className="w-full rounded-2xl bg-[#0a1a3a] border border-[#7ef]/30 px-5 py-3 flex items-center gap-3">
          <span className="text-2xl">❄️</span>
          <div className="font-lcd text-xl text-[#7ef]">
            <b>Зима!</b> Следи за полосой холода. Чтобы согреть — помой (🛁) или уложи спать (😴).
          </div>
        </div>
      )}

      <footer className="text-center font-pixel text-[8px] text-white/20 tracking-widest pb-1">© 199X RETRO PET CO.</footer>
    </div>
  );
}
