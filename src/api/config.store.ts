/**
 * Simple in-memory store for session-specific configuration.
 * This allows keeping the frontend request payloads clean and secure.
 */

export interface SessionConfig {
  provider?: string;
  apiKey?: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
  figmaToken?: string;
}

class ConfigStore {
  private config: SessionConfig = {};

  update(newConfig: Partial<SessionConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log(`[ConfigStore] Updated configuration:`, {
      provider: this.config.provider,
      localUrl: this.config.localUrl,
      localModel: this.config.localModel,
      hasApiKey: !!this.config.apiKey,
      hasFigmaToken: !!this.config.figmaToken,
    });
  }

  get(): SessionConfig {
    return this.config;
  }

  clear() {
    this.config = {};
    console.log(`[ConfigStore] Configuration cleared`);
  }
}

export const configStore = new ConfigStore();
