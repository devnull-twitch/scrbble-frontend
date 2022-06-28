const messageBuffer = new Array<string>();
let hasActiveMessage: boolean = false;
let messageAutoRemoveTimeout: NodeJS.Timeout | null = null; 

const messageContainer = document.querySelector(".message-out");

const setMessag = (message: string) => {
    if (messageContainer) {
        messageContainer.parentElement?.classList.remove("hide");
        messageContainer.textContent = message;
    }
}

const clearMessage = () => {
    if (messageContainer) {
        messageContainer.textContent = "";
        messageContainer.parentElement?.classList.add("hide");
    }
}

export const add = (message: string) => {
    if (!hasActiveMessage) {
        hasActiveMessage = true;
        setMessag(message);
        messageAutoRemoveTimeout = setTimeout(() => {
            deleteCurrentMessage();
        }, 3000);
    } else {
        messageBuffer.push(message);
    }
};

export const deleteCurrentMessage = () => {
    if (messageBuffer.length > 0) {
        setMessag(messageBuffer.pop() as string);
    } else {
        clearMessage();
        hasActiveMessage = false;
    }
}

document.querySelector(".message-read-btn")?.addEventListener("click", (e: Event) => {
    if (messageAutoRemoveTimeout) {
        clearTimeout(messageAutoRemoveTimeout);
        messageAutoRemoveTimeout = null;
    }
    e.preventDefault();
    deleteCurrentMessage();
});