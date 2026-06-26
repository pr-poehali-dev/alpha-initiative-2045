import { useEffect, useRef, useState } from 'react';
import type { PetData } from '@/game/types';
import type { LLMResponse } from '@/game/mockLLM';

/* ── Типы объектов на поле ── */
export interface FieldObject {
  id: string;
  type: 'tree' | 'ball' | 'flower' | 'bone' | 'fish' | 'carrot';
  x: number;   // % поля
  spawnedAt: number;
  scale: number; // 0→1 при появлении
}

interface Props {
  pets: PetData[];
  objects: FieldObject[];
  lastAction: LLMResponse | null;
  focusedPet: string | null;
  onPetClick: (id: string) => void;
}

const OBJECT_EMOJI: Record<string, string> = {
  tree: '🌳', ball: '🎾', flower: '🌸', bone: '🦴', fish: '🐟', carrot: '🥕',
};

/* Карта эмоций → выражение лица */
const EMOTION_FACE: Record<string, string> = {
  happy:   '◕‿◕',
  sad:     '╥﹏╥',
  sleepy:  '-..-',
  hungry:  '⊙﹏⊙',
  dirty:   '×﹏×',
  normal:  '·‿·',
  frozen:  '◔﹏◔',
  dying:   '✕_✕',
  dead:    '×_×',
};

const MOOD_FROM_STATE: Record<string, string> = {
  idle: 'normal', walking: 'normal', sleeping: 'sleepy',
  playing: 'happy', eating: 'happy', bathing: 'normal', drying: 'normal',
  dying: 'dying', dead: 'dead', frozen: 'frozen',
};

function moodFromStats(p: PetData): string {
  const avg = (p.stats.hunger + p.stats.happiness + p.stats.energy + p.stats.hygiene) / 4;
  if (p.state !== 'idle' && p.state !== 'walking') return MOOD_FROM_STATE[p.state] ?? 'normal';
  if (avg > 70) return 'happy';
  if (p.stats.hunger < 25) return 'hungry';
  if (p.stats.hygiene < 25) return 'dirty';
  if (p.stats.energy < 25) return 'sleepy';
  if (avg < 35) return 'sad';
  return 'normal';
}

