import { useRef, useEffect } from 'react';
import type { PetData } from '@/game/types';
import PetSprite from './PetSprite';

interface Props {
  pets: PetData[];
  selectedId: string;
  onSelect: (id: string) => void;
  conceptArts: string[];
}

const BG_IMG = 'https://cdn.poehali.dev/projects/75faf0d1-dec3-489b-887e-0dcecb269115/files/da0e4bd0-3d2e-4aa3-bcab-045172ee60cc.jpg';

export default function GameField({ pets, selectedId, onSelect, conceptArts }: Props) {
  const fieldRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={fieldRef}
      className="relative w-full rounded-3xl overflow-hidden border-4 border-white/20"
      style={{ minHeight: 420, background: '#1a1033' }}
    >
      {/* Фоновая картинка */}
      <img
        src={BG_IMG}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 pixelated"
      />

      {/* Пол */}
      <div className="absolute bottom-0 left-0 right-0 h-16 rounded-b-3xl"
        style={{
          background: 'linear-gradient(to top, #2d1b4e88 0%, transparent 100%)',
          borderTop: '2px solid rgba(255,255,255,0.06)'
        }} />

      {/* Предметы окружения */}
      <div className="absolute top-6 right-8 text-5xl opacity-30 select-none">🌙</div>
      <div className="absolute bottom-20 left-8 text-4xl opacity-25 select-none">🌿</div>
      <div className="absolute bottom-16 right-16 text-3xl opacity-25 select-none">🌿</div>

      {/* Питомцы */}
      {pets.map(pet => (
        <PetSprite
          key={pet.id}
          pet={pet}
          selected={pet.id === selectedId}
          onSelect={() => onSelect(pet.id)}
        />
      ))}

      {/* Подсказка */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 font-lcd text-lg text-white/50 pointer-events-none">
        Нажми на питомца, чтобы выбрать
      </div>
    </div>
  );
}
