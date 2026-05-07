function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, createBot) {
    // التايمرز الأساسية اللي يحتاجها السكربت عشان ما يضرب
    let leaveTimer = null
    let jumpTimer = null
    let jumpOffTimer = null
    let reconnectTimer = null

    let stopped = false
    let lastLogAt = 0

    function logThrottled(msg, minGapMs = 2000) {
        const now = Date.now()
        if (now - lastLogAt >= minGapMs) {
            lastLogAt = now
            console.log(msg)
        }
    }

    function cleanup() {
        stopped = true
        if (leaveTimer) clearTimeout(leaveTimer)
        if (jumpTimer) clearTimeout(jumpTimer)
        if (jumpOffTimer) clearTimeout(jumpOffTimer)
        if (reconnectTimer) clearTimeout(reconnectTimer)
        leaveTimer = jumpTimer = jumpOffTimer = reconnectTimer = null
    }

    // وظيفة مراقبة اللاعبين - إذا دخل أحد يطلع البوت
    function checkPlayers() {
        if (stopped || !bot.players) return

        const playerCount = Object.keys(bot.players).length
        if (playerCount > 1) {
            logThrottled('[AFK] فيه لاعب دخل! البوت بيطلع الحين عشان تاخذون راحتكم.')
            cleanup()
            bot.quit()
        } else {
            // يفحص كل 5 ثواني عشان يكون سريع الاستجابة
            setTimeout(checkPlayers, 5000)
        }
    }

    bot.once('spawn', () => {
        cleanup()
        stopped = false
        logThrottled(`[AFK] البوت دخل الخادم ويراقب المتواجدين...`)

        // ابدأ القفز التلقائي (Anti-AFK)
        const startJumping = () => {
            if (stopped) return
            bot.setControlState('jump', true)
            setTimeout(() => bot.setControlState('jump', false), 300)
            jumpTimer = setTimeout(startJumping, randomMs(20000, 60000))
        }
        startJumping()

        // ابدأ مراقبة اللاعبين
        checkPlayers()
    })

    bot.on('end', () => {
        cleanup()
        // إعادة الاتصال تتم عن طريق index.js فلا نحتاج لكود إضافي هنا
    })

    bot.on('error', () => cleanup())
    bot.on('kicked', () => cleanup())
}

module.exports = setupLeaveRejoin
