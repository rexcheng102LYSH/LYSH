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
            // 清空输入框并聚焦
            const input = document.getElementById('roomIdInput');
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 100);
            }
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
        
        // 兼容4位（新服务器）和6位（旧服务器）房间号
        if (!roomId || roomId.length < 4 || roomId.length > 6 || !/^\d+$/.test(roomId)) {
            this.showToast('请输入4-6位数字房间号');
            return;
        }
        
        this.hideJoinRoom();
        this.showToast('正在连接服务器...');
        
        const doJoin = () => {
            OnlineGame.init();
            const nickname = this.promptNickname();
            if (nickname) {
                OnlineGame.joinRoom(roomId, nickname);
            }
        };
        
        if (SocketClient.connected) {
            doJoin();
        } else {
            SocketClient.connect()
                .then(() => doJoin())
                .catch((error) => {
                    console.error('Connection failed:', error);
                    this.showToast('连接服务器失败');
                });
        }
    },
    
    /**
     * 获取昵称
     */
    promptNickname: function() {
        if (typeof OnlineGame !== 'undefined' && OnlineGame && typeof OnlineGame.getGuestNickname === 'function') {
            return OnlineGame.getGuestNickname();
        }
        return '游客0000';
    },

    /**
     * 统一渲染玩家ID（绿色高亮，可带后缀）
     * @param {HTMLElement|null} el
     * @param {string} idText
     * @param {string} suffix
     */
    appendPlayerIdNode: function(el, idText) {
        if (!el) return;
        const raw = typeof idText === 'string' ? idText.trim() : '';
        if (!raw) return;

        // 游客前缀不高亮，仅4位随机ID高亮
        const guestMatch = raw.match(/^游客([0-9A-Z]{4})$/);
        if (guestMatch) {
            el.appendChild(document.createTextNode('游客'));
            const guestIdSpan = document.createElement('span');
            guestIdSpan.className = 'player-id';
            guestIdSpan.textContent = guestMatch[1];
            el.appendChild(guestIdSpan);
            return;
        }

        const span = document.createElement('span');
        span.className = 'player-id';
        span.textContent = raw;
        el.appendChild(span);
    },

    renderPlayerIdLabel: function(el, idText, suffix) {
        if (!el) return;
        const id = typeof idText === 'string' ? idText.trim() : '';
        const tail = typeof suffix === 'string' ? suffix : '';
        if (!id) {
            el.textContent = tail;
            return;
        }
        el.textContent = '';
        this.appendPlayerIdNode(el, id);
        if (tail) {
            el.appendChild(document.createTextNode(tail));
        }
    },
    
    /**
     * 显示等待房间界面（PlayOK 风格）
     * @param {string} roomId - 房间号
     * @param {object} options - 可选参数 { hostName, rule, source }
     */
    showWaitingRoom: function(roomId, options) {
        var opts = options || {};
        var modal = document.getElementById('waitingRoomModal');
        if (!modal) return;
        
        modal.style.display = 'flex';
        
        // 房间号
        var roomIdEl = document.getElementById('waitingRoomId');
        if (roomIdEl) roomIdEl.textContent = roomId;
        
        // 房主名称
        var hostNameEl = document.getElementById('waitingHostName');
        if (hostNameEl) {
            var fallbackHost = (typeof OnlineGame !== 'undefined' && OnlineGame && typeof OnlineGame.getGuestNickname === 'function')
                ? OnlineGame.getGuestNickname()
                : '游客0000';
            this.renderPlayerIdLabel(hostNameEl, opts.hostName || fallbackHost, '');
        }
        
        // 游戏模式
        var ruleEl = document.getElementById('waitingRuleText');
        if (ruleEl) {
            var ruleMap = { 'single': '单局制', 'bo3': '三局两胜', 'bo5': '五局三胜' };
            ruleEl.textContent = ruleMap[opts.rule] || opts.rule || '单局制';
        }
        
        // 来源（公共大厅 / 房间号连线）
        var sourceEl = document.getElementById('waitingSourceText');
        if (sourceEl) {
            sourceEl.textContent = opts.source || '房间号连线';
        }
        
        // 重置对手槽位为等待状态
        this.updateWaitingGuest(null);
    },
    
    /**
     * 更新等待房间中对手的状态
     * @param {string|null} guestName - 对手名称，null 表示还在等待
     */
    updateWaitingGuest: function(guestName) {
        var guestSlot = document.getElementById('waitingGuestSlot');
        var guestNameEl = document.getElementById('waitingGuestName');
        var guestStatusEl = document.getElementById('waitingGuestStatus');
        
        if (guestName) {
            // 对手已加入
            if (guestSlot) guestSlot.className = 'player-slot player-guest joined';
            if (guestNameEl) this.renderPlayerIdLabel(guestNameEl, guestName, '');
            if (guestStatusEl) {
                guestStatusEl.className = 'player-slot-status joined';
                guestStatusEl.textContent = '已加入';
            }
        } else {
            // 等待中
            if (guestSlot) guestSlot.className = 'player-slot player-guest';
            if (guestNameEl) guestNameEl.textContent = '等待对手加入...';
            if (guestStatusEl) {
                guestStatusEl.className = 'player-slot-status';
                guestStatusEl.innerHTML = '<span class="waiting-pulse"></span>';
            }
        }
    },
    
    /**
     * 隐藏等待房间界面
     */
    hideWaitingRoom: function() {
        var modal = document.getElementById('waitingRoomModal');
        if (modal) {
            modal.style.display = 'none';
        }
    },
    
    /**
     * 复制房间号
     */
    copyRoomId: function() {
        var roomIdEl = document.getElementById('waitingRoomId');
        if (roomIdEl) {
            var roomId = roomIdEl.textContent;
            navigator.clipboard.writeText(roomId).then(() => {
                this.showToast('房间号已复制');
            }).catch(() => {
                this.showToast('复制失败，请手动复制: ' + roomId);
            });
        }
    },
    
    /**
     * 复制邀请链接（Zeabur 线上链接 + 房间号）
     */
    copyInviteLink: function() {
        var roomIdEl = document.getElementById('waitingRoomId');
        var roomId = roomIdEl ? roomIdEl.textContent : '';
        // 生成邀请链接：线上游戏地址
        var baseUrl = 'https://lysh-server.zeabur.app';
        var link = baseUrl + '?join=' + roomId;
        navigator.clipboard.writeText(link).then(() => {
            this.showToast('邀请链接已复制，发给朋友即可加入');
        }).catch(() => {
            this.showToast('复制失败: ' + link);
        });
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

    showDraftModal: function(availableSkills, myColor, onPick) {
        if (typeof showScreen === 'function') {
            showScreen('draft');
        }
        if (this._draftCtx && this._draftCtx.timerId) {
            this.stopDraftCountdown();
        }
        const grid = document.getElementById('skillGrid');
        const title = document.getElementById('draftTitle');
        if (!grid) return;

        grid.innerHTML = '';
        const skills = Array.isArray(availableSkills) && availableSkills.length > 0
            ? availableSkills
            : (typeof SKILL_IDS !== 'undefined' ? SKILL_IDS : []);
        this._draftCtx = {
            availableSkills: skills.slice(),
            myColor,
            onPick,
            draftState: null,
            timerId: null,
            deadlineTs: null
        };
        skills.forEach((sid) => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.dataset.skillId = sid;
            const meta = typeof t === 'function' ? t(sid, 'skills') : { name: sid, desc: sid };
            const iconSvg = (typeof SKILL_ICONS !== 'undefined' ? SKILL_ICONS[sid] : '') || '';
            card.innerHTML = `
                <div class="skill-icon">${iconSvg}</div>
                <div class="skill-info">
                    <div class="skill-title">${meta.name || sid}</div>
                    <div class="skill-desc">${meta.desc || ''}</div>
                </div>
            `;
            card.onclick = () => {
                if (typeof onPick === 'function') onPick(sid);
                grid.querySelectorAll('.skill-card').forEach((el) => {
                    el.classList.add('disabled');
                    el.onclick = null;
                });
                card.classList.add('selected');
            };
            grid.appendChild(card);
        });
        if (title) {
            title.textContent = '\u6280\u80FD\u8349\u7A3F\u51C6\u5907\u4E2D...';
        }
    },

    updateDraftState: function(draftState, myColor) {
        const grid = document.getElementById('skillGrid');
        if (!draftState || !grid || !this._draftCtx) return;

        const picker = draftState.currentPicker;
        this._draftCtx.myColor = myColor;
        this._draftCtx.draftState = {
            picked: draftState.picked || {},
            currentPicker: picker || null,
            remainMs: Number.isFinite(draftState.remainMs) ? draftState.remainMs : 0
        };
        if (picker) {
            this._draftCtx.deadlineTs = Date.now() + this._draftCtx.draftState.remainMs;
            this.startDraftCountdown();
        } else {
            this.stopDraftCountdown();
        }
        this.renderDraftTitle();

        const pickedSet = new Set(Object.values(draftState.picked || {}).filter(Boolean));
        const canPick = (myColor === picker);
        grid.innerHTML = '';

        this._draftCtx.availableSkills.forEach((sid) => {
            const card = document.createElement('div');
            card.className = 'skill-card';
            card.dataset.skillId = sid;
            const meta = typeof t === 'function' ? t(sid, 'skills') : { name: sid, desc: sid };
            const iconSvg = (typeof SKILL_ICONS !== 'undefined' ? SKILL_ICONS[sid] : '') || '';
            card.innerHTML = `
                <div class="skill-icon">${iconSvg}</div>
                <div class="skill-info">
                    <div class="skill-title">${meta.name || sid}</div>
                    <div class="skill-desc">${meta.desc || ''}</div>
                </div>
            `;
            const picked = pickedSet.has(sid);
            if (picked) {
                card.classList.add('selected');
            } else if (canPick) {
                card.onclick = () => {
                    if (typeof this._draftCtx.onPick === 'function') this._draftCtx.onPick(sid);
                };
            } else {
                card.classList.add('disabled');
            }
            grid.appendChild(card);
        });
    },

    renderDraftTitle: function() {
        const title = document.getElementById('draftTitle');
        const ctx = this._draftCtx;
        if (!title || !ctx || !ctx.draftState) return;

        const myColor = ctx.myColor;
        const picker = ctx.draftState.currentPicker;
        const mySide = myColor === 'black' ? '\u5148\u624B\u65B9' : '\u540E\u624B\u65B9';
        const pickerSide = picker === 'black' ? '\u5148\u624B\u65B9' : (picker === 'white' ? '\u540E\u624B\u65B9' : '');
        const remainMs = ctx.deadlineTs ? Math.max(0, ctx.deadlineTs - Date.now()) : Number(ctx.draftState.remainMs || 0);
        const remainSec = Math.max(0, Math.ceil(remainMs / 1000));

        if (!picker) {
            title.textContent = '\u53CC\u65B9\u6280\u80FD\u5DF2\u786E\u8BA4\uFF0C\u6B63\u5728\u8FDB\u5165\u5BF9\u5C40...';
            return;
        }
        if (myColor === picker) {
            title.textContent = `\u60A8\u662F${mySide}\uFF0C\u8BF7\u60A8\u9009\u62E9\u6280\u80FD\uFF08${remainSec}\uFF09`;
        } else {
            title.textContent = `\u60A8\u662F${mySide}\uFF0C\u5F53\u524D${pickerSide}\u6B63\u5728\u9009\u62E9\u6280\u80FD\uFF08${remainSec}\uFF09`;
        }
    },

    startDraftCountdown: function() {
        const ctx = this._draftCtx;
        if (!ctx) return;
        this.stopDraftCountdown();
        ctx.timerId = setInterval(() => {
            if (!this._draftCtx || !this._draftCtx.draftState) return;
            this.renderDraftTitle();
            if (this._draftCtx.deadlineTs && Date.now() >= this._draftCtx.deadlineTs) {
                this.stopDraftCountdown();
            }
        }, 250);
    },

    stopDraftCountdown: function() {
        const ctx = this._draftCtx;
        if (!ctx || !ctx.timerId) return;
        clearInterval(ctx.timerId);
        ctx.timerId = null;
    },

    hideDraftModal: function() {
        // Draft uses its own screen and is closed by game_start -> game transition.
        this.stopDraftCountdown();
        this._draftCtx = null;
    },

    /**
     * Show game over modal
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
     * 渲染悔棋请求文本（ID 高亮）
     */
    renderUndoRequestText: function(textEl, requesterName, remainSec) {
        if (!textEl) return;
        const hasRequesterName = typeof requesterName === 'string' && requesterName.trim();
        if (!hasRequesterName) {
            if (Number.isFinite(remainSec)) {
                textEl.textContent = `对手请求悔棋，是否同意？（${remainSec}）`;
            } else {
                textEl.textContent = '对手请求悔棋，是否同意？';
            }
            return;
        }

        textEl.textContent = '';
        textEl.append(document.createTextNode('【'));
        this.appendPlayerIdNode(textEl, requesterName.trim());
        textEl.append(document.createTextNode('】表示自己手抖了，想要悔棋！'));
        if (Number.isFinite(remainSec)) {
            textEl.append(document.createTextNode(`（${remainSec}）`));
        }
    },
    
    /**
     * 显示悔棋请求弹窗
     */
    showUndoRequestModal: function(data) {
        const modal = document.getElementById('undoRequestModal');
        const textEl = document.getElementById('undoRequestText');
        const timeoutMs = data && Number.isFinite(data.timeoutMs) ? data.timeoutMs : 0;
        const requesterName = data && typeof data.requesterName === 'string' ? data.requesterName : '';
        const baseMessage = data && data.message ? data.message : '对手请求悔棋，是否同意？';
        this.hideUndoRequestModal();
        if (textEl) {
            if (timeoutMs > 0) {
                const startedAt = Date.now();
                const render = () => {
                    const remainSec = Math.max(0, Math.ceil((timeoutMs - (Date.now() - startedAt)) / 1000));
                    if (requesterName && requesterName.trim()) {
                        this.renderUndoRequestText(textEl, requesterName, remainSec);
                    } else {
                        textEl.textContent = `${baseMessage}（${remainSec}）`;
                    }
                };
                render();
                this._undoRequestTimer = setInterval(render, 250);
            } else {
                if (requesterName && requesterName.trim()) {
                    this.renderUndoRequestText(textEl, requesterName);
                } else {
                    textEl.textContent = baseMessage;
                }
            }
        }
        if (modal) {
            modal.style.display = 'flex';
        }
    },
    
    /**
     * 隐藏悔棋请求弹窗
     */
    hideUndoRequestModal: function() {
        if (this._undoRequestTimer) {
            clearInterval(this._undoRequestTimer);
            this._undoRequestTimer = null;
        }
        const modal = document.getElementById('undoRequestModal');
        const textEl = document.getElementById('undoRequestText');
        if (modal) {
            modal.style.display = 'none';
        }
        if (textEl) {
            textEl.textContent = '对手请求悔棋，是否同意？';
        }
    },

    showUndoPendingModal: function(timeoutMs) {
        const modal = document.getElementById('undoPendingModal');
        const textEl = document.getElementById('undoPendingText');
        const totalMs = Number.isFinite(timeoutMs) ? timeoutMs : 10000;
        const startAt = Date.now();

        this.hideUndoPendingModal();
        if (!modal || !textEl) {
            this.showToast('正在看对方脸色中...');
            return;
        }

        modal.style.display = 'flex';
        const render = () => {
            const elapsed = Date.now() - startAt;
            const remainSec = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));
            const dots = '.'.repeat((Math.floor(elapsed / 500) % 3) + 1);
            textEl.textContent = `正在看对方脸色中${dots}（${remainSec}）`;
        };
        render();
        this._undoPendingTimer = setInterval(render, 250);
    },

    hideUndoPendingModal: function() {
        if (this._undoPendingTimer) {
            clearInterval(this._undoPendingTimer);
            this._undoPendingTimer = null;
        }
        const modal = document.getElementById('undoPendingModal');
        const textEl = document.getElementById('undoPendingText');
        if (modal) {
            modal.style.display = 'none';
        }
        if (textEl) {
            textEl.textContent = '正在看对方脸色中...';
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
            this.renderPlayerIdLabel(opponentName, OnlineGame.opponentNickname, '');
        }
        
        // 更新我的颜色显示
        const myColorDisplay = document.getElementById('onlineMyColor');
        if (myColorDisplay && OnlineGame.myColor) {
            myColorDisplay.textContent = OnlineGame.myColor === 'black' ? '黑方' : '白方';
        }

        this.updateMatchScore(OnlineGame.matchState, OnlineGame.role);
    },

    updateMatchScore: function(matchState, myRole) {
        const scoreBoard = document.getElementById('scoreBoard');
        if (!scoreBoard) return;

        if (!matchState || matchState.mode !== 'bo3') {
            if (typeof GameState !== 'undefined' && GameState.gameMode === 'online') {
                scoreBoard.style.display = 'none';
            }
            return;
        }

        const scores = matchState.scores || { host: 0, guest: 0 };
        const role = myRole === 'guest' ? 'guest' : 'host';
        const enemyRole = role === 'host' ? 'guest' : 'host';
        const myScore = Number(scores[role] || 0);
        const enemyScore = Number(scores[enemyRole] || 0);
        const overTag = matchState.over ? ' 已结束' : '';

        scoreBoard.style.display = 'block';
        scoreBoard.textContent = `BO3 你 (${myScore}) : (${enemyScore}) 对手${overTag}`;
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
        this.hideUndoPendingModal();
        this.hideSurrenderConfirm();
        this.hideDisconnectWarning();
        this.hideRematchRequestModal();
        this.hideCreateLobbyRoom();
        this.hideLobbyPassword();
        
        // 猜拳弹窗也用 style.display
        const rpsModal = document.getElementById('rpsModal');
        if (rpsModal) rpsModal.style.display = 'none';
    },
    
    // ============================================
    // 虚拟小键盘通用方法（键盘+鼠标双模式）
    // ============================================
    
    /**
     * 小键盘点击输入数字（写入对应的可见text input）
     * @param {string} digit - 输入的数字
     * @param {string} target - 目标类型：'roomId'(默认) 或 'lobbyPwd'
     */
    numpadInput: function(digit, target) {
        target = target || 'roomId';
        const inputId = (target === 'lobbyPwd') ? 'lobbyPasswordJoinInput' : 'roomIdInput';
        
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const maxLen = parseInt(input.maxLength) || 6;
        if (input.value.length >= maxLen) return;
        
        input.value += digit;
        input.focus();
    },
    
    /**
     * 小键盘删除最后一位
     * @param {string} target - 目标类型
     */
    numpadDelete: function(target) {
        target = target || 'roomId';
        const inputId = (target === 'lobbyPwd') ? 'lobbyPasswordJoinInput' : 'roomIdInput';
        
        const input = document.getElementById(inputId);
        if (!input || input.value.length === 0) return;
        
        input.value = input.value.slice(0, -1);
        input.focus();
    },
    
    // ============================================
    // 公共大厅相关功能
    // ============================================
    
    // 大厅创建房间的临时状态
    _lobbyConfig: {
        rule: 'single',           // 'single' | 'bo3'
        enabledSkills: [],        // 启用的技能ID列表
        hasPassword: false,
        password: ''
    },
    
    // 当前要加入的密码房间ID
    _pendingJoinRoomId: null,
    
    /**
     * 进入大厅时连接服务器并获取房间列表
     * 如果已连接则直接刷新列表
     */
    enterLobby: function() {
        if (SocketClient.connected) {
            // 已连接，直接刷新房间列表
            OnlineGame.init();
            SocketClient.emit('client:lobby_list');
            return;
        }
        this.showToast('正在连接服务器...');
        SocketClient.connect()
            .then(() => {
                OnlineGame.init();
                SocketClient.emit('client:lobby_list');
                this.showToast('已连接');
            })
            .catch((error) => {
                console.error('[Lobby] Connection failed:', error);
                this.showToast('连接失败，请先启动服务器 (node server)');
            });
    },
    
    /**
     * 离开大厅
     */
    leaveLobby: function() {
        SocketClient.emit('client:lobby_leave');
    },
    
    /**
     * 刷新房间列表
     */
    refreshLobby: function() {
        if (!SocketClient.connected) {
            // 未连接则先连接
            this.enterLobby();
            return;
        }
        SocketClient.emit('client:lobby_list');
        this.showToast('正在刷新...');
    },
    
    /**
     * 渲染房间列表
     */
    renderRoomList: function(rooms) {
        const container = document.getElementById('lobbyRoomList');
        const emptyHint = document.getElementById('lobbyEmpty');
        if (!container) return;
        
        // 清空现有内容
        container.innerHTML = '';
        
        if (!rooms || rooms.length === 0) {
            // 显示空提示
            const empty = document.createElement('div');
            empty.className = 'lobby-empty';
            empty.textContent = '暂无房间，快来创建一个吧！';
            container.appendChild(empty);
            return;
        }
        
        rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'lobby-room-card';
            
            // 房间信息
            const info = document.createElement('div');
            info.className = 'lobby-room-info';
            
            const name = document.createElement('div');
            name.className = 'lobby-room-name';
            this.renderPlayerIdLabel(name, room.hostName || '游客0000', ' 的房间');
            
            const tags = document.createElement('div');
            tags.className = 'lobby-room-tags';
            
            // 规则标签
            const ruleTag = document.createElement('span');
            ruleTag.className = 'lobby-tag';
            ruleTag.textContent = room.rule === 'bo3' ? 'BO3' : '单局';
            tags.appendChild(ruleTag);
            
            // 技能数量标签
            const skillTag = document.createElement('span');
            skillTag.className = 'lobby-tag skill';
            const skillCount = room.enabledSkills ? room.enabledSkills.length : 10;
            if (skillCount < 2) {
                skillTag.textContent = '纯净模式';
            } else {
                skillTag.textContent = skillCount + '个技能';
            }
            tags.appendChild(skillTag);
            
            // 密码标签
            if (room.hasPassword) {
                const lockTag = document.createElement('span');
                lockTag.className = 'lobby-tag lock';
                lockTag.textContent = '有密码';
                tags.appendChild(lockTag);
            }
            
            // 人数
            const players = document.createElement('div');
            players.className = 'lobby-room-players';
            players.textContent = room.playerCount + '/2';
            
            info.appendChild(name);
            info.appendChild(tags);
            
            card.appendChild(info);
            card.appendChild(players);
            
            // 加入按钮
            const joinBtn = document.createElement('button');
            joinBtn.className = 'lobby-join-btn';
            if (room.playerCount >= 2) {
                joinBtn.textContent = '已满';
                joinBtn.disabled = true;
                joinBtn.classList.add('full');
            } else {
                joinBtn.textContent = '加入';
                joinBtn.onclick = () => {
                    if (room.hasPassword) {
                        // 需要输入密码
                        this._pendingJoinRoomId = room.roomId;
                        this.showLobbyPassword();
                    } else {
                        this.joinLobbyRoom(room.roomId);
                    }
                };
            }
            card.appendChild(joinBtn);
            
            container.appendChild(card);
        });
    },
    
    /**
     * 加入大厅房间
     */
    joinLobbyRoom: function(roomId, password) {
        const nickname = this.promptNickname();
        if (!nickname) return;
        
        if (!SocketClient.connected) {
            this.showToast('未连接到服务器');
            return;
        }

        const payload = {
            roomId: roomId,
            nickname: nickname
        };
        if (typeof password === 'string' && password.trim().length > 0) {
            payload.password = password.trim();
        }
        SocketClient.emit('client:lobby_join', payload);
    },
    
    /**
     * 显示创建大厅房间弹窗
     */
    showCreateLobbyRoom: function() {
        // 重置配置
        this._lobbyConfig = {
            rule: 'single',
            enabledSkills: SKILL_IDS ? [...SKILL_IDS] : ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'],
            hasPassword: false,
            password: ''
        };
        
        // 渲染技能选择网格
        this.renderLobbySkillGrid();
        
        // 重置UI状态
        document.getElementById('lobbyRuleSingle').classList.add('active');
        document.getElementById('lobbyRuleBO3').classList.remove('active');
        document.getElementById('lobbyPasswordToggle').checked = false;
        document.getElementById('lobbyPasswordInput').style.display = 'none';
        document.getElementById('lobbyPasswordInput').value = '';
        document.getElementById('lobbyPasswordLabel').textContent = '公开房间';
        this.updateLobbySkillHint();
        
        const modal = document.getElementById('createLobbyRoomModal');
        if (modal) modal.style.display = 'flex';
    },
    
    /**
     * 隐藏创建大厅房间弹窗
     */
    hideCreateLobbyRoom: function() {
        const modal = document.getElementById('createLobbyRoomModal');
        if (modal) modal.style.display = 'none';
    },
    
    /**
     * 设置大厅房间规则
     */
    setLobbyRule: function(rule) {
        this._lobbyConfig.rule = rule;
        document.getElementById('lobbyRuleSingle').classList.toggle('active', rule === 'single');
        document.getElementById('lobbyRuleBO3').classList.toggle('active', rule === 'bo3');
    },
    
    /**
     * 渲染技能选择网格
     */
    renderLobbySkillGrid: function() {
        const grid = document.getElementById('lobbySkillGrid');
        if (!grid) return;
        grid.innerHTML = '';
        
        // 技能名称映射
        const skillNames = {
            'double': '双连', 'voodoo': '巫毒', 'move_self': '移己',
            'move_enemy': '移敌', 'zone': '领地', 'bomb': '炸弹',
            'god_hand': '神手', 'chaos': '混沌', 'short_battle': '短兵',
            'swap': '交换'
        };
        
        const allSkills = SKILL_IDS || ['double','voodoo','move_self','move_enemy','zone','bomb','god_hand','chaos','short_battle','swap'];
        
        allSkills.forEach(id => {
            const btn = document.createElement('button');
            btn.className = 'lobby-skill-btn';
            if (this._lobbyConfig.enabledSkills.includes(id)) {
                btn.classList.add('active');
            }
            btn.textContent = skillNames[id] || id;
            btn.dataset.skillId = id;
            btn.onclick = () => {
                this.toggleLobbySkill(id, btn);
            };
            grid.appendChild(btn);
        });
    },
    
    /**
     * 切换技能启用状态
     */
    toggleLobbySkill: function(skillId, btn) {
        const idx = this._lobbyConfig.enabledSkills.indexOf(skillId);
        if (idx !== -1) {
            this._lobbyConfig.enabledSkills.splice(idx, 1);
            btn.classList.remove('active');
        } else {
            this._lobbyConfig.enabledSkills.push(skillId);
            btn.classList.add('active');
        }
        this.updateLobbySkillHint();
    },
    
    /**
     * 更新技能提示文字
     */
    updateLobbySkillHint: function() {
        const hint = document.getElementById('lobbySkillHint');
        if (!hint) return;
        const count = this._lobbyConfig.enabledSkills.length;
        const total = SKILL_IDS ? SKILL_IDS.length : 10;
        if (count < 2) {
            hint.textContent = '启用少于2个技能 = 纯净五子棋模式';
            hint.style.color = '#e8a838';
        } else {
            hint.textContent = '已启用 ' + count + '/' + total + ' 个技能';
            hint.style.color = '';
        }
    },
    
    /**
     * 切换密码开关
     */
    toggleLobbyPassword: function() {
        const toggle = document.getElementById('lobbyPasswordToggle');
        const input = document.getElementById('lobbyPasswordInput');
        const label = document.getElementById('lobbyPasswordLabel');
        
        this._lobbyConfig.hasPassword = toggle.checked;
        
        if (toggle.checked) {
            input.style.display = 'block';
            label.textContent = '密码房间';
            input.focus();
        } else {
            input.style.display = 'none';
            input.value = '';
            label.textContent = '公开房间';
            this._lobbyConfig.password = '';
        }
    },
    
    /**
     * 确认创建大厅房间
     * 使用 Socket.IO 回调确认机制，精确检测服务器是否支持大厅功能
     */
    confirmCreateLobbyRoom: function() {
        const cfg = this._lobbyConfig;
        
        // 密码验证
        if (cfg.hasPassword) {
            const pwd = document.getElementById('lobbyPasswordInput').value.trim();
            if (pwd.length !== 4) {
                this.showToast('请输入4位数字密码');
                return;
            }
            cfg.password = pwd;
        }
        
        this.hideCreateLobbyRoom();
        
        // 获取昵称
        const nickname = this.promptNickname();
        if (!nickname) return;
        
        this.showToast('正在创建房间...');
        
        // 实际发送创建请求（带回调确认）
        const doCreate = () => {
            if (!SocketClient.socket || !SocketClient.connected) {
                this.showToast('未连接到服务器');
                return;
            }
            
            const emitData = {
                nickname: nickname,
                rule: cfg.rule,
                enabledSkills: cfg.enabledSkills,
                hasPassword: cfg.hasPassword,
                password: cfg.password
            };
            console.log('[Lobby] Emitting client:lobby_create', emitData);
            
            // 标记是否已收到响应
            let responded = false;
            
            // 使用 Socket.IO 回调确认：服务器处理后直接回调
            SocketClient.socket.emit('client:lobby_create', emitData, (response) => {
                responded = true;
                if (this._createTimeout) {
                    clearTimeout(this._createTimeout);
                    this._createTimeout = null;
                }
                if (response && response.success) {
                    console.log('[Lobby] Room created via callback:', response);
                    // onLobbyRoomCreated 会通过事件触发，这里无需重复处理
                } else {
                    this.showToast('创建失败: ' + (response && response.message || '未知错误'));
                }
            });
            
            // 5秒超时：如果回调和事件都没响应，说明服务器不支持
            this._createTimeout = setTimeout(() => {
                if (!responded) {
                    this.showToast('服务器不支持大厅功能，请重启服务器 (cd server && node index.js)');
                }
            }, 5000);
        };
        
        if (SocketClient.connected) {
            OnlineGame.init();
            doCreate();
        } else {
            SocketClient.connect()
                .then(() => {
                    OnlineGame.init();
                    doCreate();
                })
                .catch((error) => {
                    console.error('[Lobby] Connection failed:', error);
                    this.showToast('连接失败，请先启动服务器');
                });
        }
    },
    
    /**
     * 显示密码输入弹窗
     */
    showLobbyPassword: function() {
        const modal = document.getElementById('lobbyPasswordModal');
        if (modal) {
            modal.style.display = 'flex';
            const input = document.getElementById('lobbyPasswordJoinInput');
            if (input) {
                input.value = '';
                setTimeout(() => input.focus(), 100);
            }
        }
    },
    
    /**
     * 隐藏密码输入弹窗
     */
    hideLobbyPassword: function() {
        const modal = document.getElementById('lobbyPasswordModal');
        if (modal) modal.style.display = 'none';
        this._pendingJoinRoomId = null;
    },
    
    /**
     * 确认密码加入房间
     */
    confirmLobbyPassword: function() {
        const input = document.getElementById('lobbyPasswordJoinInput');
        const pwd = input ? input.value.trim() : '';
        
        if (pwd.length !== 4) {
            this.showToast('请输入4位数字密码');
            return;
        }
        
        const roomId = this._pendingJoinRoomId;
        this.hideLobbyPassword();
        this.joinLobbyRoom(roomId, pwd);
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
