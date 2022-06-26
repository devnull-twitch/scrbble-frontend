import * as PIXI from "pixi.js";
import { start } from "./client";
import { createPart, Player } from "./player";
import { Viewport } from 'pixi-viewport';

interface Game {
    pixiApp: PIXI.Application
}

const BackgroundXSpacing = 60;

const boot = (roomID: string) => {
    const roomOut = document.querySelector(".roomid-out") as HTMLElement;
    roomOut.textContent = roomID;
    document.querySelector(".room-out-header")?.classList.remove("hide");

    const renderCanvas = document.getElementById("pixiview") as HTMLCanvasElement;
    const gameContainer = document.querySelector(".game") as HTMLElement;

    const playerContainer = new PIXI.Container();
    const mainPlayer = new Player("mainplayer", playerContainer, true);

    const g: Game = {
        pixiApp: new PIXI.Application({
            view: renderCanvas,
            resizeTo: gameContainer,
            backgroundColor: 0xFFFFFF,
        }),
    };

    const viewport = new Viewport({
        screenHeight: gameContainer.clientHeight,
        screenWidth: gameContainer.clientWidth,
        worldHeight: 5000,
        worldWidth: 5000,
    });

    const playerNameMap = new Map<string, Player>();
    const setPlayerPosition = (player_id: string, x: number, y: number) => {
        if (!playerNameMap.has(player_id)) {
            const newPlayerContainer = new PIXI.Container();
            const newPlayer = new Player(player_id, newPlayerContainer, false);
            playerNameMap.set(player_id, newPlayer);
            viewport.addChild(newPlayerContainer);
        }

        const op = playerNameMap.get(player_id) as Player;
        op.updatePosition(x, y);

        if (player_id === mainPlayer.identifier) {
            viewport.moveCenter(x, y);
        }
    };

    const setMainPlayerName = (player_id: string) => {
        mainPlayer.identifier = player_id;
        playerNameMap.set(player_id, mainPlayer);
    };

    const onDisconnect = (playerID: string) => {
        if (!playerNameMap.has(playerID)) {
            return;
        }

        const playerObj = playerNameMap.get(playerID) as Player;
        viewport.removeChild(playerObj.pixiContainer);
        playerNameMap.delete(playerID);
    }

    const bubbleURL = new URL(
        '/assets/Bubble.png?width=128',
        import.meta.url
    );
    const addSnakePart = (player_id: string) => {
        if (!playerNameMap.has(player_id)) {
            return;
        }

        let pickupPlayer = playerNameMap.get(player_id) as Player;

        const newPart = createPart(bubbleURL);
        pickupPlayer.parts = [...pickupPlayer.parts, newPart];

        newPart.container.zIndex = -pickupPlayer.parts.length;
        pickupPlayer.pixiContainer.addChild(newPart.container);

        if (pickupPlayer.parts.length > 2 && player_id === mainPlayer.identifier) {
            let scaleValue = (22 - pickupPlayer.parts.length) / 20;
            if (scaleValue < 0.5) {
                scaleValue = 0.5;
            } 
            viewport.scale.set(scaleValue, scaleValue);
        }
    };

    const gameOver = () => {
        g.pixiApp.stop();
        document.querySelector(".gameover")?.classList.remove("hide")
    };

    const pebbleContainer = new PIXI.Container();

    const socket = start(
        roomID,
        pebbleContainer,
        setMainPlayerName,
        setPlayerPosition,
        addSnakePart,
        onDisconnect,
        gameOver,
    );

    g.pixiApp.ticker.add(() => {
        mainPlayer.tickRotation();
        if (socket.readyState == socket.OPEN) {
            socket.send(JSON.stringify({t: mainPlayer.currentT}));
        }
    });

    const background = new PIXI.Container();
    background.position.set(0, 0);
    viewport.addChild(background);
    setupBackground(background, BackgroundXSpacing, viewport.worldWidth, viewport.worldHeight);

    viewport.addChild(pebbleContainer);
    viewport.addChild(playerContainer);

    g.pixiApp.stage.addChild(viewport);
    
    console.log("boot complete");
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

interface NewRoomResponse {
    room_id: string
}

const setupMenu = () => {
    document.querySelectorAll("button").forEach((buttonElem: HTMLButtonElement) => {
        buttonElem.addEventListener("click", () => {
            switch (buttonElem.dataset["target"]) {
                case "new":
                    const getRoomAndBoot = async () => {
                        const proto = process.env.SECURE_BACKEND === "1" ? "https" : "http";
                        const resp = await fetch(`${proto}://${process.env.BASE_URL}/make_room`, {
                            method: "POST",
                        });
                        const json: NewRoomResponse = await resp.json();
                        boot(json.room_id);
                    };
                    getRoomAndBoot();
                    break;
    
                case "join":
                    const roomIDElem = document.querySelector("#room_id") as HTMLInputElement;
                    boot(roomIDElem.value);
                    break;
    
                default:
                    return;
            }
    
            document.querySelector(".mainmenu")?.classList.add("hide");
        });
    })
};

setupMenu();