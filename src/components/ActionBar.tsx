import type { Action } from '@/game/types';
import Icon from '@/components/ui/icon';

interface Props {
  onAction: (a: Action) => void;
  disabled: boolean;
  activePetState: string;
}

const BUTTONS: { action: Action; label: string; icon: string; color: string; emoji: string }[] = [
  { action: 'sleep', label: 'Спать',    icon: 'Moon',       color: '#6c63ff', emoji: '😴' },
  { action: 'play',  label: 'Играть',   icon: 'Gamepad2',   color: '#3bceac', emoji: '🎮' },
  { action: 'feed',  label: 'Кормить',  icon: 'Utensils',   color: '#ff6b35', emoji: '🍖' },
  { action: 'wash',  label: 'Мыться',   icon: 'ShowerHead', color: '#4d96ff', emoji: '🛁' },
];

const BUSY_STATES = ['sleeping', 'playing', 'eating', 'bathing', 'drying'];

export default function ActionBar({ onAction, disabled, activePetState }: Props) {
  const isBusy = BUSY_STATES.includes(activePetState);

  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {BUTTONS.map(b => {
        const off = disabled || isBusy;
        return (
          <button
            key={b.action}
            onClick={() => !off && onAction(b.action)}
            disabled={off}
            className="retro-btn flex flex-col items-center gap-1.5 rounded-2xl px-5 py-3 font-pixel text-[10px] text-white disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: b.color, boxShadow: `0 6px 0 ${b.color}88, 0 10px 20px ${b.color}44` }}
          >
            <span className="text-2xl">{b.emoji}</span>
            <Icon name={b.icon} size={16} className="text-white/80" />
            {b.label}
          </button>
        );
      })}
    </div>
  );
}
