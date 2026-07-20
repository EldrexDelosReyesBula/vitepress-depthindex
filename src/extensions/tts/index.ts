import { PluginManifest, PluginHooks, PluginContext } from '../../sdk/index.js';

export interface TTSPluginConfig {
  /** TTS provider */
  provider: 'browser' | 'elevenlabs' | 'google' | 'azure' | 'piper' | 'custom';
  
  /** API key (for paid providers) */
  apiKey?: string;
  
  /** Custom endpoint (for self-hosted TTS like Piper) */
  endpoint?: string;
  
  /** Default voice */
  voice?: string;
  
  /** Language mapping */
  languageVoices?: Record<string, string>;
  
  /** Speed (0.25 - 4.0) */
  speed?: number;
  
  /** Pitch (0.5 - 2.0) */
  pitch?: number;
  
  /** Auto-play responses */
  autoPlay?: boolean;
  
  /** Show play button on each message */
  showPlayButton?: boolean;
}

export default function TTSExtension(config: TTSPluginConfig) {
  const manifest: PluginManifest = {
    id: 'text-to-speech',
    name: 'Text-to-Speech',
    version: '1.0.0',
    description: 'Adds text-to-speech to DepthIndex AI responses using free or paid TTS providers.',
    author: { name: 'Community Contributor' },
    permissions: [] as any[], // No direct sdk permission required, or fits standard
    minDepthIndexVersion: '1.2.0',
    dataDisclosure: {
      collectsData: config.provider !== 'browser',
      collectedData: config.provider !== 'browser' ? ['ai_response_text'] : [],
      storageLocation: config.provider !== 'browser' ? 'external' : 'local',
      externalEndpoints: config.provider !== 'browser' 
        ? [config.endpoint || `https://api.${config.provider}.com`] 
        : [],
      thirdPartySharing: config.provider !== 'browser',
      privacyPolicyUrl: '/privacy',
    },
    compliance: {
      gdpr: true,
      ccpa: true,
      phDataPrivacy: true,
      piiHandling: 'none',
      securityMeasures: [
        'Browser TTS: all processing local',
        'External TTS: only AI response text sent (no user data)',
        'API keys stored in browser localStorage only',
      ],
    },
  };
  
  const hooks: PluginHooks = {
    async onAfterRender(element: HTMLElement, context: PluginContext) {
      // Add play buttons to assistant messages
      const messages = element.querySelectorAll('.di-msg--assistant, .message-wrapper.assistant');
      
      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i] as HTMLElement;
        // Skip if already has button
        if (msg.querySelector('.di-tts-play')) continue;
        
        const playBtn = createPlayButton(config, context);
        msg.appendChild(playBtn);
      }
      
      context.logger.info('TTS play buttons added');
    },
    
    async onDestroy(context: PluginContext) {
      // Stop any playing audio
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      context.logger.info('TTS cleaned up');
    },
  };
  
  return { manifest, hooks };
}

function createPlayButton(config: TTSPluginConfig, context: PluginContext): HTMLElement {
  const btn = document.createElement('button');
  btn.className = 'di-tts-play';
  btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  btn.title = 'Read aloud';
  
  let isPlaying = false;
  
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    
    const assistantMsg = btn.closest('.di-msg--assistant, .message-wrapper.assistant');
    const messageContent = assistantMsg
      ?.querySelector('.di-msg-content, .message-content')?.textContent || '';
    
    if (!messageContent) return;
    
    if (isPlaying) {
      stopSpeaking();
      isPlaying = false;
      btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
      return;
    }
    
    isPlaying = true;
    btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    
    await speak(messageContent, config, context);
    
    isPlaying = false;
    btn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
  });
  
  return btn;
}

async function speak(
  text: string, 
  config: TTSPluginConfig, 
  context: PluginContext
): Promise<void> {
  // Strip markdown for cleaner speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[\^?\d+\]/g, '')       // Remove citations
    .replace(/[*_~`#>\-|]/g, '')      // Remove formatting chars
    .replace(/\n+/g, '. ')            // Newlines to pauses
    .trim();
  
  switch (config.provider) {
    case 'browser':
      return browserTTS(cleanText, config, context);
    case 'elevenlabs':
      return elevenLabsTTS(cleanText, config, context);
    case 'custom':
      return customTTS(cleanText, config, context);
    default:
      return browserTTS(cleanText, config, context);
  }
}

/**
 * FREE: Browser built-in SpeechSynthesis API
 * Supports community languages via lang attribute
 */
function browserTTS(
  text: string, 
  config: TTSPluginConfig, 
  context: PluginContext
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resolve();
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Auto-detect language from current DepthIndex language
    const lang = context.i18n.getCurrentLanguage();
    utterance.lang = lang;
    
    // Use community language voice if available
    const voices = window.speechSynthesis.getVoices();
    const langVoice = voices.find(v => v.lang.startsWith(lang));
    if (langVoice) utterance.voice = langVoice;
    if (config.voice) {
      const customVoice = voices.find(v => v.name === config.voice);
      if (customVoice) utterance.voice = customVoice;
    }
    
    utterance.rate = config.speed || 1.0;
    utterance.pitch = config.pitch || 1.0;
    
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    
    window.speechSynthesis.speak(utterance);
  });
}

function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

async function elevenLabsTTS(
  text: string, 
  config: TTSPluginConfig, 
  context: PluginContext
): Promise<void> {
  if (!config.apiKey) {
    context.logger.warn('ElevenLabs API key not configured');
    return browserTTS(text, config, context);
  }
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${config.voice || '21m00Tcm4TlvDq8ikWAM'}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': config.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: config.speed || 1.0,
          },
        }),
      }
    );
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return;
    }
    
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.play();
    });
  } catch (error) {
    context.logger.error('ElevenLabs TTS failed:', error);
    return browserTTS(text, config, context);
  }
}

async function customTTS(
  text: string, 
  config: TTSPluginConfig, 
  context: PluginContext
): Promise<void> {
  if (!config.endpoint) {
    return browserTTS(text, config, context);
  }
  
  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speed: config.speed }),
    });
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    
    if (typeof window === 'undefined' || typeof Audio === 'undefined') {
      return;
    }
    
    const audio = new Audio(audioUrl);
    
    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        resolve();
      };
      audio.play();
    });
  } catch (error) {
    context.logger.error('Custom TTS failed:', error);
    return browserTTS(text, config, context);
  }
}
