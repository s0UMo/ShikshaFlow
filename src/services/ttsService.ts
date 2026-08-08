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

  public speak(
    text: string, 
    lang: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN',
    phoneticFallbackText?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      // Stop any active audio/speech first
      this.stop();

      if (!text || text.trim().length === 0) {
        resolve();
        return;
      }

      this.loadVoices();

      const matchedHindiVoice = this.voices.find(
        (v) => v.lang.toLowerCase().startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('kalpana') || v.name.toLowerCase().includes('hemant')
      );

      // 1. If Hindi mode and native Hindi voice is installed on OS
      if (lang.startsWith('hi') && this.synth && matchedHindiVoice) {
        if (this.synth.paused) {
          this.synth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'hi-IN';
        utterance.voice = matchedHindiVoice;
        utterance.rate = 0.85;

        utterance.onend = () => resolve();
        utterance.onerror = () => {
          this.fallbackAudioTTS(text, 'hi').then(resolve);
        };

        this.synth.speak(utterance);
        return;
      }

      // 2. If Hindi mode but NO native Hindi voice is installed on Windows:
      // Use phonetic Hinglish text ("Yadi 4 barabar bhagon...") so English voice pronounces the full Hindi sentence!
      if (lang.startsWith('hi') && phoneticFallbackText && this.synth) {
        if (this.synth.paused) {
          this.synth.resume();
        }

        const utterance = new SpeechSynthesisUtterance(phoneticFallbackText);
        utterance.lang = 'en-IN';
        utterance.rate = 0.85;

        // Try using an Indian English or general English voice
        const indianEnVoice = this.voices.find((v) => v.lang.includes('en-IN') || v.name.includes('India'));
        if (indianEnVoice) {
          utterance.voice = indianEnVoice;
        }

        utterance.onend = () => resolve();
        utterance.onerror = () => {
          this.fallbackAudioTTS(phoneticFallbackText, 'hi').then(resolve);
        };

        this.synth.speak(utterance);
        return;
      }

      // 3. Google Translate TTS audio fallback endpoint
      const speechText = (lang.startsWith('hi') && phoneticFallbackText) ? phoneticFallbackText : text;
      this.fallbackAudioTTS(speechText, lang.startsWith('hi') ? 'hi' : 'en').then(resolve);
    });
  }

  private fallbackAudioTTS(text: string, lang: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const encodedText = encodeURIComponent(text.slice(0, 200));
        const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;

        const audio = new Audio(audioUrl);
        this.currentAudio = audio;
        audio.playbackRate = 0.9;

        audio.onended = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.onerror = () => {
          this.currentAudio = null;
          resolve();
        };

        audio.play().catch((err) => {
          console.warn('Audio play error:', err);
          resolve();
        });
      } catch (err) {
        console.warn('Audio fallback error:', err);
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
