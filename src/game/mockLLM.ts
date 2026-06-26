/*
 * mockLLM — имитация LLM-ответа без реального API.
 * В будущем заменяется на fetch('/api/llm', { body: prompt }).
 *
 * JSON-формат ответа:
 * {
 *   "action": "feed" | "play" | "sleep" | "wash" | "spawn" | "say" | "error",
 *   "target": "cat" | "dog" | "rabbit" | "hamster" | "all",   // кому
 *   "object": "tree" | "ball" | "flower" | "bone" | "fish" | "carrot",  // для spawn
 *   "x": 0-100,        // позиция для spawn (% ширины)
 *   "message": "...",  // текст в чате
 *   "emotion": "happy" | "sad" | "sleepy" | "hungry" | "dirty" | "normal"
 * }
 */

export interface LLMResponse {
  action: 'feed' | 'play' | 'sleep' | 'wash' | 'spawn' | 'say' | 'error';
  target?: string;
  object?: string;
  x?: number;
  message: string;
  emotion?: string;
  stat?: string;
  amount?: number;
}

type Rule = { keywords: string[]; response: LLMResponse };

const RULES: Rule[] = [
  // КОРМИТЬ
  { keywords: ['корми', 'еда', 'есть', 'голод', 'накорми', 'покорми', 'кушать', 'покушать', 'рыб', 'косточ', 'морков', 'семечк'],
    response: { action: 'feed', target: 'active', message: '🍖 Кормлю питомца! Сытость растёт.', emotion: 'happy', stat: 'hunger', amount: 30 } },

  // ИГРАТЬ
  { keywords: ['игра', 'играй', 'поиграй', 'играть', 'побегай', 'мяч', 'весел'],
    response: { action: 'play', target: 'active', message: '🎮 Питомец побежал играть!', emotion: 'happy', stat: 'happiness', amount: 25 } },

  // СПАТЬ
  { keywords: ['спать', 'сон', 'засыпай', 'уложи', 'отдых', 'усни', 'баю'],
    response: { action: 'sleep', target: 'active', message: '😴 Питомец ложится спать...', emotion: 'sleepy', stat: 'energy', amount: 40 } },

  // МЫТЬ
  { keywords: ['мой', 'мыть', 'купай', 'душ', 'чист', 'грязн', 'помой'],
    response: { action: 'wash', target: 'active', message: '🛁 Купаемся! Чистота +40.', emotion: 'normal', stat: 'hygiene', amount: 40 } },

  // ДЕРЕВО
  { keywords: ['дерево', 'дерев', 'ёлк', 'ель', 'посади'],
    response: { action: 'spawn', object: 'tree', x: 65, message: '🌳 Посажено дерево на поле!', emotion: 'happy' } },

  // ЦВЕТОК
  { keywords: ['цветок', 'цветы', 'цвет', 'розу', 'тюльп'],
    response: { action: 'spawn', object: 'flower', x: 55, message: '🌸 На поле появился цветок!', emotion: 'happy' } },

  // МЯЧ
  { keywords: ['мяч', 'шар', 'брось мяч'],
    response: { action: 'spawn', object: 'ball', x: 70, message: '🎾 Мяч брошен на поле!', emotion: 'happy' } },

  // КОСТОЧКА
  { keywords: ['косточ', 'кость', 'bone'],
    response: { action: 'spawn', object: 'bone', x: 40, message: '🦴 Косточка появилась на поле!', emotion: 'happy' } },

  // КОТ
  { keywords: ['кошк', 'мурк', 'кот', 'кис'],
    response: { action: 'say', target: 'cat', message: '🐈 МУРКА смотрит на тебя. Напиши команду для неё!', emotion: 'normal' } },

  // СОБАКА
  { keywords: ['соба', 'рекс', 'пёс', 'пес'],
    response: { action: 'say', target: 'dog', message: '🐕 РЕКС виляет хвостом. Что прикажешь?', emotion: 'happy' } },

  // ЗАЯЦ
  { keywords: ['заяц', 'зай', 'кролик'],
    response: { action: 'say', target: 'rabbit', message: '🐇 ЗАЙ навострил уши. Что делаем?', emotion: 'normal' } },

  // ХОМЯК
  { keywords: ['хомяк', 'хома'],
    response: { action: 'say', target: 'hamster', message: '🐹 ХОМА смотрит с любопытством!', emotion: 'normal' } },

  // ГРУСТНО / СОСТОЯНИЕ
  { keywords: ['как', 'состоян', 'самочувств', 'здоровье'],
    response: { action: 'say', message: '📊 Посмотри на эмоции питомцев! 😄 — всё хорошо, 😟 — нужна помощь, 😴 — хочет спать, 😰 — голоден.', emotion: 'normal' } },

  // УБЕРИ / УДАЛИ
  { keywords: ['убери', 'удали', 'убрать', 'очисти'],
    response: { action: 'say', message: '🧹 Поле очищено от объектов!', emotion: 'normal' } },
];

function delay(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

export async function mockLLM(input: string): Promise<LLMResponse> {
  await delay(600 + Math.random() * 400); // имитация задержки API

  const lower = input.toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      // Случайная позиция X для spawn
      if (rule.response.action === 'spawn') {
        return { ...rule.response, x: 30 + Math.random() * 40 };
      }
      return rule.response;
    }
  }

  // Дефолт — не распознано
  const suggestions = ['накорми кошку', 'добавь дерево', 'поиграй с Рексом', 'уложи Зайку спать', 'помой Хому'];
  const s = suggestions[Math.floor(Math.random() * suggestions.length)];
  return {
    action: 'error',
    message: `🤔 Не понял команду. Попробуй: «${s}»`,
  };
}

export const JSON_FORMAT_EXAMPLE = `
// Формат JSON-ответа LLM:
{
  "action": "feed",        // feed | play | sleep | wash | spawn | say | error
  "target": "cat",         // cat | dog | rabbit | hamster | all | active
  "object": "tree",        // для spawn: tree | ball | flower | bone | fish | carrot
  "x": 60,                 // позиция объекта на поле (0–100%)
  "message": "Текст...",   // сообщение в чате
  "emotion": "happy",      // happy | sad | sleepy | hungry | dirty | normal
  "stat": "hunger",        // какой стат меняем
  "amount": 30             // на сколько
}`;
