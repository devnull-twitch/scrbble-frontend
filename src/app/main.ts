import { createClient, Events, PlayerEventPayload, PlayerPositionEventPayload } from "./networking";
import { Renderer } from "./rendering/renderer";
import { loadGraphics } from "./graphics";
import { getRotation, tick as inputTick } from "./input";


const boot = async (roomID: string) => {
    const roomOut = document.querySelector(".roomid-out") as HTMLElement;
    roomOut.textContent = roomID;
    document.querySelector(".room-out-header")?.classList.remove("invis");

    const colorInput = document.querySelector("#bubble_color") as HTMLInputElement;
    const color = colorInput.value;

    const renderCanvas = document.getElementById("pixiview") as HTMLCanvasElement;
    const gameContainer = document.querySelector(".game") as HTMLElement;

    const netClient = createClient(roomID, color)

    const graphics = await loadGraphics();
    const gameRender = new Renderer(renderCanvas, gameContainer, graphics, (dt) => {
        inputTick(dt);
        const t = getRotation();
        netClient.send({t});
    });

    let mainPlayerName: string = "";
    netClient.on(Events.YouAre, (payload) => {
        mainPlayerName = payload.name;
        gameRender.addPlayer(payload.name, color.replace("#", ""));
    });

    netClient.on(Events.PlayerAdd, (payload) => {
        gameRender.addPlayer(payload.name, payload.color);
    });

    netClient.on(Events.PositionUpdate, (payload) => {
        let center = false;
        if (mainPlayerName === payload.name) {
            center = true;
        }
        gameRender.setPlayerPosition(payload.name, payload.x, payload.y, payload.t, center);
    });

    netClient.on(Events.PlayerRemove, (payload) => {
        gameRender.removePlayer(payload.name);
    });

    const onClose = () => {
        gameRender.stop();
        document.querySelector(".mainmenu")?.classList.remove("hide");
        document.querySelector(".room-out-header")?.classList.add("invis");
    };
    netClient.on(Events.ConnectionClose, onClose);
    netClient.on(Events.ConnectionError, onClose);
    document.querySelector(".leave-room-btn")?.addEventListener("click", onClose);

    netClient.on(Events.PlayerPartAdd, (payload) => {
        let resize = false;
        if (mainPlayerName === payload.name) {
            resize = true;
        }
        gameRender.addPlayerPart(payload.name, resize);
    });

    netClient.on(Events.GameOver, () => {
        gameRender.stop();
        document.querySelector(".room-out-header")?.classList.add("invis");
        document.querySelector(".gameover")?.classList.remove("hide");
    });

    netClient.on(Events.PebbleAdd, (payload) => {
        gameRender.addPebble(payload.id, payload.x, payload.y);
    });

    netClient.on(Events.PebbleRemove, (payload) => {
        gameRender.removePebble(payload.id);
    });

    netClient.connect();
    
    console.log("boot complete");
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
                    if (roomIDElem.value == "") {
                        if (!roomIDElem.classList.contains("error")) {
                            roomIDElem.classList.add("error");
                        }
                        return;
                    }

                    let roomID = roomIDElem.value;
                    if (parseInt(roomID).toString() === roomIDElem.value) {
                        roomID = `room-${roomID}`;
                    }

                    boot(roomID);
                    break;
    
                default:
                    return;
            }
    
            document.querySelector(".mainmenu")?.classList.add("hide");
        });
    })
};

setupMenu();