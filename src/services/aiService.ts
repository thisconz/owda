import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExplanationStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export class AIService {
  public static async explainReaction(expression: string): Promise<{ steps: ExplanationStep[], thermodynamics: { enthalpy?: number, entropy?: number, gibbs?: number, type: string } }> {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze the following chemical reaction: ${expression}. Provide educational reasoning, the reaction mechanism, and an estimation of its thermodynamic properties (enthalpy in kJ/mol, entropy in J/mol*K, gibbs free energy in kJ/mol, and the reaction type).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              humanOverview: { type: Type.STRING, description: "A simple, educational explanation of what happens in this reaction." },
              expertMechanism: { type: Type.STRING, description: "A detailed mechanism or advanced insight into the molecular dynamics, transition states, or reaction type." },
              enthalpy: { type: Type.NUMBER, description: "Estimated delta H in kJ/mol" },
              entropy: { type: Type.NUMBER, description: "Estimated delta S in J/mol*K" },
              gibbs: { type: Type.NUMBER, description: "Estimated delta G in kJ/mol" },
              reactionType: { type: Type.STRING, description: "Type of reaction (e.g. Synthesis, Combustion, Electrophilic Aromatic Substitution, etc)" }
            },
            required: ["humanOverview", "expertMechanism", "reactionType"]
          }
        }
      });

      if (!response.text) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(response.text);

      const steps: ExplanationStep[] = [
        {
          title: "Basic Overview",
          description: parsed.humanOverview,
          mode: "human"
        },
        {
          title: "Reaction Mechanism",
          description: parsed.expertMechanism,
          mode: "expert"
        },
        {
          title: "Thermodynamics & Type",
          description: "```json\n{\n  \"reaction\": \"" + expression + "\",\n  \"type\": \"" + parsed.reactionType + "\"" +
            (parsed.enthalpy ? ",\n  \"enthalpy_kJ_mol\": " + parsed.enthalpy : "") +
            (parsed.gibbs ? ",\n  \"gibbs_kJ_mol\": " + parsed.gibbs : "") +
            "\n}\n```",
          mode: "machine"
        }
      ];

      return {
        steps,
        thermodynamics: {
          enthalpy: parsed.enthalpy || 0,
          entropy: parsed.entropy || 0,
          gibbs: parsed.gibbs || 0,
          type: parsed.reactionType
        }
      };

    } catch (e) {
      console.error("AI Service Error: ", e);
      // Fallback
      return {
        steps: [
          { title: "Basic Overview", description: "This reaction implies the breaking and forming of chemical bonds.", mode: "human" },
          { title: "Reaction Mechanism", description: "The mechanism consists of molecular collisions overcoming an activation energy barrier.", mode: "expert" }
        ],
        thermodynamics: { type: "Unknown" }
      };
    }
  }
}
