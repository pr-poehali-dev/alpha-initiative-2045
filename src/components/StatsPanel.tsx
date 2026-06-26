import type { PetData } from '@/game/types';
import { PET_CONFIGS } from '@/game/petConfig';
import { getMoodEmoji, getXpToLevel } from '@/game/stateMachine';
import Icon from '@/components/ui/icon';

interface Props { pet: PetData; }

const STATS = [
  { key: 'hunger'    as const, label: 'Сытость',  color: '#ff6b35', icon: 'Utensils' },
  { key: 'happiness' as const, label: 'Радость',  color: '#ffd23f', icon: 'Star' },
  { key: 'energy'    as const, label: 'Энергия',  color: '#3bceac', icon: 'Zap' },
  { key: 'hygiene'   as const, label: 'Чистота',  color: '#4d96ff', icon: 'Droplets' },
];

export default function StatsPanel({ pet }: Props) {
  const cfg = PET_CONFIGS[pet.kind];
  const avg = (pet.stats.hunger + pet.stats.happiness + pet.stats.energy + pet.stats.hygiene) / 4;
  const xpNeeded = getXpToLevel(pet.level);
  const xpPct = Math.min((pet.xp % xpNeeded) / xpNeeded * 100, 100);

  return (
    <div className="rounded-3xl bg-white/10 backdrop-blur border border-white/20 p-4 w-72 shrink-0">
      {/* Заголовок питомца */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-4xl">{cfg.emoji}</span>
        <div>
          <div className="font-pixel text-sm text-white">{pet.name}</div>
          <div className="font-lcd text-xl" style={{ color: cfg.color }}>
            {getMoodEmoji(avg)} {avg > 75 ? 'Счастлив!' : avg > 50 ? 'Нормально' : avg > 25 ? 'Грустит' : 'Болеет!'}
          </div>
        </div>
        <div className="ml-auto font-pixel text-[10px] text-[#ffd23f] text-right">
          LVL<br /><span className="text-2xl font-lcd">{pet.level}</span>
        </div>
      </div>

      {/* XP */}
      <div className="mb-3">
        <div className="flex justify-between font-lcd text-white/60 text-base mb-0.5">
          <span>Опыт</span><span>{pet.xp % xpNeeded}/{xpNeeded} XP</span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-[#ffd23f] transition-all duration-700"
            style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* Здоровье */}
      <div className="mb-2">
        <div className="flex items-center justify-between font-lcd text-lg text-white/80 mb-0.5">
          <span className="flex items-center gap-1">❤️ Здоровье</span>
          <span style={{ color: pet.health < 25 ? '#ff4040' : 'inherit' }}>{Math.round(pet.health)}</span>
        </div>
        <div className="h-3 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pet.health}%`, background: pet.health > 60 ? '#4ade80' : pet.health > 30 ? '#facc15' : '#f87171' }} />
        </div>
      </div>

      {/* Холод */}
      {pet.cold > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between font-lcd text-lg text-[#7ef] mb-0.5">
            <span>❄️ Холод</span>
            <span>{Math.round(pet.cold)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-[#7ef]"
              style={{ width: `${pet.cold}%` }} />
          </div>
        </div>
      )}

      {/* Монеты */}
      <div className="mb-3 font-lcd text-lg text-[#ffd23f]">🪙 Монет: {pet.coins}</div>

      {/* Статы */}
      <div className="space-y-2">
        {STATS.map(st => {
          const v = pet.stats[st.key];
          return (
            <div key={st.key}>
              <div className="flex items-center justify-between font-lcd text-lg text-white/80 mb-0.5">
                <span className="flex items-center gap-1">
                  <Icon name={st.icon} size={14} style={{ color: st.color }} />
                  {st.label}
                </span>
                <span style={{ color: v < 25 ? '#ff4040' : 'inherit' }}>{Math.round(v)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${v}%`, background: st.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {pet.state === 'dead' && (
        <div className="mt-4 text-center font-pixel text-[10px] text-red-400 animate-pulse">
          💀 Питомец умер. Воскреси в магазине!
        </div>
      )}
      {pet.state === 'frozen' && (
        <div className="mt-4 text-center font-lcd text-xl text-[#7ef]" style={{ animation: 'frozenShake 0.2s infinite' }}>
          🥶 Замёрз! Помой горячей водой или уложи спать!
        </div>
      )}
    </div>
  );
}