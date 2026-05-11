import { GoogleGenAI, Type } from '@google/genai';
import { ExplanationStep } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AIAnalysisResult {
  steps: ExplanationStep[];
  thermodynamics: {
    enthalpy?: number;
    entropy?: number;
    gibbs?: number;
    type: string;
  };
}

export class AIService {
  public static async explainReaction(expression: string): Promise<AIAnalysisResult> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following chemical reaction: "${expression}".
Provide:
1. A simple educational explanation of what occurs (humanOverview).
2. A technical mechanism or advanced molecular insight (expertMechanism).
3. Estimated thermodynamic values: enthalpy ΔH (kJ/mol), entropy ΔS (J/mol·K), Gibbs ΔG (kJ/mol).
4. The reaction type classification.
Be precise and concise.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              humanOverview: {
                type: Type.STRING,
                description: 'Simple, educational explanation of what happens in this reaction.',
              },
              expertMechanism: {
                type: Type.STRING,
                description:
                  'Detailed mechanism or advanced insight into molecular dynamics, transition states, or reaction type.',
              },
              enthalpy: {
                type: Type.NUMBER,
                description: 'Estimated delta H in kJ/mol',
              },
              entropy: {
                type: Type.NUMBER,
                description: 'Estimated delta S in J/mol*K',
              },
              gibbs: {
                type: Type.NUMBER,
                description: 'Estimated delta G in kJ/mol',
              },
              reactionType: {
                type: Type.STRING,
                description:
                  'Type of reaction (e.g. Synthesis, Combustion, Electrophilic Aromatic Substitution, etc)',
              },
            },
            required: ['humanOverview', 'expertMechanism', 'reactionType'],
          },
        },
      });

      if (!response.text) {
        throw new Error('Empty response from AI model.');
      }

      const parsed = JSON.parse(response.text);

      const thermodynamicSummary = [
        `**Reaction Type:** ${parsed.reactionType}`,
        parsed.enthalpy !== undefined ? `**ΔH:** ${parsed.enthalpy} kJ/mol` : null,
        parsed.entropy !== undefined ? `**ΔS:** ${parsed.entropy} J/mol·K` : null,
        parsed.gibbs !== undefined ? `**ΔG:** ${parsed.gibbs} kJ/mol` : null,
        parsed.gibbs !== undefined
          ? `**Spontaneity:** ${parsed.gibbs < 0 ? '✓ Spontaneous (ΔG < 0)' : '✗ Non-spontaneous (ΔG > 0)'}`
          : null,
      ]
        .filter(Boolean)
        .join('\n\n');

      const steps: ExplanationStep[] = [
        {
          title: 'Basic Overview',
          description: parsed.humanOverview,
          mode: 'human',
        },
        {
          title: 'Reaction Mechanism',
          description: parsed.expertMechanism,
          mode: 'expert',
        },
        {
          title: 'Thermodynamic Analysis',
          description: thermodynamicSummary,
          mode: 'machine',
        },
      ];

      return {
        steps,
        thermodynamics: {
          enthalpy: parsed.enthalpy ?? 0,
          entropy: parsed.entropy ?? 0,
          gibbs: parsed.gibbs ?? 0,
          type: parsed.reactionType,
        },
      };
    } catch (e: any) {
      console.error('AIService Error:', e);

      // Structured fallback so the UI still renders meaningfully
      return {
        steps: [
          {
            title: 'Basic Overview',
            description:
              'This reaction involves the rearrangement of atoms through the breaking and forming of chemical bonds, governed by stoichiometric ratios.',
            mode: 'human',
          },
          {
            title: 'Reaction Mechanism',
            description:
              'Molecular collisions with sufficient kinetic energy overcome the activation energy barrier, leading to bond reorganisation and product formation.',
            mode: 'expert',
          },
          {
            title: 'AI Analysis Unavailable',
            description:
              `**Status:** AI service offline\n\n**Reason:** ${e?.message ?? 'Unknown error'}\n\n**Action:** Check your API key configuration or network connection.`,
            mode: 'machine',
          },
        ],
        thermodynamics: { type: 'Unknown' },
      };
    }
  }
}