import { useEffect, useState } from 'react';
import type { PetData } from '@/game/types';

interface Props {
  pet: PetData;
  selected: boolean;
  onSelect: () => void;
}

/* ── СОБАКА ─────────────────────────────────────────────── */
function DogSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const sleep = state === 'sleeping' || state === 'dying';
  const frozen = state === 'frozen';
  const sf = `hue-rotate(160deg) brightness(1.3)`;
  const df = `brightness(0.45) saturate(0)`;

  return (
    <svg width="80" height="72" viewBox="0 0 80 72" style={{
      filter: frozen ? sf : state === 'dying' ? df : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
      overflow: 'visible',
    }}>
      {/* Хвост */}
      <path d="M14 46 Q2 34 6 22" stroke="#b87010" strokeWidth="6" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '14px 46px', animation: (walk || state === 'playing') ? 'tailWag 0.28s infinite alternate' : 'none' }}/>
      {/* Тело */}
      <ellipse cx="38" cy="48" rx="20" ry="14" fill="#c8860a"/>
      {/* Шея */}
      <ellipse cx="54" cy="40" rx="9" ry="8" fill="#c8860a"/>
      {/* Голова */}
      <circle cx="58" cy="28" r="14" fill="#d49020"/>
      {/* Ухо — одно видимое */}
      <ellipse cx="50" cy="17" rx="6" ry="10" fill="#b87010"
        style={{ transformOrigin: '50px 24px', animation: walk ? 'earWag 0.35s infinite alternate' : 'none' }}/>
      {/* Морда */}
      <ellipse cx="67" cy="33" rx="8" ry="6" fill="#b87010"/>
      {/* Нос */}
      <ellipse cx="72" cy="31" rx="3.5" ry="2.5" fill="#2a0e00"/>
      {/* ДВА ГЛАЗА */}
      <circle cx="60" cy="24" r="3.5" fill="white"/>
      <circle cx="61.5" cy="24" r="2" fill="#1a0800"/>
      <circle cx="62.5" cy="23" r="0.7" fill="white"/>
      <circle cx="53" cy="25" r="2.5" fill="white"/>
      <circle cx="54" cy="25" r="1.4" fill="#1a0800"/>
      <circle cx="54.6" cy="24.4" r="0.5" fill="white"/>
      {/* Рот */}
      <path d="M67 34 Q69 37 71 34" stroke="#2a0e00" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* 4 ЛАПЫ: 2 передних + 2 задних */}
      {/* Задние */}
      <rect x="20" y="58" width="10" height="13" rx="5" fill="#b87010"
        style={{ transformOrigin: '25px 58px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.35s ease-in-out infinite` : 'none' }}/>
      <rect x="33" y="58" width="10" height="13" rx="5" fill="#b87010"
        style={{ transformOrigin: '38px 58px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.35s ease-in-out infinite` : 'none' }}/>
      {/* Передние */}
      <rect x="46" y="55" width="9" height="14" rx="5" fill="#b87010"
        style={{ transformOrigin: '50px 55px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.35s ease-in-out infinite` : 'none' }}/>
      <rect x="57" y="54" width="9" height="13" rx="5" fill="#b87010"
        style={{ transformOrigin: '61px 54px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.35s ease-in-out infinite` : 'none' }}/>
      {sleep && <><text x="66" y="14" fontSize="10" fill="#aac" fontFamily="sans-serif">z</text><text x="72" y="7" fontSize="13" fill="#aac" fontFamily="sans-serif">z</text></>}
    </svg>
  );
}

/* ── КОШКА ─────────────────────────────────────────────── */
function CatSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';
  const sf = `hue-rotate(160deg) brightness(1.3)`;
  const df = `brightness(0.45) saturate(0)`;

  return (
    <svg width="80" height="70" viewBox="0 0 80 70" style={{
      filter: frozen ? sf : state === 'dying' ? df : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
      overflow: 'visible',
    }}>
      {/* Хвост */}
      <path d="M14 50 Q2 36 6 20 Q8 10 14 16" stroke="#e0a060" strokeWidth="6" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '14px 50px', animation: (walk || state === 'idle') ? 'tailCatWag 1s infinite alternate ease-in-out' : 'none' }}/>
      {/* Тело */}
      <ellipse cx="36" cy="48" rx="18" ry="13" fill="#e0a060"/>
      {/* Голова */}
      <circle cx="54" cy="30" r="15" fill="#e8b070"/>
      {/* Уши */}
      <polygon points="43,20 39,6 49,16" fill="#e0a060"
        style={{ transformOrigin: '44px 18px', animation: walk ? 'earWag 0.5s infinite alternate' : 'none' }}/>
      <polygon points="60,18 63,4 68,18" fill="#e0a060"
        style={{ transformOrigin: '63px 14px', animation: walk ? 'earWag 0.5s 0.25s infinite alternate' : 'none' }}/>
      <polygon points="44,19 41,9 48,16" fill="#f9a0c0"/>
      <polygon points="61,17 63,7 67,17" fill="#f9a0c0"/>
      {/* Морда */}
      <ellipse cx="61" cy="36" rx="7" ry="5" fill="#d4905a"/>
      {/* Нос */}
      <polygon points="59,33 61,31 63,33 61,35" fill="#e05060"/>
      {/* Усы */}
      <line x1="40" y1="33" x2="53" y2="33" stroke="#fff8" strokeWidth="1.2"/>
      <line x1="40" y1="35.5" x2="53" y2="36.5" stroke="#fff8" strokeWidth="1.2"/>
      <line x1="69" y1="33" x2="79" y2="32" stroke="#fff8" strokeWidth="1.2"/>
      <line x1="69" y1="36" x2="79" y2="37" stroke="#fff8" strokeWidth="1.2"/>
      {/* Глаза */}
      <ellipse cx="50" cy="28" rx="3.5" ry="4" fill="#22cc44"/>
      <ellipse cx="50" cy="28" rx="1.2" ry="3.6" fill="#111"/>
      <circle cx="49.2" cy="26.5" r="0.9" fill="white"/>
      <ellipse cx="59" cy="28" rx="3.5" ry="4" fill="#22cc44"/>
      <ellipse cx="59" cy="28" rx="1.2" ry="3.6" fill="#111"/>
      <circle cx="58.2" cy="26.5" r="0.9" fill="white"/>
      {/* 4 лапы */}
      <ellipse cx="22" cy="58" rx="6" ry="8" fill="#d4905a"
        style={{ transformOrigin: '22px 52px', animation: walk ? `legWalkA 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="34" cy="59" rx="6" ry="8" fill="#d4905a"
        style={{ transformOrigin: '34px 53px', animation: walk ? `legWalkB 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="46" cy="58" rx="5" ry="7" fill="#d4905a"
        style={{ transformOrigin: '46px 52px', animation: walk ? `legWalkA 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="56" cy="57" rx="5" ry="7" fill="#d4905a"
        style={{ transformOrigin: '56px 52px', animation: walk ? `legWalkB 0.4s ease-in-out infinite` : 'none' }}/>
      {sleep && <><text x="66" y="15" fontSize="10" fill="#aac" fontFamily="sans-serif">z</text><text x="72" y="7" fontSize="13" fill="#aac" fontFamily="sans-serif">z</text></>}
    </svg>
  );
}

/* ── ЗАЯЦ ─────────────────────────────────────────────── */
function RabbitSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';
  const sf = `hue-rotate(160deg) brightness(1.3)`;
  const df = `brightness(0.45) saturate(0)`;

  return (
    // viewBox расширен сверху чтобы уши не обрезались
    <svg width="76" height="90" viewBox="0 0 76 90" style={{
      filter: frozen ? sf : state === 'dying' ? df : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
      overflow: 'visible',
    }}>
      {/* Длинные уши — рисуем ПЕРВЫМИ, за головой */}
      <ellipse cx="32" cy="14" rx="6" ry="20" fill="#f0e0d0"
        style={{ transformOrigin: '32px 30px', animation: walk ? 'rabbitEarL 0.4s infinite alternate' : 'none' }}/>
      <ellipse cx="32" cy="14" rx="3" ry="15" fill="#f9a0c0"/>
      <ellipse cx="48" cy="12" rx="6" ry="20" fill="#f0e0d0"
        style={{ transformOrigin: '48px 30px', animation: walk ? 'rabbitEarR 0.4s 0.2s infinite alternate' : 'none' }}/>
      <ellipse cx="48" cy="12" rx="3" ry="15" fill="#f9a0c0"/>

      {/* Тело */}
      <ellipse cx="36" cy="62" rx="17" ry="16" fill="#e8d8c8"/>
      {/* Пушистый хвостик */}
      <circle cx="19" cy="62" r="8" fill="white" opacity="0.95"/>

      {/* Голова поверх ушей */}
      <circle cx="44" cy="40" r="16" fill="#f0e0d0"/>
      {/* Нос */}
      <ellipse cx="50" cy="43" rx="3.5" ry="2.5" fill="#e06080"/>
      {/* Рот */}
      <path d="M48 45 Q50 48 52 45" stroke="#c04060" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* ДВА ГЛАЗА */}
      <circle cx="40" cy="36" r="4" fill="#c04040"/>
      <circle cx="41" cy="36" r="2.2" fill="#300"/>
      <circle cx="41.8" cy="35.2" r="0.8" fill="white"/>
      <circle cx="50" cy="35" r="4" fill="#c04040"/>
      <circle cx="51" cy="35" r="2.2" fill="#300"/>
      <circle cx="51.8" cy="34.2" r="0.8" fill="white"/>

      {/* 2 ЗАДНИХ лапы (видимые) */}
      <ellipse cx="28" cy="76" rx="8" ry="11" fill="#dcc8b8"
        style={{ transformOrigin: '28px 66px', animation: walk ? `legJumpA 0.35s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="44" cy="76" rx="8" ry="11" fill="#dcc8b8"
        style={{ transformOrigin: '44px 66px', animation: walk ? `legJumpB 0.35s ease-in-out infinite` : 'none' }}/>
      {/* 2 передних лапки */}
      <ellipse cx="50" cy="70" rx="5" ry="7" fill="#dcc8b8"
        style={{ transformOrigin: '50px 65px', animation: walk ? `legWalkA 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="58" cy="68" rx="4" ry="6" fill="#dcc8b8"
        style={{ transformOrigin: '58px 64px', animation: walk ? `legWalkB 0.4s ease-in-out infinite` : 'none' }}/>

      {sleep && <text x="58" y="20" fontSize="11" fill="#aac" fontFamily="sans-serif">z z</text>}
    </svg>
  );
}

/* ── ХОМЯК ─────────────────────────────────────────────── */
function HamsterSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';
  const sf = `hue-rotate(160deg) brightness(1.3)`;
  const df = `brightness(0.45) saturate(0)`;

  return (
    <svg width="72" height="68" viewBox="0 0 72 68" style={{
      filter: frozen ? sf : state === 'dying' ? df : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
      overflow: 'visible',
    }}>
      {/* Тело пухлое */}
      <ellipse cx="36" cy="46" rx="22" ry="17" fill="#e8a860"/>
      {/* Щёчки */}
      <ellipse cx="14" cy="40" rx="11" ry="10" fill="#f0c080" opacity="0.85"/>
      <ellipse cx="58" cy="40" rx="11" ry="10" fill="#f0c080" opacity="0.85"/>
      {/* Голова */}
      <circle cx="36" cy="28" r="16" fill="#f0b870"/>
      {/* Уши */}
      <circle cx="22" cy="15" r="8" fill="#e0a060"
        style={{ transformOrigin: '22px 20px', animation: walk ? 'earWag 0.5s infinite alternate' : 'none' }}/>
      <circle cx="50" cy="15" r="8" fill="#e0a060"
        style={{ transformOrigin: '50px 20px', animation: walk ? 'earWag 0.5s 0.25s infinite alternate' : 'none' }}/>
      <circle cx="22" cy="15" r="4.5" fill="#f9a0b0"/>
      <circle cx="50" cy="15" r="4.5" fill="#f9a0b0"/>
      {/* Нос */}
      <ellipse cx="36" cy="30" rx="3.5" ry="2.5" fill="#e06070"/>
      {/* Рот */}
      <path d="M33 32 Q36 35 39 32" stroke="#c04050" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      {/* Усики */}
      <line x1="20" y1="30" x2="31" y2="30" stroke="#fff8" strokeWidth="1"/>
      <line x1="41" y1="30" x2="52" y2="30" stroke="#fff8" strokeWidth="1"/>
      {/* ДВА БЛЕСТЯЩИХ ГЛАЗА */}
      <circle cx="28" cy="24" r="4.5" fill="#111"/>
      <circle cx="29.5" cy="22.5" r="1.8" fill="white"/>
      <circle cx="28.5" cy="25.5" r="0.7" fill="#444"/>
      <circle cx="44" cy="24" r="4.5" fill="#111"/>
      <circle cx="45.5" cy="22.5" r="1.8" fill="white"/>
      <circle cx="44.5" cy="25.5" r="0.7" fill="#444"/>
      {/* ТОЛЬКО 2 ЛАПКИ (левая + правая) */}
      <ellipse cx="24" cy="60" rx="7" ry="9" fill="#d4985a"
        style={{ transformOrigin: '24px 53px', animation: walk ? `legWalkA 0.28s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="48" cy="60" rx="7" ry="9" fill="#d4985a"
        style={{ transformOrigin: '48px 53px', animation: walk ? `legWalkB 0.28s ease-in-out infinite` : 'none' }}/>
      {sleep && <><text x="52" y="12" fontSize="10" fill="#aac" fontFamily="sans-serif">z</text><text x="58" y="5" fontSize="13" fill="#aac" fontFamily="sans-serif">z</text></>}
    </svg>
  );
}

const PET_RENDERERS = { dog: DogSprite, cat: CatSprite, rabbit: RabbitSprite, hamster: HamsterSprite };

const STATE_LABELS: Record<string, string> = {
  idle: 'Отдыхает', walking: 'Гуляет', sleeping: 'Спит',
  playing: 'Играет', eating: 'Ест', bathing: 'Моется', drying: 'Сохнет',
  dying: '😰 Умирает...', dead: '💀 Умер', frozen: '🥶 Замёрз!',
};

const BUBBLE: Record<string, string> = {
  sleeping: 'z z z', playing: '🎮', eating: '🍖', bathing: '💧💧', drying: '💨', dying: '💔', frozen: '🥶❄️',
};

export default function PetSprite({ pet, selected, onSelect }: Props) {
  const [walkFrame, setWalkFrame] = useState(0);
  const [rickVisible, setRickVisible] = useState(false);

  useEffect(() => {
    if (pet.state !== 'walking') return;
    const t = setInterval(() => setWalkFrame(f => f + 1), 300);
    return () => clearInterval(t);
  }, [pet.state]);

  const handleClick = () => {
    onSelect();
    setRickVisible(true);
    setTimeout(() => setRickVisible(false), 8000);
  };

  const Renderer = PET_RENDERERS[pet.kind];
  const isDead = pet.state === 'dead';
  const bubble = BUBBLE[pet.state];

  // Высота спрайта зависит от типа (заяц выше из-за ушей)
  const spriteHeight = pet.kind === 'rabbit' ? 90 : pet.kind === 'hamster' ? 68 : 72;

  return (
    <>
      {/* Rickroll inline */}
      {rickVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setRickVisible(false)}>
          <div className="relative rounded-3xl overflow-hidden border-4 border-[#ffd23f] shadow-2xl"
            style={{ width: 560, maxWidth: '94vw', aspectRatio: '16/9' }}
            onClick={e => e.stopPropagation()}>
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1" allow="autoplay" className="w-full h-full" title="rick" />
            <button onClick={() => setRickVisible(false)} className="absolute top-3 right-3 bg-black/60 rounded-full p-2 text-white text-xl">✕</button>
          </div>
        </div>
      )}

      <div
        onClick={handleClick}
        className="absolute cursor-pointer select-none flex flex-col items-center"
        style={{
          left: `${pet.x}%`,
          top:  `${pet.y}%`,
          transform: 'translateX(-50%)',
          transition: pet.state === 'walking' ? 'left 0.8s linear, top 0.5s linear' : 'left 0.3s, top 0.3s',
          zIndex: selected ? 20 : 10,
          opacity: isDead ? 0.3 : 1,
          filter: isDead ? 'grayscale(1)' : 'none',
        }}
      >
        {/* Пузырь */}
        {bubble && (
          <div className="absolute bg-white rounded-2xl px-2 py-1 shadow whitespace-nowrap font-lcd text-xl pointer-events-none"
            style={{ bottom: spriteHeight + 28, left: '50%', transform: 'translateX(-50%)' }}>
            {bubble}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2 h-1.5 bg-white" style={{ clipPath: 'polygon(0 0,100% 0,50% 100%)' }} />
          </div>
        )}

        {/* Полоса здоровья */}
        <div className="absolute w-16 h-2.5 rounded-full bg-black/40 overflow-hidden"
          style={{ bottom: spriteHeight + 8, left: '50%', transform: 'translateX(-50%)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pet.health}%`, background: pet.health > 60 ? '#4ade80' : pet.health > 30 ? '#facc15' : '#f87171' }} />
        </div>
        <div className="absolute font-pixel whitespace-nowrap pointer-events-none"
          style={{ bottom: spriteHeight + 12, left: '50%', transform: 'translateX(-50%)', fontSize: 7, color: 'rgba(255,255,255,0.8)' }}>
          ❤️ {Math.round(pet.health)}
        </div>

        {/* Полоса холода */}
        {pet.cold > 0 && (
          <div className="absolute w-16 h-2 rounded-full bg-black/30 overflow-hidden"
            style={{ bottom: spriteHeight + 22, left: '50%', transform: 'translateX(-50%)' }}>
            <div className="h-full rounded-full transition-all duration-500 bg-[#7ef]"
              style={{ width: `${pet.cold}%` }} />
          </div>
        )}

        {/* Выделение */}
        {selected && (
          <div className="absolute rounded-full pointer-events-none"
            style={{ width: 76, height: 76, bottom: spriteHeight - 70, left: '50%', transform: 'translateX(-50%)', boxShadow: '0 0 0 3px #ffd23f, 0 0 16px #ffd23f88' }} />
        )}

        {/* Спрайт */}
        <Renderer state={pet.state} dir={pet.dir} walkFrame={walkFrame} />

        {/* Имя */}
        <div className="mt-0.5 text-center leading-tight">
          <div className="font-pixel text-[8px] text-white drop-shadow">{pet.name}</div>
          <div className="font-lcd text-sm text-white/70">{STATE_LABELS[pet.state]}</div>
        </div>
      </div>
    </>
  );
}
