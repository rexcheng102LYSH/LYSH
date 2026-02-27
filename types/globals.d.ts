declare const io: (url: string, options?: unknown) => any;
declare const GameState: Record<string, unknown>;
declare const OnlineGame: {
    handleDisconnect?: (reason: string) => void;
    roomId?: string | null;
};
declare const OnlineUI: Record<string, unknown>;

interface SocketClientLike {
    connected?: boolean;
    connect?: () => Promise<void>;
    disconnect?: () => void;
    emit?: (event: string, data?: unknown) => boolean;
    on?: (event: string, callback: (payload: unknown) => void) => void;
    off?: (event: string, callback?: (payload: unknown) => void) => void;
    getId?: () => string | null;
}

interface Window {
    __FORCE_LOCAL?: boolean;
    GAME_SERVER_URL?: string;
    SocketClient?: SocketClientLike;
    GameState?: typeof GameState;
    OnlineGame?: typeof OnlineGame;
    OnlineUI?: typeof OnlineUI;
    NetworkConfig?: {
        serverUrl: string;
        reconnectAttempts: number;
        reconnectDelay: number;
        connectionTimeout: number;
    };
    LYSH_DIAGNOSTICS?: {
        newTraceId?: (prefix?: string) => string;
        captureClientError?: (kind: string, message: string, extra?: unknown) => void;
        reportNetwork?: (direction: string, event: string, traceId?: string | null, detail?: unknown) => void;
        reportStateWarning?: (prop: string, reason: string, value: unknown) => void;
        getRecentLogs?: (limit?: number) => unknown[];
    };
}
