// Productivity Dice Bot - Clean Full Version

const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let slackTop = 10;
let freePasses = 0;
let history = [];

const tasks = {
  1: "Clean something for 5 minutes",
  2: "Reply to one message",
  3: "Do one small chore",
  4: "Write 100 words or brainstorm",
  5: "Drink water and stretch"
};

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

client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'roll') {
      let d20 = rollDice(20);
      let logEntry = { roll: d20, result: "" };

      if (d20 === 1) {
        let [task1, task2] = getTwoDifferentTasks();
        const reply = `🎲 You rolled a **1**! \n**CRITICAL FAIL!**\nYou must do TWO tasks:\n- ${tasks[task1]}\n- ${tasks[task2]}`;

        slackTop = 10;
        logEntry.result = `Critical Fail! Did tasks: ${tasks[task1]} and ${tasks[task2]}`;
        history.push(logEntry);

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else if (d20 === 20) {
        freePasses++;
        const reply = `🎲 You rolled a **20**! \n**NATURAL 20!** 🎉 You gained a free pass!\nTotal free passes: **${freePasses}**`;

        logEntry.result = "Natural 20! Gained 1 Free Pass.";
        history.push(logEntry);

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else if (d20 <= slackTop) {
        const reply = `🎲 You rolled a **${d20}**! \nYou get to slack off. 😎\nNext slack range: 1-${slackTop - 1}`;

        slackTop--;
        if (slackTop < 1) slackTop = 1;

        logEntry.result = "Slacked off.";
        history.push(logEntry);

        await interaction.reply({ content: reply, ephemeral: false });
      }
      else {
        if (freePasses > 0) {
          // You have a free pass! Ask if you want to use it.
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
          let d5 = rollDice(5);
          const reply = `🎲 You rolled a **${d20}**! \nNo slacking! You must do: **${tasks[d5]}**.`;

          slackTop = 10;
          logEntry.result = `Did task: ${tasks[d5]}`;
          history.push(logEntry);

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

      let recentHistory = history.slice(-10).map((h, i) => `#${history.length - 9 + i}: 🎲 Rolled **${h.roll}** → ${h.result}`).join('\n');

      await interaction.reply({ content: `📜 **Recent Rolls:**\n${recentHistory}`, ephemeral: true });
    }
  }

  else if (interaction.isButton()) {
    if (interaction.customId === 'use_pass') {
      freePasses--;
      await interaction.update({
        content: `🛡️ You used your free pass! Remaining passes: **${freePasses}**.`,
        components: []
      });
      history.push({ roll: '-', result: 'Chose to use Free Pass.' });
    }
    else if (interaction.customId === 'do_task') {
      let d5 = rollDice(5);
      await interaction.update({
        content: `🛠️ You chose to do the task: **${tasks[d5]}**.`,
        components: []
      });

      slackTop = 10;
      history.push({ roll: '-', result: `Chose to do task: ${tasks[d5]}` });
    }
  }
});

client.login(process.env.TOKEN);
