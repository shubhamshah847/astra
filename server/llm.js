// All AI code lives in this one file.
// Choose your AI provider in server/.env with LLM_PROVIDER.

export const CATEGORIES = [
  'Aerospace',
  'Naval',
  'Land Systems',
  'Cybersecurity',
  'Space',
  'AI/Robotics',
  'Defence Technology',
];

const PROVIDER = (process.env.LLM_PROVIDER || 'gemini').toLowerCase();

// Make sure a setting exists in .env, or show a clear error
function needEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing. Add it to server/.env`);
  }
  return value;
}

// Send a web request and return the JSON answer. Throw a clear error if it fails.
async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data.error && (data.error.message || data.error)) || 'AI request failed';
    const error = new Error(typeof message === 'string' ? message : JSON.stringify(message));
    error.status = res.status;
    throw error;
  }
  return data;
}

// ---------- One small function for each provider ----------

// Google Gemini
async function askGemini(systemPrompt, userText, maxTokens) {
  const key = needEnv('GEMINI_API_KEY');
  const model = process.env.LLM_MODEL || 'gemini-2.5-flash';
  let data;
  try {
    data = await postJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      { 'x-goog-api-key': key },
      {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        // Gemini "thinking" also uses tokens, so we allow extra room
        generationConfig: { maxOutputTokens: maxTokens * 3 },
      }
    );
  } catch (error) {
    if (error.status === 401) {
      throw new Error('Google rejected GEMINI_API_KEY (401). Use a Gemini API key from Google AI Studio; OAuth access tokens and OAuth client credentials are not accepted here.');
    }
    throw error;
  }
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content?.parts) || [];
  return parts.map((p) => p.text || '').join('');
}

// Anthropic Claude
async function askClaude(systemPrompt, userText, maxTokens) {
  const key = needEnv('ANTHROPIC_API_KEY');
  const model = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';
  const data = await postJson(
    'https://api.anthropic.com/v1/messages',
    { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    {
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    }
  );
  return (data.content || [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

// Groq, OpenAI, OpenRouter (they all use the same format)
async function askOpenAICompatible(systemPrompt, userText, maxTokens) {
  const key = needEnv('LLM_API_KEY');
  const baseUrl = needEnv('LLM_BASE_URL');
  const model = needEnv('LLM_MODEL');
  const data = await postJson(
    `${baseUrl}/chat/completions`,
    { Authorization: `Bearer ${key}` },
    {
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
    }
  );
  return (data.choices && data.choices[0] && data.choices[0].message?.content) || '';
}

// Pick the right provider
async function askAI(systemPrompt, userText, maxTokens) {
  if (PROVIDER === 'gemini') return askGemini(systemPrompt, userText, maxTokens);
  if (PROVIDER === 'anthropic') return askClaude(systemPrompt, userText, maxTokens);
  if (PROVIDER === 'openai') return askOpenAICompatible(systemPrompt, userText, maxTokens);
  throw new Error('LLM_PROVIDER must be gemini, anthropic or openai');
}

// ---------- The features (same for every provider) ----------

// Turn anything into a clean list of short strings
function cleanList(list, max) {
  if (!Array.isArray(list)) return [];
  return list
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .slice(0, max);
}

// FEATURE 1: read an article and return category, summary, keywords, entities
export async function analyzeArticle(title, body) {
  const systemPrompt = `You are a defence-technology news analyst.
Read the article and reply with ONLY a JSON object. No extra words, no markdown.
Use exactly this shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "summary": "2 or 3 short sentences. Use only facts from the article.",
  "keywords": ["up to 6 keywords"],
  "entities": {
    "orgs": ["organisations or agencies mentioned"],
    "equipment": ["weapons, vehicles, systems mentioned"],
    "countries": ["countries mentioned"]
  }
}`;

  const text = await askAI(systemPrompt, `Title: ${title}\n\n${body.slice(0, 6000)}`, 700);

  // Find the JSON part in the answer
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('AI did not return JSON');
  }

  let data;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch (err) {
    throw new Error('AI returned broken JSON');
  }

  const summary = String(data.summary || '').trim();
  if (!summary) {
    throw new Error('AI returned an empty summary');
  }

  const entities = data.entities || {};
  return {
    // If the AI invents a new category, use the safe default
    category: CATEGORIES.includes(data.category) ? data.category : 'Defence Technology',
    summary,
    keywords: cleanList(data.keywords, 6),
    entities: {
      orgs: cleanList(entities.orgs, 8),
      equipment: cleanList(entities.equipment, 8),
      countries: cleanList(entities.countries, 8),
    },
  };
}

// FEATURE 2 (new): write an "ASTRA Intelligence Brief" from saved articles
export async function generateBrief(topic, articles) {
  const systemPrompt = `You write "ASTRA Intelligence Briefs".
Use ONLY the numbered articles given to you. Never add outside facts.
Write plain text. Do not use markdown symbols like ** or #.
Use exactly this format:

TOPIC: (the topic)
OVERVIEW: (2 or 3 sentences)
KEY DEVELOPMENTS:
1. (one development) - (date) [article number]
2. (another development) - (date) [article number]
KEY TOPICS: (main themes from the articles)
KEY ENTITIES: (organisations, equipment and countries from the articles)
ASSESSMENT: (1 or 2 sentences, based only on the articles)`;

  const articleText = articles
    .map((a, index) => {
      const date = new Date(a.publishedAt).toDateString();
      return `[${index + 1}] ${a.title} (${a.category}, ${date})\nSummary: ${a.summary}\nDetails: ${a.body.slice(0, 800)}`;
    })
    .join('\n\n');

  return askAI(systemPrompt, `Topic: ${topic}\n\nArticles:\n${articleText}`, 900);
}