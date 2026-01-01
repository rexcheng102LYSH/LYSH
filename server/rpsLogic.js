// ============================================
// Project Lysh Server - Rock Paper Scissors Logic
// ============================================

const CHOICES = ['rock', 'paper', 'scissors'];

/**
 * 验证猜拳选择是否有效
 * @param {string} choice - 选择
 */
function isValidChoice(choice) {
    return CHOICES.includes(choice);
}

/**
 * 提交猜拳选择
 * @param {object} room - 房间对象
 * @param {string} role - 'host' | 'guest'
 * @param {string} choice - 'rock' | 'paper' | 'scissors'
 */
function submitChoice(room, role, choice) {
    if (!isValidChoice(choice)) {
        return { success: false, reason: 'invalid_choice' };
    }
    
    if (role === 'host') {
        room.rps.hostChoice = choice;
    } else if (role === 'guest') {
        room.rps.guestChoice = choice;
    } else {
        return { success: false, reason: 'invalid_role' };
    }
    
    return { success: true };
}

/**
 * 检查双方是否都已选择
 * @param {object} room - 房间对象
 */
function bothChosen(room) {
    return room.rps.hostChoice !== null && room.rps.guestChoice !== null;
}

/**
 * 判定猜拳结果
 * @param {object} room - 房间对象
 */
function determineWinner(room) {
    const hostChoice = room.rps.hostChoice;
    const guestChoice = room.rps.guestChoice;
    
    if (!hostChoice || !guestChoice) {
        return { determined: false, reason: 'not_all_chosen' };
    }
    
    // 平局
    if (hostChoice === guestChoice) {
        return {
            determined: true,
            result: 'tie',
            hostChoice,
            guestChoice,
            winner: null
        };
    }
    
    // 判定胜负
    // rock > scissors, scissors > paper, paper > rock
    const hostWins = (
        (hostChoice === 'rock' && guestChoice === 'scissors') ||
        (hostChoice === 'scissors' && guestChoice === 'paper') ||
        (hostChoice === 'paper' && guestChoice === 'rock')
    );
    
    const winner = hostWins ? 'host' : 'guest';
    room.rps.winner = winner;
    
    return {
        determined: true,
        result: 'decided',
        hostChoice,
        guestChoice,
        winner
    };
}

/**
 * 重置猜拳（平局后重来）
 * @param {object} room - 房间对象
 */
function resetRPS(room) {
    room.rps.hostChoice = null;
    room.rps.guestChoice = null;
    room.rps.round++;
    
    return room.rps.round;
}

/**
 * 随机选择（超时时使用）
 */
function randomChoice() {
    return CHOICES[Math.floor(Math.random() * CHOICES.length)];
}

/**
 * 提交选边
 * @param {object} room - 房间对象
 * @param {string} side - 'black' | 'white'
 */
function submitSideChoice(room, side) {
    if (side !== 'black' && side !== 'white') {
        return { success: false, reason: 'invalid_side' };
    }
    
    const winner = room.rps.winner;
    if (!winner) {
        return { success: false, reason: 'no_rps_winner' };
    }
    
    // 胜者选择的颜色
    const winnerSide = side;
    const loserSide = side === 'black' ? 'white' : 'black';
    
    // 分配黑白
    if (winner === 'host') {
        room.players.black = winnerSide === 'black' ? room.players.host : room.players.guest;
        room.players.white = winnerSide === 'white' ? room.players.host : room.players.guest;
    } else {
        room.players.black = winnerSide === 'black' ? room.players.guest : room.players.host;
        room.players.white = winnerSide === 'white' ? room.players.guest : room.players.host;
    }
    
    room.status = 'playing';
    
    return {
        success: true,
        blackPlayer: room.players.black.nickname,
        whitePlayer: room.players.white.nickname,
        blackSocketId: room.players.black.id,
        whiteSocketId: room.players.white.id
    };
}

module.exports = {
    isValidChoice,
    submitChoice,
    bothChosen,
    determineWinner,
    resetRPS,
    randomChoice,
    submitSideChoice
};
