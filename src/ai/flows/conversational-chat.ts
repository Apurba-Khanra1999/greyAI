'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  fileUrl: z.string().optional().nullable().describe("A file, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const ConversationalChatInputSchema = z.object({
  history: z.array(MessageSchema).describe("The conversation history."),
  prompt: z.string().describe("The user's query or message."),
  fileDataUri: z.string().optional().nullable().describe("A file, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});

const ConversationalChatOutputSchema = z.object({
  response: z.string().describe('The AI-generated conversational response.'),
});

const conversationalPrompt = ai.definePrompt({
  name: 'conversationalPrompt',
  input: { schema: ConversationalChatInputSchema },
  output: { schema: ConversationalChatOutputSchema },
  prompt: `You are a helpful and friendly AI assistant named GreyAI.
  Provide a detailed, helpful, and conversational response to the user's prompt based on the provided conversation history and any attached files (images or documents).
  
  If a file is provided, use it as the primary source of information to answer the user's questions.

  {{#each history}}
    {{#if content}}
      {{role}}: {{content}}
    {{/if}}
    {{#if fileUrl}}
      (A file was present in this message)
    {{/if}}
  {{/each}}

  user: {{{prompt}}}
  {{#if fileDataUri}}
  {{media url=fileDataUri}}
  {{/if}}
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
