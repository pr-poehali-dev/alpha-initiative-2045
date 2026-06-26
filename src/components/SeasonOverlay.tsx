import type { Season } from '@/game/types';

interface Props { season: Season }

const SEASON_PALETTES: Record<Season, { bg: string; label: string; icon: string; snowflakes?: boolean }> = {
  spring: { bg: 'rgba(100,200,100,0.06)', label: 'Весна', icon: '🌸' },
  summer: { bg: 'rgba(255,220,60,0.06)',  label: 'Лето',  icon: '☀️' },
  autumn: { bg: 'rgba(200,100,30,0.08)',  label: 'Осень', icon: '🍂' },
  winter: { bg: 'rgba(150,200,255,0.12)', label: 'Зима',  icon: '❄️', snowflakes: true },
};

const SNOWFLAKES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  delay: `${Math.random() * 6}s`,
  dur: `${4 + Math.random() * 5}s`,
  size: `${10 + Math.random() * 16}px`,
  emoji: ['❄️','🌨️','❅','✦'][Math.floor(Math.random() * 4)],
}));

export default function SeasonOverlay({ season }: Props) {
  const palette = SEASON_PALETTES[season];

  return (
    <>
      {/* Цветовой тинт */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ background: palette.bg, zIndex: 1 }} />

      {/* Снег зимой */}
      {palette.snowflakes && SNOWFLAKES.map(s => (
        <div key={s.id}
          className="absolute pointer-events-none select-none"
          style={{
            left: s.left,
            top: '-30px',
            fontSize: s.size,
            animationName: 'snowfall',
            animationDuration: s.dur,
            animationDelay: s.delay,
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            zIndex: 2,
            opacity: 0.7,
          }}>
          {s.emoji}
        </div>
      ))}

      {/* Сезонный тег */}
      <div className="absolute top-3 right-3 bg-black/40 backdrop-blur rounded-xl px-3 py-1 font-pixel text-[10px] text-white z-10 flex items-center gap-1.5">
        <span>{palette.icon}</span>
        {palette.label}
      </div>
    </>
  );
}
