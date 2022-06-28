import * as PIXI from "pixi.js";

const pointInterval = 1;

/**
 * Player structure
 * * Root container
 *  * Head container
 *  * Parts...
 * 
 * Root container never gets a position update.
 * Head gets absolute position updates from server and copies
 * old position data to parts.
 */

export class Player {
    identifier: string;
    points?: number | undefined;
    position?: { x: number; y: number; } | undefined;
    currentT: number = 0;
    parts: SnakePart[];
    pixiContainer: PIXI.Container;
    color: string;
    private headContainer: PIXI.Container;
    private step: number = 0;

    constructor(identifier: string, pixiContainer: PIXI.Container, isMainPlayer: boolean) {
        this.headContainer = new PIXI.Container();
        pixiContainer.addChild(this.headContainer);

        this.identifier = identifier;
        this.pixiContainer = pixiContainer;
        this.pixiContainer.sortableChildren = true;

        if (isMainPlayer) {
            const colorInput = document.querySelector("#bubble_color") as HTMLInputElement;
            this.color = colorInput.value;
        }

        const bubbleURL = new URL(
            '/assets/Bubble.png?width=128',
            import.meta.url
        );
        const bubbleSprite = PIXI.Sprite.from(bubbleURL.toString());
        bubbleSprite.rotation = Math.PI / 2;
        bubbleSprite.position.set(64, -64);
        
        const modulateFilter = new PIXI.filters.ColorMatrixFilter();
        
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(colorInput.value);
        const colors = result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : { r: 1, g: 1, b: 1 };
        modulateFilter.matrix = [
            colors.r, 0, 0, 0, 0,
            0, colors.g, 0, 0, 0,
            0, 0, colors.b, 0, 0,
            0, 0, 0, 1, 0
        ];
        bubbleSprite.filters = [modulateFilter];
        
        this.headContainer.addChild(bubbleSprite);

        const faceURL = new URL(
            '/assets/Face.png?width=128',
            import.meta.url
        );
        const faceSprite = PIXI.Sprite.from(faceURL.toString());
        faceSprite.rotation = Math.PI / 2;
        faceSprite.position.set(64, -64);

        this.parts = [
            createPart(bubbleURL),
        ];

        this.parts.forEach((p, i) => {
            p.container.zIndex = this.parts.length - i;
            pixiContainer.addChild(p.container);
        });

        this.headContainer.zIndex = 9999;
        this.headContainer.addChild(faceSprite);

        if (isMainPlayer) {
            window.addEventListener("keydown", (e: KeyboardEvent) => {
                const step = 2 * Math.PI * 0.01;
                switch (e.key) {
                    case "a":
                        this.step = -step;
                        break;

                    case "d":
                        this.step = step;
                        break;
                }
            });
            
            window.addEventListener("keyup", () => {
                this.step = 0;
            });
        }
    }

    tickRotation() {
        this.currentT += this.step;
        this.headContainer.rotation = this.currentT;
    }

    updatePosition(x: number, y: number) {
        let currentCoord: Coord | null = {
            x: this.headContainer.x,
            y: this.headContainer.y,
        }
        this.headContainer.position.set(x + 64, y + 64);

        this.parts.forEach(p => {
            if (currentCoord != null) {
                currentCoord = p.pushPosition(currentCoord);
            } 
        });
    }
};

interface Coord {
    x: number,
    y: number,
}

interface SnakePart {
    container: PIXI.Container,
    positionBuffer: Coord[],

    pushPosition(coord: Coord): Coord | null
}

const bufferLength = 15;

export const createPart = (spriteURL: URL): SnakePart => {
    const container = new PIXI.Container();
    
    const innerSprite = PIXI.Sprite.from(spriteURL.toString());
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
}