/* SVG-лица питомцев — упрощённые цветные кружки с эмоциями */
function PetFace({ pet, focused, onClick }: { pet: PetData; focused: boolean; onClick: () => void }) {
  const mood = moodFromStats(pet);
  const face = EMOTION_FACE[mood] ?? '·‿·';
  const isDead = pet.state === 'dead';
  const isFrozen = pet.state === 'frozen';
  const isActive = pet.state !== 'idle' && pet.state !== 'walking' && pet.state !== 'dead';

  const COLORS: Record<string, { body: string; outline: string }> = {
    dog:     { body: '#d49020', outline: '#b87010' },
    cat:     { body: '#e8b070', outline: '#d4905a' },
    rabbit:  { body: '#f0e0d0', outline: '#dcc8b8' },
    hamster: { body: '#f0b870', outline: '#e0a060' },
  };
  const col = COLORS[pet.kind] ?? COLORS.dog;

  const stateLabel: Record<string, string> = {
    idle: 'Отдыхает', walking: 'Гуляет', sleeping: 'Спит 😴',
    playing: 'Играет 🎮', eating: 'Ест 🍖', bathing: 'Моется 🛁', drying: 'Сохнет 💨',
    dying: '💔 Умирает', dead: '💀 Умер', frozen: '🥶 Замёрз',
  };

  return (
    <div
      onClick={onClick}
      className="absolute cursor-pointer select-none flex flex-col items-center"
      style={{
        left: `${pet.x}%`,
        bottom: '12%',
        transform: `translateX(-50%) scaleX(${pet.dir === -1 ? -1 : 1})`,
        transition: 'left 0.9s linear',
        zIndex: focused ? 20 : 10,
        opacity: isDead ? 0.3 : 1,
        filter: isFrozen ? 'hue-rotate(160deg) brightness(1.2)' : isDead ? 'grayscale(1)' : 'none',
      }}
    >
      {/* Пузырь */}
      {isActive && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white rounded-xl px-2 py-0.5 text-xs shadow font-lcd text-lg whitespace-nowrap pointer-events-none"
          style={{ transform: `translateX(-50%) scaleX(${pet.dir === -1 ? -1 : 1})` }}>
          {stateLabel[pet.state]}
        </div>
      )}

      {/* Тело-кружок */}
      <svg width="72" height="76" viewBox="0 0 72 76" style={{ overflow: 'visible' }}>
        {/* Тело */}
        <ellipse cx="36" cy="52" rx="22" ry="16" fill={col.body} opacity="0.9" />
        {/* Голова */}
        <circle cx="36" cy="28" r="22" fill={col.body} stroke={focused ? '#ffd23f' : col.outline} strokeWidth={focused ? 3 : 1.5} />
        {/* Ушки */}
        {pet.kind === 'rabbit' && <>
          <ellipse cx="24" cy="8" rx="5" ry="13" fill={col.body} stroke={col.outline} strokeWidth="1.5" />
          <ellipse cx="48" cy="8" rx="5" ry="13" fill={col.body} stroke={col.outline} strokeWidth="1.5" />
          <ellipse cx="24" cy="8" rx="2.5" ry="9" fill="#f9a0c0" />
          <ellipse cx="48" cy="8" rx="2.5" ry="9" fill="#f9a0c0" />
        </>}
        {pet.kind === 'cat' && <>
          <polygon points="18,14 14,2 26,12" fill={col.body} stroke={col.outline} strokeWidth="1.2" />
          <polygon points="54,14 58,2 46,12" fill={col.body} stroke={col.outline} strokeWidth="1.2" />
        </>}
        {(pet.kind === 'dog' || pet.kind === 'hamster') && <>
          <ellipse cx="18" cy="12" rx="8" ry="10" fill={col.outline} />
          <ellipse cx="54" cy="12" rx="8" ry="10" fill={col.outline} />
          {pet.kind === 'hamster' && <>
            <ellipse cx="18" cy="12" rx="4.5" ry="5.5" fill="#f9a0b0" />
            <ellipse cx="54" cy="12" rx="4.5" ry="5.5" fill="#f9a0b0" />
          </>}
        </>}
        {/* Лицо — текстовая эмоция */}
        <text x="36" y="34" textAnchor="middle" fontSize="15" fill="#3a2000" fontFamily="monospace" style={{ userSelect: 'none' }}>
          {face}
        </text>
        {/* Здоровье — маленькая полоска внизу головы */}
        <rect x="12" y="47" width="48" height="5" rx="2.5" fill="rgba(0,0,0,0.2)" />
        <rect x="12" y="47" width={48 * (pet.health / 100)} height="5" rx="2.5"
          fill={pet.health > 60 ? '#4ade80' : pet.health > 30 ? '#facc15' : '#f87171'} />
      </svg>

      {/* Имя */}
      <div className="font-pixel text-[8px] text-white mt-0.5 drop-shadow"
        style={{ transform: `scaleX(${pet.dir === -1 ? -1 : 1})` }}>
        {pet.name}
      </div>

      {/* Эмоция-плашка */}
      <div className="font-lcd text-sm text-white/70 leading-none"
        style={{ transform: `scaleX(${pet.dir === -1 ? -1 : 1})` }}>
        {mood === 'happy' ? '😄' : mood === 'sad' ? '😟' : mood === 'sleepy' ? '😴' : mood === 'hungry' ? '😰' : mood === 'dirty' ? '🤢' : '🙂'}
      </div>
    </div>
  );
}

