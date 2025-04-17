/**
 * Type declarations for negotiator module
 */
declare module 'negotiator' {
  interface NegotiatorOptions {
    request: {
      headers: Record<string, string | string[] | undefined>;
    };
  }

  class Negotiator {
    constructor(options?: NegotiatorOptions);
    constructor(request: any);
    
    charset(availableCharsets?: string[]): string | undefined;
    charsets(availableCharsets?: string[]): string[];
    encoding(availableEncodings?: string[]): string | undefined;
    encodings(availableEncodings?: string[]): string[];
    language(availableLanguages?: string[]): string | undefined;
    languages(availableLanguages?: string[]): string[];
    mediaType(availableMediaTypes?: string[]): string | undefined;
    mediaTypes(availableMediaTypes?: string[]): string[];
  }

  export = Negotiator;
}
