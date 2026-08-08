class TTSService {
  private synth: SpeechSynthesis | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, lang: 'hi-IN' | 'en-IN' | 'en-US' = 'hi-IN'): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        console.warn('Web Speech API is not supported in this browser.');
        resolve();
        return;
      }

      // Stop any active speech
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9; // Slightly slower pace for student clarity
      utterance.pitch = 1.0;

      // Select voice if available
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find((v) => v.lang === lang || v.lang.includes(lang.split('-')[0]));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('TTS Speech synthesis error:', err);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && this.synth.speaking);
  }
}

export const ttsService = new TTSService();
