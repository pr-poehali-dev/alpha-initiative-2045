import os
import json
import requests

SYSTEM_PROMPT = """Ты — AI-помощник игры Тамагочи. Игрок пишет команды на русском языке для управления питомцами.
Твоя задача: распознать намерение игрока и вернуть JSON-объект с действием.

Питомцы в игре:
- РЕКС (dog, id=dog1)
- МУРКА (cat, id=cat1)  
- ЗАЙ (rabbit, id=rabbit1)
- ХОМА (hamster, id=hamster1)

Формат ответа — ТОЛЬКО валидный JSON, без пояснений:
{
  "action": "feed" | "play" | "sleep" | "wash" | "spawn" | "say" | "error",
  "target": "dog" | "cat" | "rabbit" | "hamster" | "all" | "active",
  "object": "tree" | "ball" | "flower" | "bone" | "fish" | "carrot",
  "x": 30-70,
  "message": "Текст ответа на русском для чата (1-2 предложения)",
  "emotion": "happy" | "sad" | "sleepy" | "hungry" | "dirty" | "normal",
  "stat": "hunger" | "happiness" | "energy" | "hygiene",
  "amount": 10-50
}

Правила:
- action=feed: кормить питомца (stat=hunger, amount=25-35)
- action=play: играть с питомцем (stat=happiness, amount=20-30)
- action=sleep: уложить спать (stat=energy, amount=35-45)
- action=wash: помыть (stat=hygiene, amount=35-45)
- action=spawn: добавить объект на поле (нужен object и x)
- action=say: просто ответить, ничего не делать
- action=error: непонятная команда, предложи пример

Объекты для spawn: tree(дерево), ball(мяч), flower(цветок), bone(косточка), fish(рыба), carrot(морковка)

Если игрок называет питомца по имени — используй соответствующий target.
Если команда для всех — target=all.
Если непонятно кому — target=active.
Поле message ВСЕГДА заполняй живым дружелюбным текстом на русском.
Отвечай ТОЛЬКО JSON, никакого текста вне JSON."""


def handler(event: dict, context) -> dict:
    """Обработчик LLM-запросов через Mistral API для тамагочи"""
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    user_message = body.get('message', '').strip()

    if not user_message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'message is required'})
        }

    api_key = os.environ.get('MISTRAL_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'MISTRAL_API_KEY not set'})
        }

    response = requests.post(
        'https://api.mistral.ai/v1/chat/completions',
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
        },
        json={
            'model': 'mistral-small-latest',
            'messages': [
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message},
            ],
            'temperature': 0.3,
            'max_tokens': 300,
            'response_format': {'type': 'json_object'},
        },
        timeout=15
    )

    response.raise_for_status()
    data = response.json()
    raw = data['choices'][0]['message']['content']

    # Парсим JSON из ответа
    result = json.loads(raw)

    # Гарантируем наличие поля message
    if 'message' not in result:
        result['message'] = '✅ Команда выполнена!'

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps(result, ensure_ascii=False)
    }
