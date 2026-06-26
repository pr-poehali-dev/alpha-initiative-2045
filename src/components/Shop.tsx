import type { PetData } from '@/game/types';
import Icon from '@/components/ui/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  deadPets: PetData[];
  totalCoins: number;
  onRevive: (id: string) => void;
}

const REVIVE_COST = 30;

export default function Shop({ open, onClose, deadPets, totalCoins, onRevive }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative bg-[#1a1033] border-2 border-[#ffd23f] rounded-3xl p-6 w-80 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-white/50 hover:text-white">
          <Icon name="X" size={20} />
        </button>

        <h2 className="font-pixel text-base text-[#ffd23f] mb-1 text-center">МАГАЗИН</h2>
        <div className="text-center font-lcd text-2xl text-[#3bceac] mb-4">
          🪙 {totalCoins} монет
        </div>

        {deadPets.length === 0 ? (
          <div className="text-center font-lcd text-xl text-white/50 py-8">
            Все питомцы живы! 🎉
          </div>
        ) : (
          <div className="space-y-3">
            <div className="font-pixel text-[10px] text-white/60 text-center mb-2">ВОСКРЕСИТЬ ПИТОМЦА</div>
            {deadPets.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white/5 rounded-2xl px-4 py-3">
                <div>
                  <div className="font-pixel text-[11px] text-white">{p.name}</div>
                  <div className="font-lcd text-base text-white/50">
                    {p.kind === 'dog' ? '🐕' : p.kind === 'cat' ? '🐈' : p.kind === 'rabbit' ? '🐇' : '🐹'} умер
                  </div>
                </div>
                <button
                  onClick={() => onRevive(p.id)}
                  disabled={totalCoins < REVIVE_COST}
                  className="retro-btn rounded-xl px-4 py-2 font-pixel text-[10px] flex flex-col items-center gap-0.5"
                  style={{
                    background: totalCoins >= REVIVE_COST ? '#3bceac' : '#444',
                    color: totalCoins >= REVIVE_COST ? '#1a1033' : '#888',
                  }}
                >
                  <span>Возродить</span>
                  <span>🪙 {REVIVE_COST}</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 border-t border-white/10 pt-4">
          <div className="font-pixel text-[10px] text-white/40 text-center mb-2">КАК КОПИТЬ МОНЕТЫ</div>
          <div className="font-lcd text-lg text-white/60 space-y-1">
            <div>🍖 Кормить: +5 монет</div>
            <div>🎮 Играть: +2 монеты</div>
            <div>🛁 Мыть: +2 монеты</div>
            <div>😴 Спать: +2 монеты</div>
          </div>
        </div>
      </div>
    </div>
  );
}