export default function GameCanvas({ pets, objects, lastAction, focusedPet, onPetClick }: Props) {
  const [spawnAnim, setSpawnAnim] = useState<Record<string, number>>({});
  const [floatTexts, setFloatTexts] = useState<{ id: string; text: string; x: number }[]>([]);

  // Анимация появления объектов
  useEffect(() => {
    objects.forEach(obj => {
      if (!(obj.id in spawnAnim)) {
        let scale = 0;
        const iv = setInterval(() => {
          scale = Math.min(1, scale + 0.12);
          setSpawnAnim(s => ({ ...s, [obj.id]: scale }));
          if (scale >= 1) clearInterval(iv);
        }, 30);
      }
    });
  }, [objects]);

  // Плавающий текст при действии
  useEffect(() => {
    if (!lastAction || lastAction.action === 'error' || lastAction.action === 'say') return;
    const id = String(Date.now());
    const x = 40 + Math.random() * 20;
    setFloatTexts(prev => [...prev, { id, text: lastAction.message.slice(0, 32), x }]);
    setTimeout(() => setFloatTexts(prev => prev.filter(t => t.id !== id)), 2200);
  }, [lastAction]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-3xl select-none"
      style={{ background: 'linear-gradient(180deg, #36b0e8 0%, #7cd4f0 18%, #4a9a28 18%, #3a7a18 100%)' }}>

      {/* Небо */}
      <div className="absolute inset-0" style={{ height: '18%' }}>
        <div className="absolute top-3 right-8 text-4xl" style={{ filter: 'drop-shadow(0 0 6px #fff8)' }}>☀️</div>
        <div className="absolute top-2 left-[14%] text-3xl opacity-80">☁️</div>
        <div className="absolute top-5 left-[48%] text-2xl opacity-60">☁️</div>
        {/* Птицы */}
        {[20, 55, 80].map((x, i) => (
          <div key={i} className="absolute text-lg opacity-70" style={{ left: `${x}%`, top: `${15 + i * 25}%` }}>🐦</div>
        ))}
      </div>

      {/* Земля */}
      <div className="absolute bottom-0 left-0 right-0 h-[14%] rounded-b-3xl"
        style={{ background: 'linear-gradient(to top, #2a5a10, #4a9a28)' }}>
        <div className="absolute top-0 left-0 right-0 h-2 opacity-50"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg,#5ab030 0 16px,#3a8018 16px 32px)' }} />
      </div>

      {/* Деревья по краям */}
      <div className="absolute bottom-[13%] left-[3%] text-5xl">🌳</div>
      <div className="absolute bottom-[13%] right-[3%] text-5xl">🌳</div>

      {/* Объекты поля */}
      {objects.map(obj => (
        <div key={obj.id} className="absolute bottom-[13%]"
          style={{ left: `${obj.x}%`, transform: `translateX(-50%) scale(${spawnAnim[obj.id] ?? 0})`, transition: 'none', fontSize: 42, lineHeight: 1 }}>
          {OBJECT_EMOJI[obj.type] ?? '❓'}
        </div>
      ))}

      {/* Питомцы */}
      {pets.map(pet => (
        <PetFace key={pet.id} pet={pet} focused={pet.id === focusedPet} onClick={() => onPetClick(pet.id)} />
      ))}

      {/* Плавающие тексты */}
      {floatTexts.map(ft => (
        <div key={ft.id} className="absolute pointer-events-none font-lcd text-xl text-white font-bold"
          style={{ left: `${ft.x}%`, top: '30%', animation: 'pop-in 2.2s ease-out forwards', textShadow: '0 2px 8px #000a', transform: 'translateX(-50%)' }}>
          {ft.text}
        </div>
      ))}

      {/* Подсказка */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 font-pixel text-[9px] text-white/30 whitespace-nowrap">
        Кликни на питомца → выбери его
      </div>

      {/* Таблица ТЗ — JSON badge */}
      <div className="absolute top-2 left-3 bg-black/40 backdrop-blur rounded-xl px-3 py-1 font-pixel text-[9px] text-[#3bceac]">
        LLM → JSON → ACTION
      </div>
    </div>
  );
}
