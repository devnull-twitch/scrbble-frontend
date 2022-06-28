import * as PIXI from "pixi.js";
import { Graphics } from "../graphics";

export interface Coord {
    x: number,
    y: number,
}

export interface SnakePart {
    container: PIXI.Container,
    positionBuffer: Coord[],

    pushPosition(coord: Coord): Coord | null
}

const bufferLength = 15;

export const createPart = (graphics: Graphics): SnakePart => {
    const container = new PIXI.Container();
    
    const innerSprite = PIXI.Sprite.from(graphics.bubbleTexture);
    innerSprite.position.set(64, -64);
    innerSprite.rotation = Math.PI / 2;
    container.addChild(innerSprite);

    const buffer = new Array<Coord>(bufferLength);
    let index = 0;

    return {
        container,
        positionBuffer: [],
        pushPosition: (coord) => {
            if (index > buffer.length - 1) {
                index = 0;
            }

            let returnValue: Coord | null = null;
            if (buffer[index]) {
                container.position.set(buffer[index].x, buffer[index].y);
                returnValue = buffer[index];
            }

            buffer[index] = coord;
            index++;

            return returnValue
        }
    };
};