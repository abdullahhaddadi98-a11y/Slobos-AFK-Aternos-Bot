function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, createBot) {
    let stopped = false
    let isReconnecting = false

    function cleanup() {
        stopped = true
        // تنظيف أي مؤقتات أو مستمعين قدامى
    }

    // دالة فحص وجود لاعبين
    function checkPlayers() {
        if (stopped) return

        const playerNames = Object.keys(bot.players)
        // إذا كان عدد اللاعبين أكبر من 1 (يعني البوت + شخص آخر)
        if (playerNames.length > 1) {
            console.log(`[AFK] لاعب دخل الخادم. جاري الخروج...`)
            cleanup()
            bot.quit()
        } else {
            // استمر في الفحص كل 10 ثواني
            setTimeout(checkPlayers, 10000)
        }
    }

    // دالة إعادة الاتصال بعد مدة عشوائية (5-15 دقيقة)
    function scheduleReconnect() {
        if (isReconnecting) return
        isReconnecting = true
        
        const delay = randomMs(300000, 900000) // من 5 إلى 15 دقيقة
        console.log(`[AFK] سيتم محاولة الدخول مرة أخرى بعد ${Math.round(delay/60000)} دقيقة`)

        setTimeout(() => {
            isReconnecting = false
            if (typeof createBot === 'function') createBot()
        }, delay)
    }

    bot.once('spawn', () => {
        stopped = false
        isReconnecting = false
        console.log(`[AFK] البوت متصل الآن. يراقب وجود لاعبين...`)
        
        // ابدأ القفز العشوائي (Anti-AFK)
        const jumpInterval = setInterval(() => {
            if (stopped) return clearInterval(jumpInterval)
            bot.setControlState('jump', true)
            setTimeout(() => bot.setControlState('jump', false), 500)
        }, randomMs(20000, 60000))

        // ابدأ مراقبة اللاعبين
        checkPlayers()
    })

    bot.on('end', () => {
        cleanup()
        scheduleReconnect()
    })

    bot.on('error', (err) => {
        cleanup()
        scheduleReconnect()
    })
}

module.exports = setupLeaveRejoin
