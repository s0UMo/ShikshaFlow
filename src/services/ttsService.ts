class TTSService {
  public speak(_text: string, _lang?: string, _fallback?: string): Promise<void> {
    return Promise.resolve();
  }
  public stop(): void {}
  public isSpeaking(): boolean {
    return false;
  }
}

export const ttsService = new TTSService();
