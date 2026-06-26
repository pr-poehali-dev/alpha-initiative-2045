import { useEffect, useRef, useState } from 'react';
import type { PetData } from '@/game/types';

interface Props {
  pet: PetData;
  selected: boolean;
  onSelect: () => void;
}

/* ── CSS-спрайты животных ─────────────────────────────── */
function DogSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const sleep = state === 'sleeping' || state === 'dying';
  const frozen = state === 'frozen';

  return (
    <svg width="72" height="64" viewBox="0 0 72 64" style={{
      filter: frozen ? 'hue-rotate(160deg) brightness(1.3)' : state === 'dying' ? 'brightness(0.5) saturate(0)' : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
    }}>
      {/* Тело */}
      <ellipse cx="36" cy="40" rx="18" ry="13" fill="#c8860a"/>
      {/* Голова */}
      <circle cx="52" cy="30" r="13" fill="#d49020"/>
      {/* Морда */}
      <ellipse cx="57" cy="34" rx="7" ry="5" fill="#b87010"/>
      {/* Нос */}
      <ellipse cx="61" cy="33" rx="3" ry="2" fill="#3a1a00"/>
      {/* Глаза */}
      <circle cx="55" cy="27" r="3" fill="white"/>
      <circle cx="56" cy="27" r="1.5" fill="#1a0a00"/>
      {/* Уши */}
      <ellipse cx="47" cy="19" rx="5" ry="8" fill="#b87010"
        style={{ transformOrigin: '47px 24px', animation: walk ? 'earWag 0.35s infinite alternate' : 'none' }}/>
      {/* Хвост */}
      <path d="M18 38 Q6 28 10 20" stroke="#c8860a" strokeWidth="5" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '18px 38px', animation: (walk || state === 'playing') ? 'tailWag 0.3s infinite alternate' : 'none' }}/>
      {/* Лапы */}
      <rect x="28" y="50" width="8" height="12" rx="4" fill="#b87010"
        style={{ transformOrigin: '32px 50px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.35s ease-in-out infinite` : 'none' }}/>
      <rect x="38" y="50" width="8" height="12" rx="4" fill="#b87010"
        style={{ transformOrigin: '42px 50px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.35s ease-in-out infinite` : 'none' }}/>
      <rect x="19" y="50" width="8" height="12" rx="4" fill="#b87010"
        style={{ transformOrigin: '23px 50px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.35s ease-in-out infinite` : 'none' }}/>
      <rect x="46" y="50" width="7" height="11" rx="4" fill="#b87010"
        style={{ transformOrigin: '50px 50px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.35s ease-in-out infinite` : 'none' }}/>
      {/* zzzz при сне */}
      {sleep && <text x="54" y="15" fontSize="10" fill="#aac">z</text>}
      {sleep && <text x="60" y="8" fontSize="13" fill="#aac">z</text>}
    </svg>
  );
}

function CatSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';

  return (
    <svg width="72" height="64" viewBox="0 0 72 64" style={{
      filter: frozen ? 'hue-rotate(160deg) brightness(1.3)' : state === 'dying' ? 'brightness(0.5) saturate(0)' : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
    }}>
      {/* Тело */}
      <ellipse cx="34" cy="42" rx="17" ry="12" fill="#e0a060"/>
      {/* Голова */}
      <circle cx="50" cy="28" r="14" fill="#e8b070"/>
      {/* Уши-треугольники */}
      <polygon points="42,18 38,6 46,14" fill="#e0a060"
        style={{ transformOrigin: '42px 18px', animation: walk ? 'earWag 0.5s infinite alternate' : 'none' }}/>
      <polygon points="56,16 60,4 64,16" fill="#e0a060"
        style={{ transformOrigin: '58px 12px', animation: walk ? 'earWag 0.5s 0.25s infinite alternate' : 'none' }}/>
      {/* Розовые ушки внутри */}
      <polygon points="43,17 40,9 46,15" fill="#f9a0c0"/>
      <polygon points="57,15 60,7 63,15" fill="#f9a0c0"/>
      {/* Морда */}
      <ellipse cx="55" cy="32" rx="6" ry="4" fill="#d4905a"/>
      {/* Нос */}
      <polygon points="53,30 55,28 57,30 55,32" fill="#e05060"/>
      {/* Усы */}
      <line x1="36" y1="30" x2="48" y2="30" stroke="#fff" strokeWidth="1" opacity="0.7"/>
      <line x1="36" y1="32" x2="48" y2="33" stroke="#fff" strokeWidth="1" opacity="0.7"/>
      <line x1="63" y1="30" x2="72" y2="29" stroke="#fff" strokeWidth="1" opacity="0.7"/>
      {/* Глаза */}
      <ellipse cx="47" cy="26" rx="3.5" ry="4" fill="#22cc44"/>
      <ellipse cx="47" cy="26" rx="1.2" ry="3.5" fill="#111"/>
      <ellipse cx="55" cy="26" rx="3.5" ry="4" fill="#22cc44"/>
      <ellipse cx="55" cy="26" rx="1.2" ry="3.5" fill="#111"/>
      {/* Хвост */}
      <path d="M17 42 Q4 30 8 18 Q10 10 15 14" stroke="#e0a060" strokeWidth="5" fill="none" strokeLinecap="round"
        style={{ transformOrigin: '17px 42px', animation: (walk || state === 'idle') ? 'tailCatWag 1s infinite alternate ease-in-out' : 'none' }}/>
      {/* Лапы */}
      <ellipse cx="28" cy="53" rx="5" ry="7" fill="#d4905a"
        style={{ transformOrigin: '28px 48px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="38" cy="53" rx="5" ry="7" fill="#d4905a"
        style={{ transformOrigin: '38px 48px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="20" cy="53" rx="4" ry="6" fill="#d4905a"
        style={{ transformOrigin: '20px 48px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'A' : 'B'} 0.4s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="45" cy="52" rx="4" ry="6" fill="#d4905a"
        style={{ transformOrigin: '45px 48px', animation: walk ? `legWalk${walkFrame % 2 === 0 ? 'B' : 'A'} 0.4s ease-in-out infinite` : 'none' }}/>
      {sleep && <text x="58" y="14" fontSize="10" fill="#aac">z</text>}
      {sleep && <text x="64" y="7" fontSize="13" fill="#aac">z</text>}
    </svg>
  );
}

function RabbitSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';

  return (
    <svg width="68" height="70" viewBox="0 0 68 70" style={{
      filter: frozen ? 'hue-rotate(160deg) brightness(1.3)' : state === 'dying' ? 'brightness(0.5) saturate(0)' : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
    }}>
      {/* Тело */}
      <ellipse cx="34" cy="46" rx="16" ry="14" fill="#e8d8c8"/>
      {/* Голова */}
      <circle cx="44" cy="28" r="14" fill="#f0e0d0"/>
      {/* Длинные уши */}
      <ellipse cx="38" cy="8" rx="5" ry="14" fill="#f0e0d0"
        style={{ transformOrigin: '38px 20px', animation: walk ? 'rabbitEarL 0.4s infinite alternate' : 'none' }}/>
      <ellipse cx="52" cy="7" rx="5" ry="14" fill="#f0e0d0"
        style={{ transformOrigin: '52px 20px', animation: walk ? 'rabbitEarR 0.4s 0.2s infinite alternate' : 'none' }}/>
      {/* Внутри ушей */}
      <ellipse cx="38" cy="8" rx="2.5" ry="10" fill="#f9a0c0"/>
      <ellipse cx="52" cy="7" rx="2.5" ry="10" fill="#f9a0c0"/>
      {/* Нос */}
      <ellipse cx="48" cy="30" rx="3" ry="2" fill="#e06080"/>
      {/* Глаза */}
      <circle cx="41" cy="25" r="3.5" fill="#c04040"/>
      <circle cx="42" cy="24" r="1.5" fill="#200"/>
      {/* Хвост пушистик */}
      <circle cx="20" cy="46" r="7" fill="white" opacity="0.9"/>
      {/* Лапы */}
      <ellipse cx="28" cy="58" rx="6" ry="9" fill="#dcc8b8"
        style={{ transformOrigin: '28px 50px', animation: walk ? `legJumpA 0.35s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="40" cy="58" rx="6" ry="9" fill="#dcc8b8"
        style={{ transformOrigin: '40px 50px', animation: walk ? `legJumpB 0.35s ease-in-out infinite` : 'none' }}/>
      {sleep && <text x="52" y="12" fontSize="10" fill="#aac">z</text>}
    </svg>
  );
}

function HamsterSprite({ state, dir, walkFrame }: { state: string; dir: number; walkFrame: number }) {
  const walk = state === 'walking';
  const frozen = state === 'frozen';
  const sleep = state === 'sleeping';

  return (
    <svg width="64" height="60" viewBox="0 0 64 60" style={{
      filter: frozen ? 'hue-rotate(160deg) brightness(1.3)' : state === 'dying' ? 'brightness(0.5) saturate(0)' : 'none',
      transform: dir === -1 ? 'scaleX(-1)' : 'none',
    }}>
      {/* Тело пухлое */}
      <ellipse cx="32" cy="40" rx="20" ry="16" fill="#e8a860"/>
      {/* Щёчки-мешочки */}
      <ellipse cx="16" cy="36" rx="10" ry="9" fill="#f0c080" opacity="0.9"/>
      <ellipse cx="48" cy="36" rx="10" ry="9" fill="#f0c080" opacity="0.9"/>
      {/* Голова */}
      <circle cx="32" cy="26" r="15" fill="#f0b870"/>
      {/* Уши */}
      <circle cx="20" cy="14" r="7" fill="#e0a060"
        style={{ transformOrigin: '20px 18px', animation: walk ? 'earWag 0.5s infinite alternate' : 'none' }}/>
      <circle cx="44" cy="14" r="7" fill="#e0a060"
        style={{ transformOrigin: '44px 18px', animation: walk ? 'earWag 0.5s 0.25s infinite alternate' : 'none' }}/>
      <circle cx="20" cy="14" r="4" fill="#f9a0b0"/>
      <circle cx="44" cy="14" r="4" fill="#f9a0b0"/>
      {/* Нос */}
      <ellipse cx="32" cy="28" rx="3" ry="2" fill="#e06070"/>
      {/* Глаза чёрные блестящие */}
      <circle cx="26" cy="23" r="4" fill="#111"/>
      <circle cx="27" cy="22" r="1.5" fill="white"/>
      <circle cx="38" cy="23" r="4" fill="#111"/>
      <circle cx="39" cy="22" r="1.5" fill="white"/>
      {/* Лапки маленькие */}
      <ellipse cx="22" cy="54" rx="5" ry="6" fill="#d4985a"
        style={{ transformOrigin: '22px 50px', animation: walk ? `legWalkA 0.3s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="32" cy="55" rx="5" ry="6" fill="#d4985a"
        style={{ transformOrigin: '32px 50px', animation: walk ? `legWalkB 0.3s ease-in-out infinite` : 'none' }}/>
      <ellipse cx="42" cy="54" rx="5" ry="6" fill="#d4985a"
        style={{ transformOrigin: '42px 50px', animation: walk ? `legWalkA 0.3s ease-in-out infinite` : 'none' }}/>
      {sleep && <text x="44" y="10" fontSize="10" fill="#aac">z</text>}
      {sleep && <text x="50" y="4" fontSize="12" fill="#aac">z</text>}
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (pet.state !== 'walking') return;
    const t = setInterval(() => setWalkFrame(f => f + 1), 320);
    return () => clearInterval(t);
  }, [pet.state]);

  const handleClick = () => {
    onSelect();
    // Rickroll!
    if (!audioRef.current) {
      audioRef.current = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      // используем YouTube embed через popup
    }
    const popup = document.getElementById('rickroll-popup');
    if (popup) popup.style.display = 'flex';
    setTimeout(() => { if (popup) popup.style.display = 'none'; }, 8000);
  };

  const Renderer = PET_RENDERERS[pet.kind];
  const avg = (pet.stats.hunger + pet.stats.happiness + pet.stats.energy + pet.stats.hygiene) / 4;
  const isDead = pet.state === 'dead';
  const bubble = BUBBLE[pet.state];

  return (
    <div
      onClick={handleClick}
      className="absolute cursor-pointer select-none flex flex-col items-center"
      style={{
        left: `${pet.x}%`,
        top:  `${pet.y}%`,
        transform: 'translateX(-50%)',
        transition: pet.state === 'walking' ? 'left 0.8s linear, top 0.8s linear' : 'left 0.3s, top 0.3s',
        zIndex: selected ? 20 : 10,
        opacity: isDead ? 0.3 : 1,
        filter: isDead ? 'grayscale(1)' : 'none',
      }}
    >
      {/* Пузырь */}
      {bubble && (
        <div className="absolute -top-10 left-1/2 bg-white rounded-2xl px-2 py-1 text-sm shadow whitespace-nowrap font-lcd text-xl"
          style={{ transform: 'translateX(-50%)' }}>
          {bubble}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-2 h-1.5 bg-white" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
        </div>
      )}

      {/* Полоса здоровья */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-2.5 rounded-full bg-black/30 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pet.health}%`,
            background: pet.health > 60 ? '#4ade80' : pet.health > 30 ? '#facc15' : '#f87171',
          }} />
      </div>
      <div className="absolute -top-9 left-1/2 -translate-x-1/2 font-pixel text-[7px] text-white/80 whitespace-nowrap">❤️ {Math.round(pet.health)}</div>

      {/* Полоса холода (только когда > 0) */}
      {pet.cold > 0 && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-16 h-2 rounded-full bg-black/30 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500 bg-[#7ef]"
            style={{ width: `${pet.cold}%` }} />
        </div>
      )}
      {pet.cold > 0 && (
        <div className="absolute -top-17 left-1/2 -translate-x-1/2 font-pixel text-[7px] text-[#7ef] whitespace-nowrap">❄️ {Math.round(pet.cold)}</div>
      )}

      {/* Выделение */}
      {selected && (
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: '0 0 0 3px #ffd23f, 0 0 12px #ffd23f88', borderRadius: '50%', width: 72, height: 72, top: 0 }} />
      )}

      {/* Спрайт */}
      <Renderer state={pet.state} dir={pet.dir} walkFrame={walkFrame} />

      {/* Имя + статус */}
      <div className="mt-1 text-center leading-tight">
        <div className="font-pixel text-[8px] text-white drop-shadow">{pet.name}</div>
        <div className="font-lcd text-sm text-white/70">{STATE_LABELS[pet.state]}</div>
      </div>
    </div>
  );
}
