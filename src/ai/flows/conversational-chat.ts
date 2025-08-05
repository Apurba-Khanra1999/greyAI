'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ConversationalChatInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history."),
  prompt: z.string().describe("The user's query or message."),
});

const ConversationalChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated conversational response.'),
});

// A simplified prompt that is more robust.
const conversationalPrompt = ai.definePrompt({
  name: 'conversationalPrompt',
  input: { schema: ConversationalChatInputSchema },
  output: { schema: ConversationalChatOutputSchema },
  prompt: `You are a helpful and friendly AI assistant named IndigoChat.
  Provide a concise and conversational response to the user's prompt based on the provided conversation history.
  
  {{#each history}}
  {{#if content}}
  {{role}}: {{content}}
  {{/if}}
  {{/each}}

  user: {{{prompt}}}
  assistant:`,
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
