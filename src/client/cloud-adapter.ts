import { SearchResult } from '../types/index.js';

export interface CloudAdapterOptions {
  provider: 'openai' | 'gemini' | 'anthropic' | 'custom';
  endpoint?: string;
  model?: string;
  apiKey?: string;
}

export async function queryCloudAPI(
  query: string,
  searchResults: SearchResult[],
  options: CloudAdapterOptions
): Promise<string> {
  const provider = options.provider;
  
  // Retrieve API key from local storage first (user configuration), fall back to build-time config
  const apiKey = (typeof window !== 'undefined' 
    ? window.localStorage.getItem(`depthindex_api_key_${provider}`) 
    : null) || options.apiKey || '';

  if (!apiKey && provider !== 'custom') {
    throw new Error(`API key for ${provider} is missing. Please add it in settings.`);
  }

  // Format context text from search results
  const contextText = searchResults
    .map((r, idx) => `[Source ${idx + 1}: ${r.chunk.pageTitle} > ${r.chunk.heading}]\n${r.chunk.content}`)
    .join('\n\n');

  const systemPrompt = `You are a documentation assistant. Answer the user's question accurately using only the provided context. If the answer cannot be found in the context, say that you don't know based on the docs.
Use markdown for formatting. Do not invent facts. Cite your sources using [Source 1], [Source 2], etc.

Context:
${contextText}`;

  switch (provider) {
    case 'openai':
      return callOpenAI(query, systemPrompt, apiKey, options.endpoint, options.model || 'gpt-4o-mini');
    case 'gemini':
      return callGemini(query, systemPrompt, apiKey, options.endpoint, options.model || 'gemini-1.5-flash');
    case 'anthropic':
      return callAnthropic(query, systemPrompt, apiKey, options.endpoint, options.model || 'claude-3-5-sonnet-20241022');
    case 'custom':
      return callCustom(query, systemPrompt, apiKey, options.endpoint);
    default:
      throw new Error(`Unsupported cloud provider: ${provider}`);
  }
}

async function callOpenAI(
  query: string,
  systemPrompt: string,
  apiKey: string,
  endpoint?: string,
  model: string = 'gpt-4o-mini'
): Promise<string> {
  const url = endpoint || 'https://api.openai.com/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated.';
}

async function callGemini(
  query: string,
  systemPrompt: string,
  apiKey: string,
  endpoint?: string,
  model: string = 'gemini-1.5-flash'
): Promise<string> {
  const url = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${query}` }]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
}

async function callAnthropic(
  query: string,
  systemPrompt: string,
  apiKey: string,
  endpoint?: string,
  model: string = 'claude-3-5-sonnet-20241022'
): Promise<string> {
  const url = endpoint || 'https://api.anthropic.com/v1/messages';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'dangerously-allow-browser': 'true' // enable CORS/browser fetches
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: query }],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || 'No response generated.';
}

async function callCustom(
  query: string,
  systemPrompt: string,
  apiKey?: string,
  endpoint?: string
): Promise<string> {
  if (!endpoint) {
    throw new Error('Custom provider endpoint must be configured.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt: `${systemPrompt}\n\nQuestion: ${query}`,
      query,
      systemPrompt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Custom API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  // Try common JSON response structures
  return data.choices?.[0]?.message?.content || 
         data.candidates?.[0]?.content?.parts?.[0]?.text || 
         data.content || 
         data.response || 
         JSON.stringify(data);
}
