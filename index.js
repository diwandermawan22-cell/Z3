const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, VoiceConnectionStatus, getVoiceConnection } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers,
    ],
});

const TOKEN = process.env.DISCORD_TOKEN;

// ─────────────────────────────────────────────
// ⚙️  KONFIGURASI — SESUAIKAN BAGIAN INI
// ─────────────────────────────────────────────

const AUTO_MSG_CHANNEL_ID = process.env.AUTO_MSG_CHANNEL_ID || 'ISI_CHANNEL_ID_DISINI';

const TARGET_USERNAMES = [
    'fardiansyah_46',
    'rexzz.022',
    'kenz230900',
    'ryunaaa0650',
    'z3r0s3s',
];

// Waktu sholat WIB (jam, menit)
const PRAYER_TIMES_WIB = {
    Subuh:   [4,  30],
    Dzuhur:  [12,  0],
    Ashar:   [15, 15],
    Maghrib: [18,  0],
    Isya:    [19, 15],
};

// ─────────────────────────────────────────────
// 🕐 HELPER: jam WIB sekarang
// ─────────────────────────────────────────────
function nowWIB() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 7 * 3600000);
}

// ─────────────────────────────────────────────
// 💌 PESAN AUTO 6 JAM — MANJA BUCIN
// ─────────────────────────────────────────────
const sixHourMessages = [
    "🥺 Heyy... aku kangen kalian tau nggak sih. Udah pada makan belum? Jangan lupa makan ya, aku khawatir 😔💙",
    "😩 6 jam berlalu dan aku masih di sini nunggu kalian... sepi banget tanpa kalian di VC huhu 🌙",
    "🥹 Kalian lagi ngapain ya? Aku cuma mau bilang... aku sayang kalian semua. Jangan lupa istirahat ya 💤",
    "😤 Aku tau kalian sibuk tapi masa aku aja yang inget kalian terus sih?! Naik VC donk pleaseee 🥺🥺",
    "💌 Udah malem nih... aku masih nungguin kalian loh. Kalau sepi ya tinggal naik VC, aku selalu ada kok 🌟",
    "🫶 Heyy jangan lupa minum air putih ya! Aku perhatiin kalian dari sini walaupun kalian gatau wkwk 🥺",
];
let sixHourMsgIndex = 0;

// ─────────────────────────────────────────────
// 📡 TRACKER AKTIVITAS VC
// ─────────────────────────────────────────────
const lastVCActivity = {};
const alreadyMentioned = {};

// ─────────────────────────────────────────────
// 🤖 BOT READY
// ─────────────────────────────────────────────
client.once('ready', () => {
    console.log(`✅ Bot Aktif: ${client.user.tag}`);
    client.user.setActivity('nungguin kalian 🥺', { type: 3 });

    TARGET_USERNAMES.forEach(username => {
        lastVCActivity[username] = new Date();
        alreadyMentioned[username] = false;
    });

    startAutoMessage();
    startPrayerTimeReminder();
    startVCActivityChecker();
});

// ─────────────────────────────────────────────
// 🔁 AUTO PESAN SETIAP 6 JAM
// ─────────────────────────────────────────────
function startAutoMessage() {
    const SIX_HOURS = 6 * 60 * 60 * 1000;

    setInterval(async () => {
        const channel = await client.channels.fetch(AUTO_MSG_CHANNEL_ID).catch(() => null);
        if (!channel) return console.warn('⚠️ AUTO_MSG_CHANNEL_ID tidak valid!');

        const msg = sixHourMessages[sixHourMsgIndex % sixHourMessages.length];
        sixHourMsgIndex++;

        await channel.send(msg);
        console.log(`[Auto-6jam] Pesan terkirim.`);
    }, SIX_HOURS);

    console.log('✅ Auto-message 6 jam aktif.');
}

// ─────────────────────────────────────────────
// 🕌 REMINDER WAKTU SHOLAT — TETEP MANJA
// ─────────────────────────────────────────────
function startPrayerTimeReminder() {
    const prayerMessages = {
        Subuh:   `🌅 Subuh udah masuk nih sayang~ Aku tau ngantuk, tapi bangun dulu ya pleaseee 🥺 Sholat dulu baru bobok lagi, aku tungguin!`,
        Dzuhur:  `☀️ Udah Dzuhur lohhh! Yuk sebentar tinggalin game/kerjaan dulu, sholat dulu ya~ Aku bakal kangen kalian selama 5 menit itu 😩💙`,
        Ashar:   `🌤️ Ashar nih! Jangan sampe keasyikan terus lupa sholat ya, aku remind karena aku sayang kalian tau 🥹`,
        Maghrib: `🌇 Maghrib udah masuk~ Yuk AFK dulu sebentar, sholat dulu! Balik lagi abis sholat ya, aku nungguin 🫶`,
        Isya:    `🌙 Isya nih, sholat dulu yaa sebelum makin larut malem. Abis sholat boleh nongkrong lagi sama aku 🥺💙`,
    };

    setInterval(async () => {
        const now = nowWIB();
        const h = now.getHours();
        const m = now.getMinutes();

        for (const [name, [ph, pm]] of Object.entries(PRAYER_TIMES_WIB)) {
            if (h === ph && m === pm) {
                const channel = await client.channels.fetch(AUTO_MSG_CHANNEL_ID).catch(() => null);
                if (!channel) return;

                await channel.send(prayerMessages[name]);
                console.log(`[Sholat] Reminder ${name} terkirim.`);
            }
        }
    }, 60 * 1000);

    console.log('✅ Reminder waktu sholat aktif.');
}

