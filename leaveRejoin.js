function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, createBot) {
    // التايمرز الأساسية
    let leaveTimer = null
    let jumpTimer = null
    let jumpOffTimer = null
    let reconnectTimer = null

    // الحالة
    let stopped = false
    let reconnectAttempts = 0
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

    function scheduleNextJump() {
        if (stopped || !bot.entity) return
        bot.setControlState('jump', true)
        jumpOffTimer = setTimeout(() => {
            if (!stopped) bot.setControlState('jump', false)
        }, 300)
        const nextJump = randomMs(20000, 120000)
        jumpTimer = setTimeout(scheduleNextJump, nextJump)
    }

    // الدالة المسؤولة عن فحص اللاعبين (التي طلبتها)
    function checkPlayers() {
        if (stopped || !bot.players) return
        
        // إذا كان عدد اللاعبين أكثر من 1 (يعني فيه أحد غير البوت)
        if (Object.keys(bot.players).length > 1) {
            console.log('[AFK] فيه لاعب دخل! البوت بيطلع الحين.')
            cleanup()
            bot.quit()
        } else {
            // فحص كل 5 ثواني
            setTimeout(checkPlayers, 5000)
        }
    }

    bot.once('spawn', () => {
        reconnectAttempts = 0
        cleanup()
        stopped = false
        
        console.log('[AFK] البوت دخل ويراقب المتواجدين...')
        
        scheduleNextJump()
        // تفعيل ميزة المراقبة
        setTimeout(checkPlayers, 2000) 
    })

    bot.on('end', () => cleanup())
    bot.on('kicked', () => cleanup())
    bot.on('error', () => cleanup())
}

module.exports = setupLeaveRejoin
