import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../utils/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Hardcoded fallback prompt in case DB is unavailable
const FALLBACK_PROMPT = `Tu es correcteur professionnel pour Rolling Stone France (magazine hebdomadaire).

Corrige le texte suivant en respectant ces regles :

ORTHOGRAPHE & GRAMMAIRE :
- Orthographe francaise impeccable
- Grammaire et syntaxe correctes
- Verification des noms propres (artistes, lieux, labels, producteurs) — corrige les erreurs d'orthographe sur les noms connus

PONCTUATION & TYPOGRAPHIE :
- Guillemets francais (\u00ab \u00bb) avec espaces insecables
- Espaces insecables avant : ; ! ? et apres \u00ab
- Tirets cadratins pour les incises

CONVENTIONS EDITORIALES ROLLING STONE :
- Noms d'albums en italique : <em>Nom de l'album</em>
- Noms de singles/chansons entre guillemets : \u00ab Nom du single \u00bb
- Citations en italique : <em>citation</em>
- Noms propres avec majuscules correctes
- Style journalistique Rolling Stone (dynamique, precis, pas de jargon inutile)

IMPORTANT : Ne modifie PAS le sens ni le ton du texte. Corrige uniquement les erreurs et applique le formatage editorial.

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

Si le texte est parfait, renvoie correctedText identique et corrections vide.`;

async function getPromptFromDB(): Promise<string> {
  try {
    const { data, error } = await supabaseAdmin
      .from('correction_prompt')
      .select('prompt_text')
      .limit(1)
      .single();

    if (error || !data?.prompt_text) {
      console.warn('Failed to fetch prompt from DB, using fallback:', error?.message);
      return FALLBACK_PROMPT;
    }

    return data.prompt_text;
  } catch (e) {
    console.warn('Error fetching prompt from DB, using fallback:', e);
    return FALLBACK_PROMPT;
  }
}

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
  const promptText = await getPromptFromDB();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: `${promptText}

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
