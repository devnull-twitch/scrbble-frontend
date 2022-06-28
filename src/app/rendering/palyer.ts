import { debug } from "console";
import * as PIXI from "pixi.js";
import { Graphics } from "../graphics";
import { Coord, createPart, SnakePart } from "./part";

export interface PlayerRenderer {
    playerRoot: PIXI.Container,
    addPart: () => void;
    setPosition: (x: number, y: number) => void;
    setRotation: (t: number) => void;
    getPartCount: () => number;
    setColor: (color: string) => void;
}

export const createPlayerContainer = (graphics: Graphics): PlayerRenderer => {
    const playerRoot = new PIXI.Container();

    const headContainer = new PIXI.Container();
    headContainer.name = "headContainer";
    playerRoot.addChild(headContainer);

    const headBubble = PIXI.Sprite.from(graphics.bubbleTexture);
    headBubble.rotation = Math.PI / 2;
    headBubble.position.set(64, -64);
    headContainer.addChild(headBubble);

    const faceSprite = PIXI.Sprite.from(graphics.faceTexture);
    faceSprite.rotation = Math.PI / 2;
    faceSprite.position.set(64, -64);
    headContainer.addChild(faceSprite);

    const partContainer = new PIXI.Container();
    playerRoot.addChild(partContainer);

    const initialPart = createPart(graphics);
    partContainer.addChild(initialPart.container);

    const parts: Array<SnakePart> = [initialPart];
    let filters: PIXI.Filter[] = [];

    return {
        playerRoot,
        getPartCount: () => {
            return parts.length;
        },
        addPart: () => {
            const part = createPart(graphics);
            partContainer.addChild(part.container),
            part.container.filters = [...filters];
            parts.push(part);
        },
        setPosition: (x, y) => {
            let currentCoord: Coord | null = {
                x: headContainer.x,
                y: headContainer.y,
            }
            headContainer.position.set(x + 64, y + 64);
    
            parts.forEach(p => {
                if (currentCoord != null) {
                    currentCoord = p.pushPosition(currentCoord);
                } 
            });
        },
        setRotation: (t) => {
            headContainer.rotation = t;
        },
        setColor: (color) => {
            if (color.length != 6) {
                console.error("Invalid color input", color);
                return
            }
            const r = parseInt(color.substring(0, 2), 16) / 255;
            const g = parseInt(color.substring(2, 4), 16) / 255;
            const b = parseInt(color.substring(4, 6), 16) / 255;
            let colorMatrix = new PIXI.filters.ColorMatrixFilter();
            colorMatrix.matrix = [
                r, 0, 0, 0, 0,
                0, g, 0, 0, 0,
                0, 0, b, 0, 0,
                0, 0, 0, 1, 0
            ];
            headContainer.filters = [colorMatrix];
            parts.forEach(p => {
                p.container.filters = [colorMatrix];
            });
            filters = [colorMatrix];
        },
    };
};
