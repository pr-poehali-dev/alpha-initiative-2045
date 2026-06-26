import { useState, useEffect, useCallback, useRef } from 'react';
import type { PetData, Action } from '@/game/types';
import { applyAction, getActionDuration, decayStats, getXpToLevel } from '@/game/stateMachine';
import GameField from '@/components/GameField';
import StatsPanel from '@/components/StatsPanel';
import ActionBar from '@/components/ActionBar';
import ConceptGallery from '@/components/ConceptGallery';

const CONCEPT_ARTS = [
  'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/da0e4bd0-3d2e-4aa3-bcab-045172ee60cc.jpg',
  'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/90c80a0e-d0a3-4cc4-8fbe-3af0cb8621f2.jpg',
  'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/745e3ea3-038e-46c9-88ef-5e6504f17949.jpg',
  'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/ec5774c5-af4d-4957-9cae-46b05f3e9664.jpg',
];

const INITIAL_PETS: PetData[] = [
  { id: 'dog1',     kind: 'dog',     name: 'РЕКС',   state: 'walking', stats: { hunger: 80, happiness: 85, energy: 70, hygiene: 90 }, x: 10, y: 55, dir: 1,  targetX: 30, targetY: 55, level: 1, xp: 0 },
  { id: 'cat1',     kind: 'cat',     name: 'МУРКА',  state: 'idle',    stats: { hunger: 75, happiness: 90, energy: 80, hygiene: 85 }, x: 40, y: 60, dir: -1, targetX: 60, targetY: 60, level: 1, xp: 0 },
  { id: 'rabbit1',  kind: 'rabbit',  name: 'ЗАЙ',    state: 'walking', stats: { hunger: 70, happiness: 78, energy: 65, hygiene: 80 }, x: 65, y: 58, dir: 1,  targetX: 80, targetY: 58, level: 1, xp: 0 },
  { id: 'hamster1', kind: 'hamster', name: 'ХОМА',   state: 'idle',    stats: { hunger: 85, happiness: 72, energy: 75, hygiene: 92 }, x: 80, y: 62, dir: -1, targetX: 50, targetY: 62, level: 1, xp: 0 },
];

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

function leveled(pet: PetData): PetData {
  const needed = getXpToLevel(pet.level);
  if (pet.xp >= needed) return { ...pet, level: pet.level + 1, xp: pet.xp - needed };
  return pet;
}

