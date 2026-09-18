export interface PeripheralWriteEvent {
  /** One frame, base64-encoded, exactly as the peer wrote it. */
  value: string;
  /** CoreBluetooth's identifier for the central that wrote it. */
  centralId: string;
}

export declare const isSupported: boolean;
export declare function start(serviceUUID: string, charUUID: string, localName: string): Promise<void>;
export declare function stop(): Promise<void>;
export declare function notify(base64Value: string): Promise<boolean>;
export declare function addWriteListener(listener: (event: PeripheralWriteEvent) => void): () => void;
