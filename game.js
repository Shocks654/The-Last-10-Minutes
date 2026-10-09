// ============================================================================
// THE LAST 10 MINUTES - SIMULATION ESCAPE PROTOCOL v1.0
// ============================================================================

const CONFIG = {
    totalTime: 600, // 10 minutes in seconds
    saveKey: "tl10m_discoveries"
};

let timeRemaining = CONFIG.totalTime;
let currentLoop = 1;
let currentRoom = "ZERO";
let status = "TRAPPED";
let discoveries = JSON.parse(localStorage.getItem(CONFIG.saveKey)) || [];
let timerInterval = null;

// DOM Elements
const terminalOutput = document.getElementById("terminalOutput");
const commandInput = document.getElementById("commandInput");
const clockDisplay = document.getElementById("clockDisplay");

function initSimulation() {
    timeRemaining = CONFIG.totalTime;
    status = "TRAPPED";
    startTimer();
    printSystemMessage("Simulation started. Investigate the room. Your discoveries survive the loop resets.");
    printWelcomeMessage();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateClockDisplay();
        if (timeRemaining <= 0) {
            triggerLoopReset();
        }
    }, 1000);
}

function updateClockDisplay() {
    const minutes = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    const seconds = (timeRemaining % 60).toString().padStart(2, '0');
    if (clockDisplay) {
        clockDisplay.innerText = `${minutes}:${seconds}`;
    }
}

function printSystemMessage(text) {
    const p = document.createElement("p");
    p.className = "system-text";
    p.innerHTML = `<strong>SYSTEM:</strong> ${text}`;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function printWelcomeMessage() {
    const lines = [
        "========================================",
        "THE LAST 10 MINUTES",
        "SIMULATION ESCAPE PROTOCOL v1.0",
        `LOOP: ${currentLoop.toString().padStart(2, '0')} | ROOM: ${currentRoom} | STATUS: ${status}`,
        "========================================",
        "You wake up. A silent room. A locked door. A clock counting backward.",
        "A voice whispers: 'You have ten minutes. Remember what matters.'",
        "",
        "Available actions:",
        " > inspect clock",
        " > inspect mirror",
        " > inspect terminal",
        " > inspect exit",
        " > unlock"
    ];
    lines.forEach(line => {
        const p = document.createElement("p");
        p.innerText = line;
        terminalOutput.appendChild(p);
    });
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function handleCommand(cmd) {
    const cleanCmd = cmd.trim().toLowerCase();
    const p = document.createElement("p");
    p.innerHTML = `<span class="user-cmd">> ${cmd}</span>`;
    terminalOutput.appendChild(p);

    switch(cleanCmd) {
        case "inspect clock":
            printSystemMessage("The clock is ticking down rapidly. It is hardwired into the door mechanism.");
            recordDiscovery("clock_wired");
            break;
        case "inspect mirror":
            printSystemMessage("You see your reflection. Behind you, a faint code is scratched into the wall: '01-RESET'.");
            recordDiscovery("wall_code");
            break;
        case "inspect terminal":
            printSystemMessage("The terminal demands an bypass phrase. It says: 'Every loop resets the room. Your memories are yours.'");
            recordDiscovery("terminal_hint");
            break;
        case "inspect exit":
            printSystemMessage("A heavy steel bulkhead door. It requires an electronic UNLOCK sequence from the terminal.");
            break;
        case "unlock":
            if (discoveries.includes("wall_code") && discoveries.includes("terminal_hint")) {
                status = "ESCAPED";
                clearInterval(timerInterval);
                printSystemMessage("SUCCESS. The lock clicks open. The simulation shatters. YOU ESCAPED!");
            } else {
                printSystemMessage("ACCESS DENIED. You do not have enough data to initiate unlock sequence.");
            }
            break;
        default:
            printSystemMessage("Unknown protocol command. Try inspecting your surroundings.");
    }
    commandInput.value = "";
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function recordDiscovery(key) {
    if (!discoveries.includes(key)) {
        discoveries.push(key);
        localStorage.setItem(CONFIG.saveKey, JSON.stringify(discoveries));
    }
}

function triggerLoopReset() {
    clearInterval(timerInterval);
    currentLoop++;
    printSystemMessage("TIME EXPIRED. THE ROOM RESETS...");
    setTimeout(() => {
        terminalOutput.innerHTML = "";
        initSimulation();
    }, 2000);
}

if (commandInput) {
    commandInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            handleCommand(commandInput.value);
        }
    });
}

// Boot up simulation
initSimulation();
