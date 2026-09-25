export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export declare const isSupported: boolean;
export declare function requestPermission(): Promise<boolean>;
export declare function getPermission(): Promise<NotificationPermission>;
export interface PresentOptions {
  /** A fixed id: a later notification with the same one replaces this card instead of stacking. */
  replaceId?: string;
  /** Replace without sound or banner. */
  quiet?: boolean;
}
export declare function present(
  title: string,
  body: string,
  threadId?: string,
  channelName?: string,
  options?: PresentOptions,
): Promise<boolean>;
export declare function setBadge(count: number): Promise<boolean>;
export declare function clearDelivered(): Promise<boolean>;
