class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (this.synth) {
      this.voices = this.synth.getVoices();
    }
  }

  public speak(text: string, lang: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN'): Promise<void> {
    return new Promise((resolve) => {
      // Stop any playing speech/audio first
      this.stop();

      if (!text || text.trim().length === 0) {
        resolve();
        return;
      }

      // Ensure voices are loaded
      this.loadVoices();

      // Check if browser has a native matching voice for Hindi/English
      const langPrefix = lang.split('-')[0].toLowerCase();
      const matchedVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith(langPrefix) || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india')
      );

      // 1. Primary path: Use Native Web Speech API if supported & matching voice exists
      if (this.synth && matchedVoice) {
        // Fix for Chrome bug where synthesis gets stuck in paused state
        if (this.synth.paused) {
          this.synth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.voice = matchedVoice;
        utterance.rate = 0.85; // Natural pace for learning
        utterance.pitch = 1.0;

        utterance.onend = () => {
          resolve();
        };

        utterance.onerror = (err) => {
          console.warn('Native Web Speech error, falling back to Audio TTS:', err);
          this.fallbackAudioTTS(text, lang).then(resolve);
        };

        this.synth.speak(utterance);
        return;
      }

      // 2. Fallback path: HTML5 Audio endpoint for guaranteed Hindi speech playback
      this.fallbackAudioTTS(text, lang).then(resolve);
    });
  }

  private fallbackAudioTTS(text: string, lang: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const langCode = lang.startsWith('hi') ? 'hi' : 'en';
        // Truncate long string to avoid URL max length for single sentence
        const encodedText = encodeURIComponent(text.slice(0, 200));
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.playbackRate = 0.9;

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          console.warn('Audio fallback playback error.');
          this.currentAudio = null;
          // As last resort, try generic browser utterance
          if (this.synth) {
            const genericUtterance = new SpeechSynthesisUtterance(text);
            genericUtterance.lang = lang;
            genericUtterance.onend = () => resolve();
            genericUtterance.onerror = () => resolve();
            this.synth.speak(genericUtterance);
          } else {
            resolve();
          }
        };

        audio.play().catch((err) => {
          console.warn('Audio autoplay blocked or failed:', err);
          resolve();
        });
      } catch (err) {
        console.warn('Fallback audio creation failed:', err);
        resolve();
      }
    });
  }

  public stop(): void {
    if (this.synth) {
      if (this.synth.speaking || this.synth.pending) {
        this.synth.cancel();
      }
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  public isSpeaking(): boolean {
    const isSynthSpeaking = !!(this.synth && (this.synth.speaking || this.synth.pending));
    const isAudioPlaying = !!(this.currentAudio && !this.currentAudio.paused);
    return isSynthSpeaking || isAudioPlaying;
  }
}

export const ttsService = new TTSService();
