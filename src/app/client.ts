import * as PIXI from "pixi.js";
import { Player } from "./player";

interface IServerMessage {
    message_type: string,
    resource_id?: number,
    player_id?: string,
    x?: number,
    y?: number
}

const pebbleMap = new Map<number, PIXI.Container>();

export const start = (
    roomID: string,
    pebbleRootContainer: PIXI.Container,
    setMainPlayerName: (name: string) => void,
    setPlayerPosition: (name: string, x: number, y: number) => void,
    addSnakePart: (name: string) => void,
    onDisconnect: (name: string) => void,
    gameOver: () => void,
): WebSocket => {
    const socket = new WebSocket(`ws://${process.env.BASE_URL}/ws?rk=${roomID}`);
    
    socket.addEventListener("open", () => {
        console.log("connection is open");
    });

    socket.addEventListener("message", (msg: MessageEvent) => {
        const {message_type, x, y, resource_id, player_id}: IServerMessage = JSON.parse(msg.data);
        
        switch (message_type) {
            case "youare":
                setMainPlayerName(player_id as string);
                break;

            case "pos":
                setPlayerPosition(player_id as string, x as number, y as number);
                break;

            case "game_over":
                gameOver();
            
            case "pebble":
                const pebbleContainer = new PIXI.Container()

                const bubbleURL = new URL(
                    '/assets/Pebble.png?width=64',
                    import.meta.url
                );
                const bubbleSprite = PIXI.Sprite.from(bubbleURL.toString());
                bubbleSprite.rotation = Math.PI / 2;
                bubbleSprite.position.set(64, 0);
                pebbleContainer.addChild(bubbleSprite);
                pebbleContainer.position.set(x, y);

                pebbleRootContainer.addChild(pebbleContainer);
                pebbleMap.set(resource_id as number, pebbleContainer);
                break;

            case "pebble-remove":
                if (pebbleMap.has(resource_id as number)) {
                    pebbleRootContainer.removeChild(pebbleMap.get(resource_id as number) as PIXI.Container);
                }
                break;

            case "add_part":
                addSnakePart(player_id as string);
                break;

            case "disconnect":
                onDisconnect(player_id as string);
                console.log("got a dc from", player_id);
                break;
        }
    });

    return socket;
};