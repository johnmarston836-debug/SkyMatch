export interface BackgroundNotificationCopy {
  title: string;
  body: string;
  stopLabel: string;
  channelName: string;
}

export declare const isSupported: boolean;
export declare function registerKeepAliveTask(): void;
export declare function start(copy: BackgroundNotificationCopy): Promise<boolean>;
export declare function stop(): Promise<void>;
export declare function isRunning(): boolean;
export declare function addStoppedListener(listener: () => void): () => void;
