'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ConversationalChatInputSchema = z.object({
  prompt: z.string().describe("The user's query or message."),
});

const ConversationalChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated conversational response.'),
});

const conversationalPrompt = ai.definePrompt({
  name: 'conversationalPrompt',
  input: { schema: ConversationalChatInputSchema },
  output: { schema: ConversationalChatOutputSchema },
  prompt: `You are a helpful and friendly AI assistant named IndigoChat.
  Provide a concise and conversational response to the user's prompt.
  
  Prompt: {{{prompt}}}`,
});

export const conversationalChat = ai.defineFlow(
  {
    name: 'conversationalChat',
    inputSchema: ConversationalChatInputSchema,
    outputSchema: ConversationalChatOutputSchema,
  },
  async (input) => {
    const { output } = await conversationalPrompt(input);
    return output!;
  }
);
