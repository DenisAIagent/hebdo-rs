import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '../utils/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 120_000, // 2 minutes max
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

MISE EN PAGE :
- CONSERVE IMPERATIVEMENT tous les sauts de ligne (\\n) et la structure en paragraphes du texte original.
- Ne fusionne JAMAIS deux paragraphes. Ne supprime JAMAIS de saut de ligne.
- Chaque paragraphe du texte original doit rester un paragraphe separe dans le texte corrige.

STYLE ET TON :
- Ne modifie PAS le sens ni le ton du texte. Corrige uniquement les erreurs et applique le formatage editorial.
- Les ponctuations expressives (?!, !?, ?!?, etc.) sont volontaires et font partie du style journalistique Rolling Stone. NE LES CORRIGE PAS. Exemples : "enfin de retour en France ?!" est correct, "c'est vraiment ca ?!" est correct.
- Respecte le registre de langue du journaliste : familier, oral, exclamatif — c'est le style Rolling Stone, pas une erreur.

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

// Unique marker that Claude won't touch — replaced back after correction
const PARAGRAPH_MARKER = '¶¶BREAK¶¶';

export async function correctText(text: string): Promise<CorrectionResult> {
  const promptText = await getPromptFromDB();

  // Replace newlines with unique markers so Claude preserves paragraph structure
  const markedText = text
    .replace(/\n\n+/g, `\n${PARAGRAPH_MARKER}\n`)  // double+ newlines → marker
    .replace(/\n/g, `\n${PARAGRAPH_MARKER}\n`);      // single newlines → marker

  // Actually, simpler: split into paragraphs, number them, send with clear structure
  const paragraphs = text.split(/\n/);
  const numberedText = paragraphs
    .map((p, i) => p.trim() === '' ? `[LIGNE_VIDE_${i}]` : p)
    .join('\n');

  const systemPrompt = `${promptText}

REGLE ABSOLUE SUR LES SAUTS DE LIGNE :
Le texte contient des marqueurs [LIGNE_VIDE_X] qui representent des lignes vides (sauts de paragraphe). Tu DOIS les conserver EXACTEMENT tels quels dans correctedText, a leur position d'origine. Chaque ligne du texte original doit rester sur sa propre ligne dans correctedText. Ne fusionne JAMAIS deux lignes.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16384,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `<text_to_correct>\n${numberedText}\n</text_to_correct>`,
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

    // Restore empty line markers back to actual newlines
    let corrected: string = result.correctedText;
    corrected = corrected.replace(/\[LIGNE_VIDE_\d+\]/g, '');

    // Safety: if Claude somehow stripped all newlines, re-inject paragraph structure
    const originalNewlines = (text.match(/\n/g) || []).length;
    const correctedNewlines = (corrected.match(/\n/g) || []).length;

    if (originalNewlines > 3 && correctedNewlines < originalNewlines * 0.5) {
      // Claude butchered the formatting — use paragraph-by-paragraph correction
      console.warn(`[Claude] Newlines lost: original=${originalNewlines}, corrected=${correctedNewlines}. Using original structure.`);
      // Split original into paragraphs and try to map corrected text back
      // Fallback: use corrected text but re-inject original paragraph breaks
      const origParagraphs = text.split(/\n\n+/);
      const corrParagraphs = corrected.split(/\n\n+/);

      if (corrParagraphs.length >= origParagraphs.length * 0.5) {
        corrected = corrParagraphs.join('\n\n');
      } else {
        // Last resort: apply corrections but keep original structure
        corrected = text;
        for (const c of (result.corrections || [])) {
          if (c.original && c.corrected) {
            corrected = corrected.replace(c.original, c.corrected);
          }
        }
      }
    }

    return {
      correctedText: corrected,
      corrections: result.corrections || [],
      signCount: corrected.length,
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
