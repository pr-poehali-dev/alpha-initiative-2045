import { useState, useEffect } from 'react';
import type { PetData } from '@/game/types';
import { PET_CONFIGS } from '@/game/petConfig';

interface Props {
  pet: PetData;
  selected: boolean;
  onSelect: () => void;
}

const FRAME_MS: Record<string, number> = {
  idle: 900, walking: 350, sleeping: 1200,
  playing: 280, eating: 500, bathing: 600, drying: 400,
};

const getFrames = (pet: PetData) => {
  const cfg = PET_CONFIGS[pet.kind];
  switch (pet.state) {
    case 'walking':  return cfg.walkFrames;
    case 'sleeping': return cfg.sleepFrames;
    case 'playing':  return cfg.playFrames;
    case 'eating':   return cfg.eatFrames;
    case 'bathing':  return cfg.bathFrames;
    case 'drying':   return cfg.dryFrames;
    default:         return cfg.idleFrames;
  }
};

const STATE_LABELS: Record<string, string> = {
  idle: 'Отдыхает', walking: 'Гуляет', sleeping: 'Спит',
  playing: 'Играет', eating: 'Ест', bathing: 'Моется', drying: 'Сохнет',
};

export default function PetSprite({ pet, selected, onSelect }: Props) {
  const [frame, setFrame] = useState(0);
  const frames = getFrames(pet);
  const cfg = PET_CONFIGS[pet.kind];
  const avg = (pet.stats.hunger + pet.stats.happiness + pet.stats.energy + pet.stats.hygiene) / 4;

  useEffect(() => {
    const ms = FRAME_MS[pet.state] ?? 600;
    const t = setInterval(() => setFrame((f) => (f + 1) % frames.length), ms);
    return () => clearInterval(t);
  }, [pet.state, frames.length]);

  const isSleeping = pet.state === 'sleeping';
  const isPlaying  = pet.state === 'playing';
  const isEating   = pet.state === 'eating';
  const isBathing  = pet.state === 'bathing';
  const isDrying   = pet.state === 'drying';

  const showBubble = isSleeping || isPlaying || isEating || isBathing || isDrying;
  const bubbleContent =
    isSleeping ? 'z z z' :
    isPlaying  ? cfg.toy :
    isEating   ? cfg.food :
    isBathing  ? '💧💧💧' :
    isDrying   ? '💨' : '';

  return (
    <div
      onClick={onSelect}
      className="absolute cursor-pointer select-none flex flex-col items-center"
      style={{
        left: `${pet.x}%`,
        top:  `${pet.y}%`,
        transform: `scaleX(${pet.dir === -1 ? -1 : 1})`,
        transition: pet.state === 'walking' ? 'left 0.8s linear, top 0.8s linear' : 'left 0.3s, top 0.3s',
        zIndex: selected ? 20 : 10,
      }}
    >
      {/* Пузырь действия */}
      {showBubble && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl px-2 py-1 text-sm shadow-md whitespace-nowrap"
          style={{ transform: `translateX(-50%) scaleX(${pet.dir === -1 ? -1 : 1})`, fontFamily: '"VT323", monospace', fontSize: 18 }}
        >
          {bubbleContent}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-2 bg-white clip-triangle" />
        </div>
      )}

      {/* Спрайт */}
      <div
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 64, height: 64,
          background: selected ? `${cfg.color}33` : 'transparent',
          outline: selected ? `3px solid ${cfg.color}` : '3px solid transparent',
          borderRadius: '50%',
          transition: 'outline 0.2s',
        }}
      >
        <span
          style={{
            fontSize: 40,
            filter: avg < 25 ? 'grayscale(80%)' : 'none',
            animation: isSleeping ? 'breathe 2s ease-in-out infinite' : undefined,
            display: 'block',
            lineHeight: 1,
          }}
        >
          {frames[frame]}
        </span>
      </div>

      {/* Имя + статус */}
      <div
        className="mt-1 text-center leading-none"
        style={{ transform: `scaleX(${pet.dir === -1 ? -1 : 1})` }}
      >
        <div className="font-pixel text-[8px] text-white drop-shadow">{pet.name}</div>
        <div className="font-lcd text-base text-white/70">{STATE_LABELS[pet.state]}</div>
      </div>
    </div>
  );
}
