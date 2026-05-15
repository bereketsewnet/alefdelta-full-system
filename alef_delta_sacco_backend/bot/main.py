import argparse
import asyncio
import os
from typing import Optional

from aiogram import Bot, Dispatcher, F
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv('BOT_TOKEN')
BOT_WEBHOOK_URL = os.getenv('BOT_WEBHOOK_URL')
BACKEND_BASE_URL = os.getenv('BACKEND_BASE_URL', 'https://api.alef-delta.local/api')

if not BOT_TOKEN:
    raise RuntimeError('BOT_TOKEN is required')

bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()


@dp.message(CommandStart())
async def handle_start(message: Message):
    await message.answer(
        "👋 Welcome to ALEF-DELTA SACCO bot.\nUse /status <loan_id> to check a loan."
    )


@dp.message(F.text.regexp(r'^/status\s+'))
async def handle_status(message: Message):
    parts = message.text.split()
    if len(parts) < 2:
        await message.reply('Please supply a loan id, e.g. /status LOAN-1234')
        return
    loan_id = parts[1]
    # In production call the backend; here we provide an illustrative payload
    await message.answer(f"Loan <b>{loan_id}</b> is currently <b>UNDER_REVIEW</b>.")


async def start_polling():
    await dp.start_polling(bot)


async def start_webhook():
    if not BOT_WEBHOOK_URL:
        raise RuntimeError('BOT_WEBHOOK_URL env var is required for webhook mode')

    from fastapi import FastAPI, Request, HTTPException
    import uvicorn

    app = FastAPI()

    @app.on_event('startup')
    async def _startup():
        await bot.set_webhook(BOT_WEBHOOK_URL)

    @app.on_event('shutdown')
    async def _shutdown():
        await bot.delete_webhook()

    @app.post('/bot/webhook')
    async def telegram_update(request: Request):
        data = await request.json()
        await dp.feed_update(bot, data)
        return {'ok': True}

    @app.post('/bot/send-notification')
    async def forward_notification(payload: dict):
        required = {'chat_id', 'message'}
        if not required.issubset(payload):
            raise HTTPException(status_code=400, detail='chat_id and message required')
        extra: Optional[list[str]] = payload.get('attachments')
        text = payload['message']
        if extra:
            text += "\n" + "\n".join(extra)
        await bot.send_message(payload['chat_id'], text)
        return {'ok': True}

    uvicorn.run(app, host='0.0.0.0', port=int(os.getenv('BOT_PORT', '8081')))


def main():
    parser = argparse.ArgumentParser(description='ALEF-DELTA SACCO bot service')
    parser.add_argument('--mode', choices=['polling', 'webhook'], default='polling')
    args = parser.parse_args()
    if args.mode == 'polling':
        asyncio.run(start_polling())
    else:
        asyncio.run(start_webhook())


if __name__ == '__main__':
    main()
