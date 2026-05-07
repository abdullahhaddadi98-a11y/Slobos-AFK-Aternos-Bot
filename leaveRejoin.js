function randomMs(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
}

function setupLeaveRejoin(bot, createBot) {
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

    function scheduleNextJump() {
        if (stopped || !bot.entity) return
        bot.setControlState('jump', true)
        jumpOffTimer = setTimeout(() => {
            bot.setControlState('jump', false)
        }, 300)
        const nextJump = randomMs(20000, 60000)
        jumpTimer = setTimeout(scheduleNextJump, nextJump)
    }

    // هذه هي الدالة الجديدة التي أضفتها لك
    function checkPlayers() {
        if (stopped) return
        if (bot.players && Object.keys(bot.players).length > 1) {
            console.log('[AFK] فيه لاعب دخل! البوت بيطلع الحين.')
            cleanup()
            bot.quit()
        } else {
            setTimeout(checkPlayers, 5000)
        }
    }

    bot.once('spawn', () => {
        reconnectAttempts = 0
        cleanup()
        stopped = false

        console.log('[AFK] البوت دخل ويراقب المتواجدين...')
        
        scheduleNextJump()
        checkPlayers() // تفعيل مراقبة اللاعبين هنا
    })

    bot.on('end', () => cleanup())
    bot.on('kicked', () => cleanup())
    bot.on('error', () => cleanup())
}

module.exports = setupLeaveRejoin
module.exports = setupLeaveRejoin
