// ============================================
// Project Lysh - Online UI
// 联网对战 UI 组件
// [修复] 使用 style.display 而非 classList，避免与 showScreen 冲突
// ============================================

const OnlineUI = {
    
    /**
     * 显示联网对战主菜单
     */
    showOnlineMenu: function() {
        const modal = document.getElementById('onlineMenuModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏联网对战主菜单
     */
    hideOnlineMenu: function() {
        const modal = document.getElementById('onlineMenuModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 显示创建房间界面
     */
    showCreateRoom: function() {
        this.hideOnlineMenu();
        
        // 连接服务器
        this.showToast('正在连接服务器...');
        
        SocketClient.connect()
            .then(() => {
                // 初始化事件监听
                OnlineGame.init();
                
                // 获取昵称
                const nickname = this.promptNickname();
                if (nickname) {
                    OnlineGame.createRoom(nickname);
                }
            })
            .catch((error) => {
                console.error('Connection failed:', error);
                this.showToast('连接服务器失败，请确保服务器已启动');
            });
    },
    
    /**
     * 显示加入房间界面
     */
    showJoinRoom: function() {
        this.hideOnlineMenu();
        
        const modal = document.getElementById('joinRoomModal');
        if (modal) {
            modal.style.display = 'flex';
            // 清空输入框
            const input = document.getElementById('roomIdInput');
            if (input) input.value = '';
        }
    },
    
    /**
     * 隐藏加入房间界面
     */
    hideJoinRoom: function() {
        const modal = document.getElementById('joinRoomModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 确认加入房间
     */
    confirmJoinRoom: function() {
        const input = document.getElementById('roomIdInput');
        const roomId = input ? input.value.trim() : '';
        
        if (!roomId || roomId.length !== 6) {
            this.showToast('请输入6位房间号');
            return;
        }
        
        this.hideJoinRoom();
        this.showToast('正在连接服务器...');
        
        SocketClient.connect()
            .then(() => {
                OnlineGame.init();
                const nickname = this.promptNickname();
                if (nickname) {
                    OnlineGame.joinRoom(roomId, nickname);
                }
            })
            .catch((error) => {
                console.error('Connection failed:', error);
                this.showToast('连接服务器失败');
            });
    },
    
    /**
     * 获取昵称
     */
    promptNickname: function() {
        // 尝试从本地存储获取
        let nickname = localStorage.getItem('lysh_nickname');
        if (!nickname) {
            nickname = prompt('请输入你的昵称:', '玩家');
            if (nickname) {
                localStorage.setItem('lysh_nickname', nickname);
            }
        }
        return nickname || '玩家';
    },
    
    /**
     * 显示等待房间界面
     */
    showWaitingRoom: function(roomId) {
        const modal = document.getElementById('waitingRoomModal');
        if (modal) {
            modal.style.display = 'flex';
            
            const roomIdDisplay = document.getElementById('waitingRoomId');
            if (roomIdDisplay) {
                roomIdDisplay.textContent = roomId;
            }
        }
    },
    
    /**
     * 隐藏等待房间界面
     */
    hideWaitingRoom: function() {
        const modal = document.getElementById('waitingRoomModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 复制房间号
     */
    copyRoomId: function() {
        const roomIdDisplay = document.getElementById('waitingRoomId');
        if (roomIdDisplay) {
            const roomId = roomIdDisplay.textContent;
            navigator.clipboard.writeText(roomId).then(() => {
                this.showToast('房间号已复制');
            }).catch(() => {
                this.showToast('复制失败，请手动复制: ' + roomId);
            });
        }
    },
    
    /**
     * 显示猜拳界面
     */
    showRpsModal: function(timeout, round) {
        const modal = document.getElementById('rpsModal');
        if (modal) {
            modal.style.display = 'flex';
            
            // 重置状态
            const buttons = modal.querySelectorAll('.rps-btn');
            buttons.forEach(btn => {
                btn.classList.remove('selected', 'disabled');
            });
            
            // 更新轮次显示
            const roundDisplay = document.getElementById('rpsRound');
            if (roundDisplay) {
                roundDisplay.textContent = '第 ' + round + ' 轮';
            }
            
            // 重置对手状态
            this.updateRpsOpponentStatus(false);
            
            // 开始倒计时
            this.startRpsCountdown(timeout / 1000);
        }
    },
    
    /**
     * 猜拳倒计时
     */
    startRpsCountdown: function(seconds) {
        const display = document.getElementById('rpsCountdown');
        if (!display) return;
        
        let remaining = seconds;
        display.textContent = remaining;
        
        const timer = setInterval(() => {
            remaining--;
            display.textContent = remaining;
            
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    },
    
    /**
     * 选择猜拳
     */
    selectRps: function(choice) {
        // 禁用所有按钮
        const buttons = document.querySelectorAll('.rps-btn');
        buttons.forEach(btn => {
            btn.classList.add('disabled');
            if (btn.dataset.choice === choice) {
                btn.classList.add('selected');
            }
        });
        
        // 发送选择
        OnlineGame.sendRpsChoice(choice);
    },
    
    /**
     * 更新对手猜拳状态
     */
    updateRpsOpponentStatus: function(hasChosen) {
        const status = document.getElementById('rpsOpponentStatus');
        if (status) {
            status.textContent = hasChosen ? '对手已选择' : '等待对手选择...';
            status.classList.toggle('chosen', hasChosen);
        }
    },
    
    /**
     * 显示猜拳结果
     */
    showRpsResult: function(myChoice, opponentChoice, result, iWon) {
        const modal = document.getElementById('rpsModal');
        
        // 显示双方选择
        const myDisplay = document.getElementById('rpsMyChoice');
        const opponentDisplay = document.getElementById('rpsOpponentChoice');
        
        const choiceEmoji = { rock: '石头', paper: '布', scissors: '剪刀' };
        
        if (myDisplay) myDisplay.textContent = '你: ' + choiceEmoji[myChoice];
        if (opponentDisplay) opponentDisplay.textContent = '对手: ' + choiceEmoji[opponentChoice];
        
        // 显示结果
        const resultDisplay = document.getElementById('rpsResult');
        if (resultDisplay) {
            if (result === 'tie') {
                resultDisplay.textContent = '平局！重新猜拳...';
                resultDisplay.className = 'rps-result tie';
            } else {
                resultDisplay.textContent = iWon ? '你赢了！请选边' : '对手赢了，等待选边...';
                resultDisplay.className = 'rps-result ' + (iWon ? 'win' : 'lose');
            }
        }
        
        // 如果不是平局，2秒后关闭
        if (result !== 'tie') {
            setTimeout(() => {
                modal.style.display = 'none';
            }, 2000);
        }
    },
    
    /**
     * 显示选边界面
     */
    showSideChoiceModal: function(timeout) {
        const modal = document.getElementById('sideChoiceModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏选边界面
     */
    hideSideChoiceModal: function() {
        const modal = document.getElementById('sideChoiceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 选择先后手
     */
    selectSide: function(side) {
        this.hideSideChoiceModal();
        OnlineGame.sendSideChoice(side);
    },
    
    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal: function(iWon, message) {
        const modal = document.getElementById('onlineGameOverModal');
        if (modal) {
            modal.style.display = 'flex';
            
            const resultText = document.getElementById('onlineGameResult');
            if (resultText) {
                resultText.textContent = message;
                resultText.className = 'game-result ' + (iWon ? 'win' : 'lose');
            }
        }
    },
    
    /**
     * 隐藏游戏结束弹窗
     */
    hideGameOverModal: function() {
        const modal = document.getElementById('onlineGameOverModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 显示悔棋请求弹窗
     */
    showUndoRequestModal: function() {
        const modal = document.getElementById('undoRequestModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏悔棋请求弹窗
     */
    hideUndoRequestModal: function() {
        const modal = document.getElementById('undoRequestModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 回应悔棋请求
     */
    respondUndo: function(accept) {
        this.hideUndoRequestModal();
        OnlineGame.respondUndo(accept);
    },
    
    /**
     * 显示投降确认弹窗
     */
    showSurrenderConfirm: function() {
        const modal = document.getElementById('surrenderConfirmModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏投降确认弹窗
     */
    hideSurrenderConfirm: function() {
        const modal = document.getElementById('surrenderConfirmModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 确认投降
     */
    confirmSurrender: function() {
        this.hideSurrenderConfirm();
        OnlineGame.sendSurrender();
    },
    
    /**
     * 显示断线警告
     */
    showDisconnectWarning: function(timeout) {
        const warning = document.getElementById('disconnectWarning');
        if (warning) {
            warning.style.display = 'block';
            
            const countdown = document.getElementById('disconnectCountdown');
            if (countdown) {
                let remaining = Math.floor(timeout / 1000);
                countdown.textContent = remaining;
                
                const timer = setInterval(() => {
                    remaining--;
                    countdown.textContent = remaining;
                    if (remaining <= 0) {
                        clearInterval(timer);
                    }
                }, 1000);
            }
        }
    },
    
    /**
     * 隐藏断线警告
     */
    hideDisconnectWarning: function() {
        const warning = document.getElementById('disconnectWarning');
        if (warning) {
            warning.style.display = 'none';
        }
    },
    
    /**
     * 显示再来一局请求弹窗
     */
    showRematchRequestModal: function() {
        const modal = document.getElementById('rematchRequestModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏再来一局请求弹窗
     */
    hideRematchRequestModal: function() {
        const modal = document.getElementById('rematchRequestModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 回应再来一局
     */
    respondRematch: function(accept) {
        this.hideRematchRequestModal();
        if (accept) {
            OnlineGame.acceptRematch();
        } else {
            OnlineGame.leaveRoom();
        }
    },
    
    /**
     * 更新游戏 UI（显示对手信息等）
     */
    updateGameUI: function() {
        // 更新对手昵称显示
        const opponentName = document.getElementById('onlineOpponentName');
        if (opponentName && OnlineGame.opponentNickname) {
            opponentName.textContent = OnlineGame.opponentNickname;
        }
        
        // 更新我的颜色显示
        const myColorDisplay = document.getElementById('onlineMyColor');
        if (myColorDisplay && OnlineGame.myColor) {
            myColorDisplay.textContent = OnlineGame.myColor === 'black' ? '黑方' : '白方';
        }
    },
    
    /**
     * 隐藏所有弹窗
     */
    hideAllModals: function() {
        this.hideOnlineMenu();
        this.hideJoinRoom();
        this.hideWaitingRoom();
        this.hideSideChoiceModal();
        this.hideGameOverModal();
        this.hideUndoRequestModal();
        this.hideSurrenderConfirm();
        this.hideDisconnectWarning();
        this.hideRematchRequestModal();
        
        // 猜拳弹窗也用 style.display
        const rpsModal = document.getElementById('rpsModal');
        if (rpsModal) rpsModal.style.display = 'none';
    },
    
    /**
     * 显示提示消息
     */
    showToast: function(message) {
        // 复用现有的 toast 系统，或创建简单的提示
        if (typeof showToast === 'function') {
            showToast(message);
        } else {
            console.log('[Toast]', message);
            // 简单的 alert 备用
            // alert(message);
        }
    }
};

// 暴露到全局
window.OnlineUI = OnlineUI;
