import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CorrectionResult {
  correctedText: string;
  corrections: Array<{
    original: string;
    corrected: string;
    type: 'orthographe' | 'grammaire' | 'ponctuation' | 'style' | 'typographie';
    explanation: string;
  }>;
  signCount: number;
}

export async function correctText(text: string): Promise<CorrectionResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `Tu es correcteur professionnel pour Rolling Stone France (magazine hebdomadaire).

Corrige le texte suivant en respectant ces regles :
- Orthographe francaise impeccable
- Grammaire et syntaxe
- Ponctuation (guillemets francais, espaces insecables, tirets cadratins)
- Typographie editoriale (majuscules noms propres, italiques titres d'oeuvres)
- Style journalistique Rolling Stone (dynamique, precis, pas de jargon inutile)

IMPORTANT : Ne modifie PAS le sens ni le ton du texte. Corrige uniquement les erreurs.

Reponds UNIQUEMENT en JSON valide avec cette structure :
{
  "correctedText": "le texte corrige complet",
  "corrections": [
    {
      "original": "mot ou passage original",
      "corrected": "mot ou passage corrige",
      "type": "orthographe|grammaire|ponctuation|style|typographie",
      "explanation": "explication courte"
    }
  ]
}

Si le texte est parfait, renvoie correctedText identique et corrections vide.

Texte a corriger :
---
${text}
---`,
      },
    ],
  });

  try {
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Extract JSON from possible markdown code blocks
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const result = JSON.parse(jsonText);
    return {
      correctedText: result.correctedText,
      corrections: result.corrections || [],
      signCount: result.correctedText.length,
    };
  } catch (e) {
    console.error('Failed to parse Claude correction response:', e);
    return {
      correctedText: text,
      corrections: [],
      signCount: text.length,
    };
  }
}
