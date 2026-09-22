export declare const isSupported: boolean;
/** Scales a base64 JPEG to `maxSide` at `quality` (0..1); null when it can't. */
export declare function resize(base64: string, maxSide: number, quality: number): Promise<string | null>;