export default function Index() {
  const [pets, setPets] = useState<PetData[]>(INITIAL_PETS);
  const [selectedId, setSelectedId] = useState<string>('dog1');
  const [notification, setNotification] = useState<string | null>(null);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const lastTickRef = useRef<number>(Date.now());

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Движение / блуждание питомцев
  useEffect(() => {
    const roam = setInterval(() => {
      setPets(prev => prev.map(pet => {
        if (pet.state !== 'idle' && pet.state !== 'walking') return pet;
        const dx = Math.abs(pet.x - pet.targetX);
        const dy = Math.abs(pet.y - pet.targetY);
        const arrived = dx < 2 && dy < 2;
        if (arrived) {
          const newTarget = { targetX: rand(5, 88), targetY: rand(50, 72) };
          const newDir: 1 | -1 = newTarget.targetX > pet.x ? 1 : -1;
          const newState = Math.random() > 0.35 ? 'walking' as const : 'idle' as const;
          return { ...pet, ...newTarget, state: newState, dir: newDir };
        }
        const speed = 1.5;
        const newX = pet.x + Math.sign(pet.targetX - pet.x) * Math.min(speed, dx);
        const newY = pet.y + Math.sign(pet.targetY - pet.y) * Math.min(speed * 0.3, dy);
        const dir: 1 | -1 = pet.targetX > pet.x ? 1 : -1;
        return { ...pet, x: newX, y: newY, dir, state: 'walking' };
      }));
    }, 300);
    return () => clearInterval(roam);
  }, []);

  // Деградация статов
  useEffect(() => {
    const tick = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setPets(prev => prev.map(p => leveled(decayStats(p, delta))));
    }, 2000);
    return () => clearInterval(tick);
  }, []);

  const handleAction = useCallback((action: Action) => {
    const pet = pets.find(p => p.id === selectedId);
    if (!pet) return;
    if (timersRef.current[selectedId]) clearTimeout(timersRef.current[selectedId]);

    const actionLabels: Record<Action, string> = {
      sleep: `${pet.name} ложится спать... 😴`,
      play:  `${pet.name} бежит играть! 🎮`,
      feed:  `${pet.name} мчится к миске! 🍖`,
      wash:  `${pet.name} идёт мыться! 🛁`,
    };
    notify(actionLabels[action]);

    const destinations: Record<Action, { x: number; y: number }> = {
      sleep: { x: 45, y: 60 },
      play:  { x: 70, y: 55 },
      feed:  { x: 20, y: 65 },
      wash:  { x: 55, y: 55 },
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
          setPets(prev => prev.map(p => p.id !== selectedId ? p : { ...p, state: 'idle' }));
        }, 2000);
      } else {
        notify(afterLabels[action]);
        setPets(prev => prev.map(p => p.id !== selectedId ? p : { ...p, state: 'idle' }));
      }
    }, duration);
  }, [pets, selectedId]);

  const selectedPet = pets.find(p => p.id === selectedId) ?? pets[0];

  const kindEmoji: Record<string, string> = { dog: '🐕', cat: '🐈', rabbit: '🐇', hamster: '🐹' };

  return (
    <div className="dotgrid-bg min-h-screen flex flex-col font-body px-4 sm:px-10 py-8 gap-6">

      {/* Шапка */}
      <header className="w-full flex flex-wrap items-center justify-between gap-4 select-none">
        <div>
          <h1 className="font-pixel text-xl sm:text-3xl text-white leading-tight"
            style={{ textShadow: '3px 3px 0 #d61f6e, 6px 6px 0 rgba(0,0,0,0.3)' }}>
            ТАМАГОЧИ
          </h1>
          <p className="font-pixel text-[9px] text-[#ffd23f] tracking-widest mt-1">RETRO PET WORLD • 199X</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {pets.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className="retro-btn rounded-xl px-3 py-2 font-pixel text-[9px] flex flex-col items-center gap-1 transition-all"
              style={{
                background: p.id === selectedId ? '#d61f6e' : '#ffffff18',
                color: 'white',
                outline: p.id === selectedId ? '2px solid #ffd23f' : 'none',
              }}
            >
              <span className="text-xl">{kindEmoji[p.kind]}</span>
              {p.name}
            </button>
          ))}
        </div>
      </header>

      {/* Уведомление */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#ffd23f] text-[#1a1033] font-pixel text-[11px] px-5 py-3 rounded-2xl shadow-xl animate-fade-in">
          {notification}
        </div>
      )}

      {/* Основной контент */}
      <div className="w-full flex flex-col lg:flex-row gap-5">
        <div className="flex-1 flex flex-col gap-4">
          <GameField
            pets={pets}
            selectedId={selectedId}
            onSelect={setSelectedId}
            conceptArts={CONCEPT_ARTS}
          />
          <ActionBar
            onAction={handleAction}
            disabled={pets.length === 0}
            activePetState={selectedPet?.state ?? 'idle'}
          />
        </div>
        {selectedPet && <StatsPanel pet={selectedPet} />}
      </div>

      {/* Концепт-арты */}
      <ConceptGallery images={CONCEPT_ARTS} />

      {/* ТЗ и монетизация */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
          <h2 className="font-pixel text-sm text-[#ffd23f] mb-4">ТЕХНИЧЕСКОЕ ЗАДАНИЕ</h2>
          <div className="space-y-4 font-lcd text-xl text-white/80">
            <div>
              <div className="text-white font-bold mb-1">Животные и анимации</div>
              <ul className="space-y-1 text-white/70 text-lg">
                <li>🐕 Собака — idle / ходьба / сон / бег за мячом / еда / душ+фен</li>
                <li>🐈 Кошка — idle / крадётся / спит клубком / охотится / ест рыбу</li>
                <li>🐇 Кролик — idle / прыжки / сон / тянется за морковкой</li>
                <li>🐹 Хомяк — idle / бег / сон / колесо / семечки</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-1">Ключевые кадры (на животное)</div>
              <ul className="space-y-0.5 text-white/70 text-lg">
                <li>• idle_1, idle_2 (дыхание / мигание)</li>
                <li>• walk_1, walk_2 (переступание лап)</li>
                <li>• action_start, action_loop, action_end</li>
                <li>• sleep_loop (грудь поднимается)</li>
              </ul>
            </div>
            <div>
              <div className="text-white font-bold mb-1">State Machine</div>
              <div className="text-white/60 font-pixel text-[9px] bg-black/20 rounded-xl p-3 leading-loose">
                idle ↔ walking{'\n'}
                any → sleeping → idle{'\n'}
                any → playing → idle{'\n'}
                any → eating → idle{'\n'}
                any → bathing → drying → idle
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h2 className="font-pixel text-sm text-[#3bceac] mb-3">СПИСОК АССЕТОВ</h2>
            <div className="font-lcd text-lg text-white/70 space-y-1">
              <div className="text-white/90">Спрайт-листы (PNG 512×512, 8 кадров):</div>
              <div>• dog_idle / walk / sleep / play / eat / bath / dry</div>
              <div>• [аналогично: cat, rabbit, hamster]</div>
              <div className="text-white/90 mt-2">Пропсы:</div>
              <div>• bowl.png, ball.png, mouse_toy.png, carrot.png</div>
              <div>• shower_head.png, hair_dryer.png, wheel.png</div>
              <div className="text-white/90 mt-2">Фоны:</div>
              <div>• bg_room.png, bg_kitchen.png, bg_bathroom.png</div>
              <div className="text-white/90 mt-2">Звуки (MP3/OGG):</div>
              <div>• munch.mp3, splash.mp3, snore.mp3, play_jingle.mp3</div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
            <h2 className="font-pixel text-sm text-[#ff6b35] mb-3">5 ИДЕЙ МОНЕТИЗАЦИИ</h2>
            <div className="font-lcd text-xl text-white/80 space-y-2">
              <div>🎨 <b>Скины и аксессуары</b> — шляпы, ошейники, фоны за монеты</div>
              <div>🐾 <b>Новые питомцы</b> — капибара, аксолотль — за уровень или покупку</div>
              <div>⚡ <b>Ускорители</b> — «суперсон», «быстрая еда» — мгновенный буст статов</div>
              <div>🏆 <b>Сезонные ивенты</b> — праздничные предметы, ограниченные питомцы</div>
              <div>💎 <b>Premium-подписка</b> — офлайн-бонусы, больше слотов, эксклюзивные анимации</div>
            </div>
          </div>
        </div>
      </div>

      <footer className="w-full text-center font-pixel text-[8px] text-white/20 tracking-widest pb-4">
        © 199X RETRO PET CO. • STATE MACHINE v1.0
      </footer>
    </div>
  );
}
