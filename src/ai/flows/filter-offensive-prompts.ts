'use server';

/**
 * @fileOverview Filters offensive or inappropriate prompts to ensure a safe interaction environment.
 *
 * - filterOffensivePrompts - A function that filters potentially offensive prompts.
 * - FilterOffensivePromptsInput - The input type for the filterOffensivePrompts function.
 * - FilterOffensivePromptsOutput - The return type for the filterOffensivePrompts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterOffensivePromptsInputSchema = z.object({
  prompt: z
    .string()
    .describe('The user prompt to be checked for potential offensiveness.'),
});
export type FilterOffensivePromptsInput = z.infer<typeof FilterOffensivePromptsInputSchema>;

const FilterOffensivePromptsOutputSchema = z.object({
  isOffensive: z
    .boolean()
    .describe('Whether the prompt is considered potentially offensive.'),
  reason: z.string().describe('The reason why the prompt is considered offensive.'),
});
export type FilterOffensivePromptsOutput = z.infer<typeof FilterOffensivePromptsOutputSchema>;

export async function filterOffensivePrompts(input: FilterOffensivePromptsInput): Promise<FilterOffensivePromptsOutput> {
  return filterOffensivePromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterOffensivePromptsPrompt',
  input: {schema: FilterOffensivePromptsInputSchema},
  output: {schema: FilterOffensivePromptsOutputSchema},
  prompt: `You are an AI assistant designed to identify potentially offensive prompts.
  Determine if the following prompt is likely to generate an offensive or inappropriate response.
  Respond with a boolean value indicating whether the prompt is offensive and a reason for your determination.

  Prompt: {{{prompt}}}`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const filterOffensivePromptsFlow = ai.defineFlow(
  {
    name: 'filterOffensivePromptsFlow',
    inputSchema: FilterOffensivePromptsInputSchema,
    outputSchema: FilterOffensivePromptsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
