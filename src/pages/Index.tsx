import { useState, useEffect, useRef, useCallback } from 'react';
import type { PetData, Season } from '@/game/types';
import { decayStats, getXpToLevel, applyAction, getActionDuration } from '@/game/stateMachine';
import { mockLLM } from '@/game/mockLLM';
import type { LLMResponse } from '@/game/mockLLM';
import Chat from '@/components/Chat';
import type { ChatMessage } from '@/components/Chat';
import GameCanvas from '@/components/GameCanvas';
import type { FieldObject } from '@/components/GameCanvas';
import Shop from '@/components/Shop';
import Icon from '@/components/ui/icon';

/* ── Начальные питомцы ── */
const INITIAL_PETS: PetData[] = [
  { id: 'dog1',     kind: 'dog',     name: 'РЕКС',  state: 'walking', stats: { hunger: 80, happiness: 85, energy: 70, hygiene: 90 }, x: 18, y: 65, dir: 1,  targetX: 35, targetY: 65, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'cat1',     kind: 'cat',     name: 'МУРКА', state: 'idle',    stats: { hunger: 75, happiness: 90, energy: 80, hygiene: 85 }, x: 42, y: 68, dir: -1, targetX: 60, targetY: 68, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'rabbit1',  kind: 'rabbit',  name: 'ЗАЙ',   state: 'walking', stats: { hunger: 70, happiness: 78, energy: 65, hygiene: 80 }, x: 65, y: 66, dir: 1,  targetX: 80, targetY: 66, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
  { id: 'hamster1', kind: 'hamster', name: 'ХОМА',  state: 'idle',    stats: { hunger: 85, happiness: 72, energy: 75, hygiene: 92 }, x: 82, y: 70, dir: -1, targetX: 55, targetY: 70, level: 1, xp: 0, coins: 0, health: 100, cold: 0 },
];

const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_LABELS: Record<Season, string> = { spring: '🌸 Весна', summer: '☀️ Лето', autumn: '🍂 Осень', winter: '❄️ Зима' };
const rand = (a: number, b: number) => Math.random() * (b - a) + a;
const clamp = (v: number) => Math.max(0, Math.min(100, v));

function leveled(pet: PetData): PetData {
  const needed = getXpToLevel(pet.level);
  if (pet.xp >= needed) {
    return { ...pet, level: pet.level + 1, xp: pet.xp - needed, health: clamp(pet.health + 5), stats: { hunger: clamp(pet.stats.hunger + 5), happiness: clamp(pet.stats.happiness + 5), energy: clamp(pet.stats.energy + 5), hygiene: clamp(pet.stats.hygiene + 5) } };
  }
  return pet;
}

function resolveColl(pets: PetData[]): PetData[] {
  const r = pets.map(p => ({ ...p }));
  for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
    const a = r[i], b = r[j];
    if (a.state === 'dead' || b.state === 'dead') continue;
    const dx = a.x - b.x, dy = (a.y - b.y) * 2.5;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < 9) {
      const push = (9 - d) / 2 + 0.3;
      const nx = (dx / (d || 1)) * push, ny = (dy / (d || 1)) * push * 0.35;
      r[i] = { ...a, x: clamp(a.x + nx), y: Math.max(55, Math.min(78, a.y + ny)) };
      r[j] = { ...b, x: clamp(b.x - nx), y: Math.max(55, Math.min(78, b.y - ny)) };
    }
  }
  return r;
}

const KIND_MAP: Record<string, string> = { cat: 'cat1', dog: 'dog1', rabbit: 'rabbit1', hamster: 'hamster1', кошк: 'cat1', соба: 'dog1', зай: 'rabbit1', хомяк: 'hamster1' };

