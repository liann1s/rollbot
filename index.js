require('./server.js'); // Keep-alive server

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
  1: "Read something for 5 minutes",
  2: "Drink water and take a walk (even inside!)",
  3: "Do the task.",
  4: "Do the task.",
  5: "Do something you've been putting off",
  6: "Do the task.",
  7: "Write 100 words or journal",
  8: "Do the task.",
  9: "Do the task.",
  10: "Do something that doesn't involve the PC or phone"
};

// === Helper functions ===
function rollDice(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function getTwoDifferentTasks() {
  let first = rollDice(10);
  let second;
  do {
    second = rollDice(10);
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

      if (d20 === 1) {
        let [task1, task2] = getTwoDifferentTasks();
        const reply = `🎲 You rolled a **1**!\n**CRITICAL FAIL!**\nYou must do TWO tasks:\n- ${tasks[task1]}\n- ${tasks[task2]}`;

        slackTop = 10;
        logEntry.result = `Critical Fail! Did tasks: ${tasks[task1]} and ${tasks[task2]}`;
        history.push(logEntry);
        saveHistory();

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else if (d20 === 20) {
        freePasses++;
        const reply = `🎲 You rolled a **20**!\n**NATURAL 20!** 🎉 You gained a free pass!\nTotal free passes: **${freePasses}**`;

        logEntry.result = "Natural 20! Gained 1 Free Pass.";
        history.push(logEntry);
        saveHistory();

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else if (d20 <= slackTop) {
        const reply = `🎲 You rolled a **${d20}**!\nYou get to slack off. 😎\nNext slack range: 1-${slackTop - 1}`;

        slackTop = Math.max(slackTop - 1, 1);

        logEntry.result = "Slacked off.";
        history.push(logEntry);
        saveHistory();

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else {
        if (freePasses > 0) {
          const row = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('use_pass')
                .setLabel('Use Free Pass 🛡️')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId('do_task')
                .setLabel('Do the Task 🛠️')
                .setStyle(ButtonStyle.Danger),
            );

          await interaction.reply({
            content: "🛡️ You have a free pass! Do you want to use it or complete a task?",
            components: [row],
            ephemeral: true
          });
        } else {
          let d10 = rollDice(10);
          const reply = `🎲 You rolled a **${d20}**!\nNo slacking! You must do: **${tasks[d10]}**.`;

          slackTop = 10;
          logEntry.result = `Did task: ${tasks[d10]}`;
          history.push(logEntry);
          saveHistory();

          await interaction.reply({ content: reply, ephemeral: false });
        }
      }
    }

    else if (interaction.commandName === 'stats') {
      let totalRolls = history.length;
      let tasksDone = history.filter(h => h.result.startsWith('Did task') || h.result.startsWith('Critical Fail') || h.result.startsWith('Chose to do task')).length;
      let slacks = history.filter(h => h.result === 'Slacked off.').length;
      let totalFreePasses = freePasses;

      const statsMessage = `📈 **Productivity Stats** 📈\n` +
        `- Total Rolls: **${totalRolls}**\n` +
        `- Tasks Completed: **${tasksDone}**\n` +
        `- Slacked Off: **${slacks}**\n` +
        `- Free Passes Available: **${totalFreePasses}**`;

      await interaction.reply({ content: statsMessage, ephemeral: true });
    }

    else if (interaction.commandName === 'history') {
      if (history.length === 0) {
        await interaction.reply({ content: "No rolls yet! 🎲", ephemeral: true });
        return;
      }

      let recentHistory = history.slice(-10).map((h, i) =>
        `#${history.length - 9 + i}: 🎲 Rolled **${h.roll}** → ${h.result}\n🕒 **Time:** ${new Date(h.timestamp).toLocaleString()}`
      ).join('\n\n');

      await interaction.reply({ content: `📜 **Recent Rolls:**\n${recentHistory}`, ephemeral: true });
    }
  }

  else if (interaction.isButton()) {
    if (interaction.customId === 'use_pass') {
      freePasses--;
      history.push({
        roll: '-',
        result: 'Chose to use Free Pass.',
        timestamp: new Date().toISOString()
      });
      saveHistory();

      await interaction.update({
        content: `🛡️ You used your free pass! Remaining passes: **${freePasses}**.`,
        components: []
      });
    }
    else if (interaction.customId === 'do_task') {
      let d10 = rollDice(10);
      slackTop = 10;

      history.push({
        roll: '-',
        result: `Chose to do task: ${tasks[d10]}`,
        timestamp: new Date().toISOString()
      });
      saveHistory();

      await interaction.update({
        content: `🛠️ You chose to do the task: **${tasks[d10]}**.`,
        components: []
      });
    }
  }
});

client.login(process.env.TOKEN);
