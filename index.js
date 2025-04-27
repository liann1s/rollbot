require('./server.js'); // Keep-alive server for Render (even if not needed, harmless)

const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// === Load or initialize history ===
const historyPath = path.join(__dirname, 'history.json');
let history = [];

if (fs.existsSync(historyPath)) {
  try {
    history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    console.log("History loaded successfully.");
  } catch (error) {
    console.error("Failed to load history, starting fresh.", error);
  }
}

// === Core variables ===
let slackTop = 10;
let freePasses = 0;

const tasks = {
  1: "Clean something for 5 minutes",
  2: "Reply to one message",
  3: "Do one small chore",
  4: "Write 100 words or brainstorm",
  5: "Drink water and stretch"
};

// === Helper functions ===
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function getTwoDifferentTasks() {
  let first = rollDice(5);
  let second;
  do {
    second = rollDice(5);
  } while (second === first);
  return [first, second];
}

function saveHistory() {
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf8');
}

// === Bot Event Handlers ===
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'roll') {
      let d20 = rollDice(20);
      let logEntry = { roll: d20, timestamp: new Date().toISOString(), result: "" };

      if (d
