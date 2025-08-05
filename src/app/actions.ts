'use server';

import { filterOffensivePrompts } from '@/ai/flows/filter-offensive-prompts';
import { conversationalChat } from '@/ai/flows/conversational-chat';

export async function getAiResponse(prompt: string): Promise<string> {
  // First, check for offensive content.
  const filterResult = await filterOffensivePrompts({ prompt });
  if (filterResult.isOffensive) {
    return "I cannot respond to this prompt. Please try something else.";
  }

  // If not offensive, get a conversational response.
  const chatResult = await conversationalChat({ prompt });
  return chatResult.response;
}
