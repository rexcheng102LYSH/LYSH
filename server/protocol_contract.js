// @ts-check

/**
 * Socket payload contract validators.
 * Keep these validators tolerant for backward compatibility.
 */

const CLIENT_EVENT_NAMES = Object.freeze({
    CREATE_ROOM: 'client:create_room',
    JOIN_ROOM: 'client:join_room',
    RPS_CHOICE: 'client:rps_choice',
    SIDE_CHOICE: 'client:side_choice',
    PLACE_PIECE: 'client:place_piece',
    USE_SKILL: 'client:use_skill',
    DRAFT_PICK: 'client:draft_pick',
    RESPOND_UNDO: 'client:respond_undo',
    LOBBY_CREATE: 'client:lobby_create',
    LOBBY_JOIN: 'client:lobby_join',
    RECONNECT: 'client:reconnect'
});

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

/**
 * @param {unknown} value
 * @returns {value is number}
 */
function isInteger(value) {
    return Number.isInteger(value);
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateCreateRoom(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.nickname)) return { valid: false, reason: 'invalid_nickname' };
    if (payload.pieceStyle !== undefined && typeof payload.pieceStyle !== 'string') {
        return { valid: false, reason: 'invalid_piece_style' };
    }
    if (payload.matchMode !== undefined && typeof payload.matchMode !== 'string') {
        return { valid: false, reason: 'invalid_match_mode' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateJoinRoom(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.roomId)) return { valid: false, reason: 'invalid_room_id' };
    if (!isNonEmptyString(payload.nickname)) return { valid: false, reason: 'invalid_nickname' };
    if (payload.pieceStyle !== undefined && typeof payload.pieceStyle !== 'string') {
        return { valid: false, reason: 'invalid_piece_style' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateRpsChoice(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    const allowed = ['rock', 'paper', 'scissors'];
    if (!allowed.includes(/** @type {string} */ (payload.choice))) {
        return { valid: false, reason: 'invalid_choice' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateSideChoice(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (payload.side !== 'black' && payload.side !== 'white') {
        return { valid: false, reason: 'invalid_side' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validatePlacePiece(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isInteger(payload.row) || !isInteger(payload.col)) {
        return { valid: false, reason: 'invalid_position' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateUseSkill(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.skillId)) return { valid: false, reason: 'invalid_skill_id' };
    if (payload.targets !== undefined && !isObject(payload.targets)) {
        return { valid: false, reason: 'invalid_targets' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateDraftPick(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.skillId)) return { valid: false, reason: 'invalid_skill_id' };
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateRespondUndo(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (typeof payload.accept !== 'boolean') return { valid: false, reason: 'invalid_accept' };
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateLobbyCreate(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.nickname)) return { valid: false, reason: 'invalid_nickname' };
    if (payload.rule !== undefined && typeof payload.rule !== 'string') {
        return { valid: false, reason: 'invalid_rule' };
    }
    if (payload.enabledSkills !== undefined && !Array.isArray(payload.enabledSkills)) {
        return { valid: false, reason: 'invalid_enabled_skills' };
    }
    if (payload.hasPassword !== undefined && typeof payload.hasPassword !== 'boolean') {
        return { valid: false, reason: 'invalid_has_password' };
    }
    if (payload.password !== undefined && payload.password !== null && typeof payload.password !== 'string') {
        return { valid: false, reason: 'invalid_password' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateLobbyJoin(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.roomId)) return { valid: false, reason: 'invalid_room_id' };
    if (!isNonEmptyString(payload.nickname)) return { valid: false, reason: 'invalid_nickname' };
    if (payload.password !== undefined && payload.password !== null && typeof payload.password !== 'string') {
        return { valid: false, reason: 'invalid_password' };
    }
    return { valid: true };
}

/**
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateReconnect(payload) {
    if (!isObject(payload)) return { valid: false, reason: 'invalid_payload' };
    if (!isNonEmptyString(payload.roomId)) return { valid: false, reason: 'invalid_room_id' };
    if (!isNonEmptyString(payload.oldSocketId)) return { valid: false, reason: 'invalid_old_socket_id' };
    return { valid: true };
}

const validators = Object.freeze({
    [CLIENT_EVENT_NAMES.CREATE_ROOM]: validateCreateRoom,
    [CLIENT_EVENT_NAMES.JOIN_ROOM]: validateJoinRoom,
    [CLIENT_EVENT_NAMES.RPS_CHOICE]: validateRpsChoice,
    [CLIENT_EVENT_NAMES.SIDE_CHOICE]: validateSideChoice,
    [CLIENT_EVENT_NAMES.PLACE_PIECE]: validatePlacePiece,
    [CLIENT_EVENT_NAMES.USE_SKILL]: validateUseSkill,
    [CLIENT_EVENT_NAMES.DRAFT_PICK]: validateDraftPick,
    [CLIENT_EVENT_NAMES.RESPOND_UNDO]: validateRespondUndo,
    [CLIENT_EVENT_NAMES.LOBBY_CREATE]: validateLobbyCreate,
    [CLIENT_EVENT_NAMES.LOBBY_JOIN]: validateLobbyJoin,
    [CLIENT_EVENT_NAMES.RECONNECT]: validateReconnect
});

/**
 * @param {string} eventName
 * @param {unknown} payload
 * @returns {{valid: boolean, reason?: string}}
 */
function validateClientPayload(eventName, payload) {
    const validator = validators[eventName];
    if (!validator) return { valid: true };
    return validator(payload);
}

module.exports = {
    CLIENT_EVENT_NAMES,
    validateClientPayload
};
