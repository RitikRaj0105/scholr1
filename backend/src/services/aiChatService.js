import { prisma } from '../lib/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { mentorChat } from '../ai/mentor.js';

export const listChats = (userId) =>
  prisma.aIChat.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } });

export const getChat = async (userId, id) => {
  const chat = await prisma.aIChat.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: 'asc' } } } });
  if (!chat || chat.userId !== userId) throw ApiError.notFound();
  return chat;
};

export const sendMessage = async (userId, { chatId, context, message }) => {
  let chat = chatId
    ? await prisma.aIChat.findUnique({ where: { id: chatId }, include: { messages: { orderBy: { createdAt: 'asc' } } } })
    : null;
  if (chat && chat.userId !== userId) throw ApiError.forbidden();
  if (!chat) {
    chat = await prisma.aIChat.create({
      data: { userId, context: context || 'mentor', title: message.slice(0, 60) },
      include: { messages: true },
    });
  }
  await prisma.aIMessage.create({ data: { chatId: chat.id, role: 'user', content: message } });
  const history = (chat.messages || []).slice(-12);
  const ai = await mentorChat(history, message);
  const reply = await prisma.aIMessage.create({
    data: { chatId: chat.id, role: 'assistant', content: ai.content, tokens: ai.tokens },
  });
  await prisma.aIChat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });
  return { chatId: chat.id, message: reply, mocked: ai.mocked };
};

export const removeChat = async (userId, id) => {
  const chat = await prisma.aIChat.findUnique({ where: { id } });
  if (!chat || chat.userId !== userId) throw ApiError.notFound();
  await prisma.aIChat.delete({ where: { id } });
  return { ok: true };
};
