/**
 * Sanitizes math symbols, fractions, and units into natural spoken words
 * so Web Speech API and Audio TTS engines produce clear, understandable speech.
 */
function sanitizeForSpeech(text: string, lang: 'hi' | 'en'): string {
  let clean = text;

  if (lang === 'hi') {
    clean = clean
      .replace(/1\/2/g, ' आधा ')
      .replace(/1\/4/g, ' एक चौथाई ')
      .replace(/3\/4/g, ' तीन चौथाई ')
      .replace(/1\/3/g, ' एक तिहाई ')
      .replace(/2\/3/g, ' दो तिहाई ')
      .replace(/2\/5/g, ' दो बटा पांच ')
      .replace(/1\/5/g, ' एक बटा पांच ')
      .replace(/3\/5/g, ' तीन बटा पांच ')
      .replace(/4\/5/g, ' चार बटा पांच ')
      .replace(/1\/6/g, ' एक बटा छह ')
      .replace(/2\/6/g, ' दो बटा छह ')
      .replace(/3\/6/g, ' तीन बटा छह ')
      .replace(/7\/3/g, ' सात बटा तीन ')
      .replace(/3\/10/g, ' तीन बटा दस ')
      .replace(/11\/15/g, ' ग्यारह बटा पंद्रह ')
      .replace(/7\/15/g, ' सात बटा पंद्रह ')
      .replace(/6\/20/g, ' छह बटा बीस ')
      .replace(/3\/20/g, ' तीन बटा बीस ')
      .replace(/8\/12/g, ' आठ बटा बारह ')
      .replace(/2:3/g, ' दो अनुपात तीन ')
      .replace(/3:4/g, ' तीन अनुपात चार ')
      .replace(/5:2/g, ' पांच अनुपात दो ')
      .replace(/4:8/g, ' चार अनुपात आठ ')
      .replace(/10:15/g, ' दस अनुपात पंद्रह ')
      .replace(/₹\s*(\d+)/g, ' $1 रुपये ')
      .replace(/₹/g, ' रुपये ')
      .replace(/(\d+)\s*cm²/g, ' $1 वर्ग सेंटीमीटर ')
      .replace(/(\d+)\s*cm/g, ' $1 सेंटीमीटर ')
      .replace(/(\d+)\s*km\/h/g, ' $1 किलोमीटर प्रति घंटा ')
      .replace(/(\d+)\s*km/g, ' $1 किलोमीटर ')
      .replace(/(\d+)\s*g\b/g, ' $1 ग्राम ')
      .replace(/(\d+)°/g, ' $1 डिग्री ')
      .replace(/\+/g, ' जमा ')
      .replace(/\-/g, ' घटाव ')
      .replace(/×/g, ' गुणा ')
      .replace(/÷/g, ' भाग ')
      .replace(/=/g, ' बराबर ');
  } else {
    clean = clean
      .replace(/1\/2/g, ' one half ')
      .replace(/1\/4/g, ' one fourth ')
      .replace(/3\/4/g, ' three fourths ')
      .replace(/1\/3/g, ' one third ')
      .replace(/2\/3/g, ' two thirds ')
      .replace(/2\/5/g, ' two fifths ')
      .replace(/1\/5/g, ' one fifth ')
      .replace(/3\/5/g, ' three fifths ')
      .replace(/4\/5/g, ' four fifths ')
      .replace(/1\/6/g, ' one sixth ')
      .replace(/2\/6/g, ' two sixths ')
      .replace(/7\/3/g, ' seven thirds ')
      .replace(/2:3/g, ' two to three ')
      .replace(/3:4/g, ' three to four ')
      .replace(/5:2/g, ' five to two ')
      .replace(/₹\s*(\d+)/g, ' $1 rupees ')
      .replace(/₹/g, ' rupees ')
      .replace(/(\d+)\s*cm²/g, ' $1 square centimeters ')
      .replace(/(\d+)\s*cm/g, ' $1 centimeters ')
      .replace(/(\d+)\s*km\/h/g, ' $1 kilometers per hour ')
      .replace(/(\d+)\s*km/g, ' $1 kilometers ')
      .replace(/(\d+)\s*g\b/g, ' $1 grams ')
      .replace(/(\d+)°/g, ' $1 degrees ')
      .replace(/\+/g, ' plus ')
      .replace(/\-/g, ' minus ')
      .replace(/×/g, ' times ')
      .replace(/÷/g, ' divided by ')
      .replace(/=/g, ' equals ');
  }

  return clean.replace(/\s+/g, ' ').trim();
}

class TTSService {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];

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
    _phoneticFallbackText?: string
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stop();

      if (!text || text.trim().length === 0) {
        resolve();
        return;
      }

      this.loadVoices();

      const isHindi = lang.startsWith('hi');
      const spokenText = sanitizeForSpeech(text, isHindi ? 'hi' : 'en');

      if (!this.synth) {
        console.warn('Speech synthesis not supported.');
        resolve();
        return;
      }

      if (this.synth.paused) {
        this.synth.resume();
      }

      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.lang = lang;
      utterance.rate = 0.9; // Calm, clear learning speed
      utterance.pitch = 1.0;

      // Select highest quality voice available
      const preferredVoice = this.voices.find((v) => {
        const vName = v.name.toLowerCase();
        const vLang = v.lang.toLowerCase();
        if (isHindi) {
          return (vLang.includes('hi') || vName.includes('hindi') || vName.includes('kalpana') || vName.includes('swara') || vName.includes('hemant')) && (vName.includes('natural') || vName.includes('online') || vName.includes('google'));
        } else {
          return (vLang.includes('en-in') || vLang.includes('en-us') || vName.includes('india')) && (vName.includes('natural') || vName.includes('online') || vName.includes('google'));
        }
      }) || this.voices.find((v) => {
        const vLang = v.lang.toLowerCase();
        return isHindi ? vLang.includes('hi') : vLang.includes('en');
      });

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (err) => {
        console.warn('Speech synthesis error:', err);
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  public stop(): void {
    if (this.synth) {
      if (this.synth.speaking || this.synth.pending) {
        this.synth.cancel();
      }
    }
  }

  public isSpeaking(): boolean {
    return !!(this.synth && (this.synth.speaking || this.synth.pending));
  }
}

export const ttsService = new TTSService();
