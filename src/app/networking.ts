export enum Events {
    ConnectionOpen,
    ConnectionError,
    ConnectionClose,
    PlayerAdd,
    PlayerPartAdd,
    PlayerRemove,
    YouAre,
    PositionUpdate,
    GameOver,
    PebbleAdd,
    PebbleRemove,
}

export interface EventPayload {}
export interface PlayerEventPayload {
    name: string,
    color?: string,
};
export interface PositionEventPayload {
    x: number,
    y: number,
};
export interface PlayerPositionEventPayload extends PositionEventPayload {
    name: string,
    t: number,
};
export interface PebblePositionEventPayload extends PositionEventPayload {
    id: number,
};
export interface PebbleEventPayload {
    id: number,
};

export interface PlayerRotationRequestPayload {
    t: number
};

type EventHandler = (payload: any) => void;

interface Client {
    on(e: Events.PlayerAdd, fn: (payload: PlayerEventPayload) => void): void,
    on(e: Events.PlayerRemove, fn: (payload: PlayerEventPayload) => void): void,
    on(e: Events.PositionUpdate, fn: (payload: PlayerPositionEventPayload) => void): void,
    on(e: Events.ConnectionClose, fn: (payload: EventPayload) => void): void,
    on(e: Events.ConnectionError, fn: (payload: EventPayload) => void): void,
    on(e: Events.ConnectionOpen, fn: (payload: EventPayload) => void): void,
    on(e: Events.GameOver, fn: (payload: EventPayload) => void): void,
    on(e: Events.PebbleAdd, fn: (payload: PebblePositionEventPayload) => void): void,
    on(e: Events.PebbleRemove, fn: (payload: PebbleEventPayload) => void): void,
    on(e: Events.YouAre, fn: (payload: PlayerEventPayload) => void): void,
    on(e: Events.PlayerPartAdd, fn: (payload: PlayerEventPayload) => void): void,

    send(positionData: PlayerRotationRequestPayload): void,
    connect(): void
}

export const createClient = (roomID: string, playerColor: string): Client => {
    const subscribers: Map<Events, EventHandler[]> = new Map<Events, EventHandler[]>();
    const triggerEventHandlers = (e: Events, payload: any) => {
        subscribers.get(e)?.forEach(handler => handler(payload));
    };

    let socket: WebSocket | null = null;

    return {
        on: (e: Events, fn: (p :any) => void) => {
            if (!subscribers.has(e)) {
                subscribers.set(e, []);
            }
            subscribers.get(e)?.push(fn);
        },
        send: (positionData) => {
            if (socket && socket.readyState === socket.OPEN) {
                socket.send(JSON.stringify(positionData));
            }
        },
        connect: () => {
            const proto = process.env.SECURE_BACKEND === "1" ? "wss" : "ws";
            socket = new WebSocket(`${proto}://${process.env.BASE_URL}/ws?rk=${roomID}&color=${playerColor.replace('#', '')}`);
        
            socket.addEventListener("open", () => {
                subscribers.get(Events.ConnectionOpen)?.forEach(handler => handler({}));
            });
        
            socket.addEventListener("error", () => {
                subscribers.get(Events.ConnectionError)?.forEach(handler => handler({}));
            });
        
            socket.addEventListener("close", () => {
                subscribers.get(Events.ConnectionClose)?.forEach(handler => handler({}));
            })
        
            socket.addEventListener("message", (msg: MessageEvent) => {
                const serverPayload = JSON.parse(msg.data);
                
                switch (serverPayload.message_type) {
                    case "youare":
                        triggerEventHandlers(Events.YouAre, {
                            name: serverPayload.player_id,
                        } as PlayerEventPayload);
                        break;
        
                    case "new_player":
                        triggerEventHandlers(Events.PlayerAdd, {
                            name: serverPayload.player_id,
                            color: serverPayload.payload.color,
                        } as PlayerEventPayload);
                        break;
        
                    case "pos":
                        triggerEventHandlers(Events.PositionUpdate, {
                            name: serverPayload.player_id,
                            x: serverPayload.x,
                            y: serverPayload.y,
                            t: serverPayload.t,
                        } as PlayerPositionEventPayload);
                        break;
        
                    case "game_over":
                        triggerEventHandlers(Events.GameOver, {});
                        break;
        
                    case "pebble":
                        triggerEventHandlers(Events.PebbleAdd, {
                            id: serverPayload.resource_id,
                            x: serverPayload.x,
                            y: serverPayload.y,
                        } as PebblePositionEventPayload);
                        break;
        
                    case "pebble-remove":
                        triggerEventHandlers(Events.PebbleRemove, {
                            id: serverPayload.resource_id,
                        } as PebbleEventPayload);
                        break;
        
                    case "add_part":
                        triggerEventHandlers(Events.PlayerPartAdd, {
                            name: serverPayload.player_id,
                        } as PlayerEventPayload);
                        break;
        
                    case "disconnect":
                        triggerEventHandlers(Events.PlayerRemove, {
                            name: serverPayload.player_id,
                        } as PlayerEventPayload);
                        break;
                }
            });
        },
    }
};