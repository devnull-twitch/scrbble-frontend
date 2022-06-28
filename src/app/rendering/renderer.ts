import { Viewport } from "pixi-viewport";
import * as PIXI from "pixi.js";
import { Graphics } from "../graphics";
import { Player } from "../player";
import { createPlayerContainer, PlayerRenderer } from "./palyer";

export class Renderer {
    private pixiApp: PIXI.Application;
    private viewport: Viewport;
    private graphics: Graphics;
    private playerRendererMap: Map<string, PlayerRenderer>;

    constructor(
        canvas: HTMLCanvasElement,
        container: HTMLElement,
        graphics: Graphics,
        ticker: (deltaTime: number) => void,
        worldWidth: number = 5000,
        worldHeight: number = 5000,
    ) {
        this.graphics = graphics;
        this.playerRendererMap = new Map<string, PlayerRenderer>();

        this.pixiApp = new PIXI.Application({
            view: canvas,
            resizeTo: container,
            backgroundColor: 0xFFFFFF,
        });

        this.viewport = new Viewport({
            screenHeight: container.clientHeight,
            screenWidth: container.clientWidth,
            worldHeight,
            worldWidth,
        });
        this.pixiApp.stage.addChild(this.viewport);

        const bgContainer = new PIXI.Container();
        this.viewport.addChild(bgContainer);
        setupBackground(bgContainer, 60, worldWidth, worldHeight);

        this.pixiApp.ticker.add(ticker);
    }

    addPlayer(playerID: string, color: string = "FFFFFF") {
        const renderer = createPlayerContainer(this.graphics);
        renderer.setColor(color);
        this.playerRendererMap.set(playerID, renderer);
        this.viewport.addChild(renderer.playerRoot);
    };

    removePlayer(playerID: string) {
        const renderer = this.playerRendererMap.get(playerID);
        if (renderer) {
            this.viewport.removeChild(renderer.playerRoot);
            this.playerRendererMap.delete(playerID);
        }
    }

    addPlayerPart(playerID: string, resize: boolean = false) {
        const playerRenderer = this.playerRendererMap.get(playerID);
        if (!playerRenderer) {
            console.error(`player ${playerID} renderer not found`);
            return;
        }

        playerRenderer.addPart();

        if (resize && playerRenderer.getPartCount() > 2) {
            let scaleValue = (22 - playerRenderer.getPartCount()) / 20;
            if (scaleValue < 0.5) {
                scaleValue = 0.5;
            } 
            this.viewport.scale.set(scaleValue, scaleValue);
        }
    }

    setPlayerPosition(
        playerID: string,
        x: number,
        y: number,
        t: number,
        center: boolean = false,
    ) {
        const playerRenderer = this.playerRendererMap.get(playerID);
        if (playerRenderer) {
            playerRenderer.setPosition(x, y);
            playerRenderer.setRotation(t);
        }

        if (center) {
            this.viewport.center = new PIXI.Point(x, y);
        }
    }

    addPebble(pebbleID: number, x: number, y: number) {
        const bubbleSprite = PIXI.Sprite.from(this.graphics.pebbleTexture);
        bubbleSprite.rotation = Math.PI / 2;
        bubbleSprite.position.set(x + 64, y);
        bubbleSprite.name = `pebble-${pebbleID}`;
        this.viewport.addChild(bubbleSprite);
    };

    removePebble(pebbleID: number) {
        try {
            const pebble = this.viewport.getChildByName(`pebble-${pebbleID}`);
            this.viewport.removeChild(pebble);
        } catch (e) {
            console.error(`pebble ${pebbleID} not found for removal`);
        }
    }

    stop() {
        this.pixiApp.stop();
    }
};

const setupBackground = (bgContainer: PIXI.Container, ySpacing: number, width: number, height: number) => {
    const bg = new PIXI.Graphics();
    bg.lineStyle({width: 2, color: 0xCCCCCC });

    let y = ySpacing / 2;
    
    while (y < height) {
        bg.moveTo(0, y);
        bg.lineTo(width, y);
        y += ySpacing;
    }

    bgContainer.addChild(bg);

    const border = new PIXI.Graphics();
    border.lineStyle({width: 10, color: 0xEEEEEE });
    border.moveTo(-5, -5); // move to top left
    border.lineTo(-5, height + 5); // left border
    border.lineTo(width + 5, height + 5); // bottom border
    border.lineTo(width + 5, -5); // right border
    border.lineTo(-5, -5); // border top

    bgContainer.addChild(border);
};