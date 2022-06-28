import * as PIXI from "pixi.js";

export interface Graphics {
    bubbleTexture: PIXI.Texture,
    faceTexture: PIXI.Texture,
    pebbleTexture: PIXI.Texture,
}

export const loadGraphics = async (): Promise<Graphics> => {
    const bubbleURL = new URL(
        '/assets/Bubble.png?width=128',
        import.meta.url
    );
    const bubbleTexture = await PIXI.Texture.fromURL(bubbleURL.toString());
    
    const faceURL = new URL(
        '/assets/Face.png?width=128',
        import.meta.url
    );
    const faceTexture = await PIXI.Texture.fromURL(faceURL.toString());

    const pebbleURL = new URL(
        '/assets/Pebble.png?width=64',
        import.meta.url
    );
    const pebbleTexture = await PIXI.Texture.fromURL(pebbleURL.toString())

    return {
        bubbleTexture,
        faceTexture,
        pebbleTexture,
    };
};