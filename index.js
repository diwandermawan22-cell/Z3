const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;
const S1_GUILD = process.env.S1_GUILD_ID;
const S1_CHAT = process.env.S1_CHAT_ID;
const S2_GUILD = process.env.S2_GUILD_ID;
const S2_CHAT = process.env.S2_CHAT_ID;

const globalVoiceTracker = new Map();

const quotes = [
    "😏 @everyone Janda lagi apa nih? Daripada melamun mending naik VC, bot siap manjain kalian! 🔥",
    "🥴 Waduh.. perawan di server ini takutan banget sih. Takut jatuh cinta ya? Xixi.. @everyone",
    "🔥 Peringatan! Perjaka di sini kegantengannya lewat batas. Segera laporan ke VC! 😏",
    "🌚 @everyone Dingin gini enaknya dengerin candaan kalian di VC biar anget! 😜",
    "💦 Jangan biarkan malammu basah karena galau, mending seru-seruan bareng di Z3 Studios! 🔥",
    "🍑 @everyone Info dong, yang janda sebelah mana? Mau aku kasih perhatian lebih nih.. Hehe..",
    "💌 Hey kamu @everyone. Iya kamu. Jangan cuma pinter bikin kangen, pinter jaga kesehatan juga ya sayang.. 💙",
    "🫶 Status jomblo gaya harus elit. Sini kumpul di VC biar nggak kesepian! 🥺",
    "💔 @everyone Buat yang galau, janda dan duda di sini masih banyak yang lebih oke. 🔥",
    "☕ Seduh kopimu, lupakan mantanmu. Z3 Studios lebih asyik! @everyone",
    "🌟 Kamu berharga! Jangan biarkan orang salah bikin kamu ngerasa gak berguna. Semangat! 💙",
    "🚀 Gaspolll! Semangat yang lagi kerja. Rejeki lancar, jodoh pun mendekat! ✨",
    "😏 Perjaka jangan kaku, janda jangan agresif, yang penting kita asyik! @everyone"
];

function nowWIB() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
}

async function broadcast(text) {
    const ids = [S1_CHAT, S2_CHAT].filter(id => id);
    for (const id of ids) {
        try {
            const ch = await client.channels.fetch(id).catch(() => null);
            if (ch) await ch.send(text);
        } catch (e) {}
    }
}

client.once('ready', () => {
    client.user.setActivity('jagain janda & perawan 🥺', { type: ActivityType.Watching });

    setInterval(async () => {
        const now = nowWIB();
        const h = now.getHours();
        const m = now.getMinutes();

        if (h === 7 && m === 30) await broadcast("🍳 @everyone Pagi sayang! Jangan lupa **Sarapan** ya. Semangat cari jodohnya! 🥛");
        if (h === 12 && m === 30) await broadcast("🍛 @everyone Makan Siang dulu kawan! Biar tenaganya kuat buat mabar. 🍗");
        if (h === 19 && m === 0) await broadcast("🍝 @everyone Waktunya Makan Malam! Makan yang banyak biar nggak sakit hati.. 🥺");
        
        const sholat = { "Subuh": [4, 35], "Dzuhur": [12, 5], "Ashar": [15, 20], "Maghrib": [18, 5], "Isya": [19, 20] };
        for (const [name, time] of Object.entries(sholat)) {
            if (h === time[0] && m === time[1]) {
                await broadcast(`🕌 **Waktunya ${name}!**\nSholat dulu sayang~ nanti lanjut lagi ya 🥺💙 @everyone`);
            }
        }
    }, 60000);

    function startRandomQuotes() {
        const randomTime = Math.floor(Math.random() * (3 * 3600000 - 1 * 3600000 + 1)) + 1 * 3600000;
        setTimeout(() => {
            const pick = quotes[Math.floor(Math.random() * quotes.length)];
            broadcast(pick);
            startRandomQuotes();
        }, randomTime);
    }
    startRandomQuotes();
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    const member = newState.member;
    if (!member || member.user.bot) return;

    if (!oldState.channelId && newState.channelId) {
        globalVoiceTracker.set(member.id, { startTime: new Date() });
    } 
    else if (oldState.channelId && !newState.channelId) {
        const data = globalVoiceTracker.get(member.id);
        if (data) {
            const duration = new Date() - data.startTime;
            if (duration >= 3 * 60 * 60 * 1000) { 
                const h = Math.floor(duration / 3600000);
                const m = Math.floor((duration % 3600000) / 60000);
                let targetChId = (oldState.guild.id === S1_GUILD) ? S1_CHAT : (oldState.guild.id === S2_GUILD ? S2_CHAT : null);
                if (targetChId) {
                    const logCh = await client.channels.fetch(targetChId).catch(() => null);
                    if (logCh) logCh.send(`🚨 **Maraton Selesai!**\n${member.user.toString()} turun setelah **${h} jam ${m} menit**. Kuat banget! 🔥 @everyone`);
                }
            }
            globalVoiceTracker.delete(member.id);
        }
    }
});

client.login(TOKEN);
