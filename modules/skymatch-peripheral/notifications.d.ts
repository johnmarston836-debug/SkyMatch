export type NotificationPermission = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export declare const isSupported: boolean;
export declare function requestPermission(): Promise<boolean>;
export declare function getPermission(): Promise<NotificationPermission>;
export declare function present(title: string, body: string, threadId?: string): Promise<boolean>;
export declare function setBadge(count: number): Promise<boolean>;
export declare function clearDelivered(): Promise<boolean>;