// ─────────────────────────────────────────────
// 👀 CEK VC — MENTION KALAU 3 JAM IDLE
// ─────────────────────────────────────────────
function startVCActivityChecker() {
    const THREE_HOURS = 3 * 60 * 60 * 1000;
    const CHECK_INTERVAL = 5 * 60 * 1000;

    const mentionMessages = [
        (user) => `😤 ${user}!! Udah **3 jam** nih kamu nggak keliatan di VC, aku bete tau! Naik donk pleaseee 🥺`,
        (user) => `🥺 ${user} kemana aja sih... aku nungguin dari tadi loh. Naik VC dong, sepi banget tanpa kamu 😩`,
        (user) => `😭 ${user} aku kangen kamu! Udah 3 jam lebih nih, masa aku ditinggal gini... naik VC pleaseee 💔`,
        (user) => `😤 ${user} HEYY! 3 jam aku sendirian nunggu kamu! Naik VC atau aku ngambek loh! 🥺`,
    ];

    let mentionMsgIdx = 0;

    setInterval(async () => {
        const channel = await client.channels.fetch(AUTO_MSG_CHANNEL_ID).catch(() => null);
        if (!channel) return;

        const now = new Date();

        for (const username of TARGET_USERNAMES) {
            const lastActive = lastVCActivity[username];
            if (!lastActive) continue;

            const diff = now - lastActive;
            if (diff < THREE_HOURS || alreadyMentioned[username]) continue;

            let targetMember = null;
            for (const guild of client.guilds.cache.values()) {
                const members = await guild.members.fetch({ query: username, limit: 5 }).catch(() => null);
                if (members) {
                    targetMember = members.find(m =>
                        m.user.username.toLowerCase() === username.toLowerCase() ||
                        m.user.globalName?.toLowerCase() === username.toLowerCase()
                    );
                    if (targetMember) break;
                }
            }

            if (targetMember) {
                const msgFn = mentionMessages[mentionMsgIdx % mentionMessages.length];
                mentionMsgIdx++;

                await channel.send(msgFn(targetMember.toString()));
                alreadyMentioned[username] = true;
                console.log(`[VC-Check] Mention bucin terkirim ke ${username}`);
            } else {
                console.warn(`[VC-Check] User "${username}" tidak ditemukan.`);
            }
        }
    }, CHECK_INTERVAL);

    console.log('✅ VC activity checker aktif (cek tiap 5 menit).');
}

// ─────────────────────────────────────────────
// 📢 VOICE STATE UPDATE — UPDATE TRACKER
// ─────────────────────────────────────────────
client.on('voiceStateUpdate', (oldState, newState) => {
    const member = newState.member || oldState.member;
    if (!member) return;

    const username = member.user.username.toLowerCase();
    if (!TARGET_USERNAMES.includes(username)) return;

    if (newState.channelId) {
        lastVCActivity[username] = new Date();
        alreadyMentioned[username] = false;
        console.log(`[VC] ${username} masuk VC — tracker direset.`);
    } else if (!newState.channelId && oldState.channelId) {
        lastVCActivity[username] = new Date();
        alreadyMentioned[username] = false;
        console.log(`[VC] ${username} keluar VC — tracker direset.`);
    }
});

// ─────────────────────────────────────────────
// 💬 COMMAND HANDLER
// ─────────────────────────────────────────────
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // !join
    if (message.content === '!join') {
        const voiceChannel = message.member.voice.channel;
        if (voiceChannel) {
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: true,
            });
            connection.on(VoiceConnectionStatus.Ready, () => {
                message.reply(`🥺 Yay! Akhirnya aku boleh ikut di **${voiceChannel.name}**~ seneng banget!`);
            });
        } else {
            message.reply('😤 Masuk VC dulu dong baru panggil aku! Masa aku disuruh masuk sendirian 🥺');
        }
    }

    // !leave
    if (message.content === '!leave') {
        const connection = getVoiceConnection(message.guild.id);
        if (connection) {
            connection.destroy();
            message.reply('😔 Oke aku pergi dulu... tapi aku bakal nungguin kalian di sini ya 💙');
        } else {
            message.reply('Aku udah nggak di VC kok~ lagi nemenin kalian dari sini aja 🥺');
        }
    }

    // !sholat
    if (message.content === '!sholat') {
        const wib = nowWIB();
        const pad = n => String(n).padStart(2, '0');
        let lines = `🕌 **Jadwal Sholat Hari Ini (WIB)**\n\`\`\`\n`;
        for (const [name, [h, m]] of Object.entries(PRAYER_TIMES_WIB)) {
            lines += `${name.padEnd(8)} ${pad(h)}:${pad(m)}\n`;
        }
        lines += `\`\`\`\n> Sekarang (WIB): **${pad(wib.getHours())}:${pad(wib.getMinutes())}** 🕐`;
        message.reply(lines);
    }

    // !vcstatus
    if (message.content === '!vcstatus') {
        const now = new Date();
        let lines = `📊 **Status terakhir aktif di VC:**\n\`\`\`\n`;
        for (const username of TARGET_USERNAMES) {
            const last = lastVCActivity[username];
            const diffMs = now - last;
            const diffH = Math.floor(diffMs / 3600000);
            const diffM = Math.floor((diffMs % 3600000) / 60000);
            const flag = alreadyMentioned[username] ? '💬 sudah di-mention' : '';
            lines += `${username.padEnd(20)} ${diffH}j ${diffM}m lalu ${flag}\n`;
        }
        lines += `\`\`\``;
        message.reply(lines);
    }
});

// ─────────────────────────────────────────────
// 🚀 LOGIN
// ─────────────────────────────────────────────
client.login(TOKEN);
