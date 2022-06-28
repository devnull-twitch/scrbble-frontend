let t = 0;
let leftDown = false;
let rightDown = false;

document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "d" || e.key === "right") {
        rightDown = true;
    }
    if (e.key === "a" || e.key === "left") {
        leftDown = true;
    }
});

document.addEventListener("keyup", (e: KeyboardEvent) => {
    if (e.key === "d" || e.key === "right") {
        rightDown = false;
    }
    if (e.key === "a" || e.key === "left") {
        leftDown = false;
    }
});

export const getRotation = (): number => {
    return t;
};

const rotationSpeed = 0.05;

export const tick = (delta: number) => {
    if (rightDown) {
        t += rotationSpeed * delta;
    } else if (leftDown) {
        t -= rotationSpeed * delta;
    }
};