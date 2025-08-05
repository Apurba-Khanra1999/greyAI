'use server';

import { filterOffensivePrompts } from '@/ai/flows/filter-offensive-prompts';
import { conversationalChat } from '@/ai/flows/conversational-chat';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function getAiResponse(allMessages: Message[]): Promise<string> {
  const prompt = allMessages.slice(-1)[0].content;
  const history = allMessages.slice(0, -1);
  
  // First, check for offensive content.
  const filterResult = await filterOffensivePrompts({ prompt });
  if (filterResult.isOffensive) {
    return "I cannot respond to this prompt. Please try something else.";
  }

  // If not offensive, get a conversational response.
  const chatResult = await conversationalChat({ history, prompt });
  return chatResult.response;
}