/* ── ТЗ таблица ── */
const TZ_ROWS = [
  { request: 'накорми кошку', llm: 'action=feed, target=cat', game: 'stats.hunger +30, state=eating', pet: '😄 радостно ест, heart +heal' },
  { request: 'добавь дерево', llm: 'action=spawn, object=tree', game: 'FieldObject tree появляется', pet: '👀 питомец смотрит на дерево' },
  { request: 'поиграй с Рексом', llm: 'action=play, target=dog', game: 'state=playing, happiness +25', pet: '🎮 бегает за мячом' },
  { request: 'уложи всех спать', llm: 'action=sleep, target=all', game: 'state=sleeping, energy +40', pet: '😴 все ложатся, z z z' },
  { request: 'помой Хому', llm: 'action=wash, target=hamster', game: 'state=bathing→drying, hygiene+40', pet: '🛁 моется, потом сохнет' },
  { request: 'посади цветок', llm: 'action=spawn, object=flower', game: 'FieldObject flower появляется', pet: '😊 питомец нюхает цветок' },
  { request: 'как они?', llm: 'action=say (info)', game: '—', pet: 'бот описывает состояния' },
  { request: 'непонятная фраза', llm: 'action=error', game: '—', pet: 'бот предлагает пример' },
];

export default function Index() {
  const [pets, setPets] = useState<PetData[]>(INITIAL_PETS);
  const [objects, setObjects] = useState<FieldObject[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'system', text: '👋 Привет! Я твой AI-помощник для тамагочи. Пиши команды — я буду управлять питомцами! Попробуй: «накорми кошку» или «добавь дерево».', ts: Date.now() },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState<LLMResponse | null>(null);
  const [focusedPet, setFocusedPet] = useState<string | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [season, setSeason] = useState<Season>('summer');
  const [showTZ, setShowTZ] = useState(false);
  const lastTickRef = useRef(Date.now());
  const actionTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  /* Смена сезонов */
  useEffect(() => {
    const t = setInterval(() => setSeason(s => SEASONS[(SEASONS.indexOf(s) + 1) % SEASONS.length]), 45000);
    return () => clearInterval(t);
  }, []);

  /* Движение */
  useEffect(() => {
    const iv = setInterval(() => {
      setPets(prev => {
        const moved = prev.map(p => {
          if (p.state === 'dead' || p.state === 'dying') return p;
          if (p.state !== 'idle' && p.state !== 'walking') return p;
          const dx = Math.abs(p.x - p.targetX), dy = Math.abs(p.y - p.targetY);
          if (dx < 2 && dy < 2) {
            const tX = rand(5, 90), tY = rand(56, 76);
            return { ...p, targetX: tX, targetY: tY, state: Math.random() > 0.35 ? 'walking' as const : 'idle' as const, dir: tX > p.x ? 1 : -1 as 1 | -1 };
          }
          const spd = 1.3;
          return { ...p, x: p.x + Math.sign(p.targetX - p.x) * Math.min(spd, dx), y: p.y + Math.sign(p.targetY - p.y) * Math.min(spd * 0.2, dy), dir: p.targetX > p.x ? 1 : -1 as 1 | -1, state: 'walking' };
        });
        return resolveColl(moved);
      });
    }, 300);
    return () => clearInterval(iv);
  }, []);

  /* Деградация */
  useEffect(() => {
    const iv = setInterval(() => {
      const now = Date.now(), delta = now - lastTickRef.current;
      lastTickRef.current = now;
      setPets(prev => prev.map(p => p.state === 'dead' ? p : leveled(decayStats(p, delta, season))));
    }, 2000);
    return () => clearInterval(iv);
  }, [season]);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'ts'>) => {
    setMessages(prev => [...prev, { ...msg, id: String(Date.now() + Math.random()), ts: Date.now() }]);
  }, []);

  /* Применить действие LLM к питомцам */
  const applyLLMAction = useCallback((resp: LLMResponse) => {
    setLastAction(resp);

    if (resp.action === 'spawn' && resp.object) {
      const obj: FieldObject = { id: String(Date.now()), type: resp.object as FieldObject['type'], x: resp.x ?? 50, spawnedAt: Date.now(), scale: 0 };
      setObjects(prev => [...prev.slice(-7), obj]); // макс 8 объектов
      // Питомцы смотрят на объект
      setPets(prev => prev.map(p => p.state === 'idle' || p.state === 'walking'
        ? { ...p, targetX: (resp.x ?? 50) + rand(-12, 12), dir: (resp.x ?? 50) > p.x ? 1 : -1 as 1 | -1 }
        : p));
      return;
    }

    if (resp.action === 'error' || resp.action === 'say') return;

    // Определяем целевых питомцев
    const targetIds: string[] = [];
    if (resp.target === 'all') { targetIds.push(...pets.map(p => p.id)); }
    else if (resp.target === 'active' || !resp.target) {
      targetIds.push(focusedPet ?? pets.find(p => p.state !== 'dead')?.id ?? pets[0]?.id);
    } else {
      const mapped = KIND_MAP[resp.target] ?? null;
      if (mapped) targetIds.push(mapped);
    }

    // Применяем action
    const actionMap: Record<string, 'feed' | 'play' | 'sleep' | 'wash'> = { feed: 'feed', play: 'play', sleep: 'sleep', wash: 'wash' };
    const act = actionMap[resp.action];
    if (!act) return;

    setPets(prev => prev.map(p => {
      if (!targetIds.includes(p.id) || p.state === 'dead') return p;
      if (actionTimers.current[p.id]) clearTimeout(actionTimers.current[p.id]);
      const updated = applyAction(p, act);
      actionTimers.current[p.id] = setTimeout(() => {
        setPets(pp => pp.map(q => q.id === p.id ? { ...q, state: 'idle' } : q));
      }, getActionDuration(act));
      return updated;
    }));
  }, [pets, focusedPet]);

  /* Отправка команды */
  const handleSend = useCallback(async (text: string) => {
    addMessage({ role: 'user', text });
    setLoading(true);
    try {
      const resp = await mockLLM(text);
      addMessage({ role: 'bot', text: resp.message });
      applyLLMAction(resp);
    } catch {
      addMessage({ role: 'bot', text: '⚠️ Ошибка соединения. Попробуй снова.' });
    } finally {
      setLoading(false);
    }
  }, [addMessage, applyLLMAction]);

  const deadPets = pets.filter(p => p.state === 'dead');
  const totalCoins = pets.reduce((s, p) => s + p.coins, 0);

  const handleRevive = (id: string) => {
    if (totalCoins < 30) return;
    let taken = 30;
    setPets(prev => prev.map(p => {
      if (p.id === id) return { ...p, state: 'idle', health: 60, cold: 0, stats: { hunger: 50, happiness: 50, energy: 50, hygiene: 50 } };
      if (taken > 0 && p.coins > 0) { const t = Math.min(p.coins, taken); taken -= t; return { ...p, coins: p.coins - t }; }
      return p;
    }));
    setShopOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0e1a] font-body">

      <Shop open={shopOpen} onClose={() => setShopOpen(false)} deadPets={deadPets} totalCoins={totalCoins} onRevive={handleRevive} />

      {/* Шапка */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-white/10 select-none">
        <h1 className="font-pixel text-base text-white" style={{ textShadow: '2px 2px 0 #d61f6e' }}>ТАМАГОЧИ LLM</h1>
        <div className="flex items-center gap-1.5 ml-2 bg-[#3bceac]/10 rounded-full px-3 py-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#3bceac] animate-pulse" />
          <span className="font-pixel text-[9px] text-[#3bceac]">AI активен</span>
        </div>
        <span className="font-lcd text-lg text-white/40 ml-2">{SEASON_LABELS[season]}</span>
        <div className="ml-auto flex gap-2">
          <span className="font-lcd text-lg text-[#ffd23f]">🪙 {totalCoins}</span>
          <button onClick={() => setShopOpen(true)} className="retro-btn rounded-xl px-3 py-1.5 font-pixel text-[9px] text-white flex items-center gap-1.5 relative" style={{ background: '#6c63ff' }}>
            <Icon name="ShoppingBag" size={14} /> МАГАЗИН
            {deadPets.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] flex items-center justify-center">{deadPets.length}</span>}
          </button>
          <button onClick={() => setShowTZ(v => !v)} className="retro-btn rounded-xl px-3 py-1.5 font-pixel text-[9px] text-white flex items-center gap-1.5" style={{ background: showTZ ? '#d61f6e' : '#ffffff18' }}>
            <Icon name="Table" size={14} /> ТЗ
          </button>
        </div>
      </header>

      {/* Основной сплит */}
      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

        {/* ═══ ЧАТ — левая 38% ═══ */}
        <div className="w-[38%] min-w-[280px] flex flex-col overflow-hidden">
          <Chat messages={messages} onSend={handleSend} loading={loading} />
        </div>

        {/* ═══ ПОЛИГОН — правая 62% ═══ */}
        <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
          <div className="flex-1 min-h-0">
            <GameCanvas
              pets={pets}
              objects={objects}
              lastAction={lastAction}
              focusedPet={focusedPet}
              onPetClick={(id) => {
                setFocusedPet(id);
                const p = pets.find(q => q.id === id);
                if (p) addMessage({ role: 'system', text: `Выбран: ${p.name} (${p.kind}) — здоровье ${Math.round(p.health)}, сытость ${Math.round(p.stats.hunger)}` });
              }}
            />
          </div>

          {/* JSON формат */}
          <div className="bg-[#0e1a0a] border border-[#3bceac]/20 rounded-2xl px-4 py-2 font-pixel text-[9px] text-[#3bceac]/70 leading-relaxed shrink-0">
            <span className="text-[#3bceac] text-[10px]">JSON формат LLM:</span>
            {'  '}
            {`{ "action": "feed|play|sleep|wash|spawn|say|error", "target": "cat|dog|rabbit|hamster|all", "object": "tree|ball|flower|bone", "x": 60, "message": "..." }`}
          </div>
        </div>
      </div>

      {/* ТЗ-таблица (разворачивается) */}
      {showTZ && (
        <div className="border-t border-white/10 bg-[#0a0a16] px-4 py-4 overflow-x-auto">
          <h2 className="font-pixel text-[11px] text-[#ffd23f] mb-3">ТАБЛИЦА: ЗАПРОС → LLM → ДЕЙСТВИЕ → РЕАКЦИЯ</h2>
          <table className="w-full text-sm font-lcd border-collapse" style={{ minWidth: 700 }}>
            <thead>
              <tr className="border-b border-white/10">
                {['Запрос игрока', 'Интерпретация LLM', 'Действие игры', 'Реакция питомца'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-pixel text-[10px] text-white/50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TZ_ROWS.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/3">
                  <td className="px-3 py-2 text-[#ffd23f]">«{row.request}»</td>
                  <td className="px-3 py-2 text-[#3bceac] font-pixel text-[9px]">{row.llm}</td>
                  <td className="px-3 py-2 text-white/70">{row.game}</td>
                  <td className="px-3 py-2 text-white/60">{row.pet}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-2xl p-3">
              <div className="font-pixel text-[10px] text-[#ffd23f] mb-2">ВИЗУАЛЬНЫЕ МАРКЕРЫ</div>
              <div className="font-lcd text-base text-white/70 space-y-1">
                <div>😄 Всё хорошо (avg{'>'} 70)</div>
                <div>😟 Грустит (avg{'<'} 50)</div>
                <div>😴 Хочет спать (energy{'<'} 25)</div>
                <div>😰 Голодный (hunger{'<'} 25)</div>
                <div>🤢 Грязный (hygiene{'<'} 25)</div>
                <div>❤️ Полоска здоровья</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <div className="font-pixel text-[10px] text-[#3bceac] mb-2">СПИСОК АССЕТОВ</div>
              <div className="font-lcd text-base text-white/70 space-y-1">
                <div>🐕 dog_idle, walk, sleep, eat...</div>
                <div>🐈 cat_idle, walk, play, bath...</div>
                <div>🐇 rabbit_idle, jump, sleep...</div>
                <div>🐹 hamster_idle, wheel, eat...</div>
                <div>🌳🎾🌸🦴🐟🥕 объекты поля</div>
                <div>🎵 munch.mp3, splash.mp3</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <div className="font-pixel text-[10px] text-[#ff6b35] mb-2">ОБРАБОТКА ОШИБОК</div>
              <div className="font-lcd text-base text-white/70 space-y-1">
                <div>• Непонятный запрос → пример</div>
                <div>• Мёртвый питомец → магазин</div>
                <div>• Занятый питомец → очередь</div>
                <div>• Нет монет → уведомление</div>
                <div>• Timeout → повтор</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <div className="font-pixel text-[10px] text-[#d61f6e] mb-2">ПРОГРЕССИЯ</div>
              <div className="font-lcd text-base text-white/70 space-y-1">
                <div>Lvl 1→2: +50 XP</div>
                <div>Level up → +5 к статам</div>
                <div>Кормление: +5 монет</div>
                <div>Воскрешение: 30 монет</div>
                <div>Зима: холод +6/сек</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
