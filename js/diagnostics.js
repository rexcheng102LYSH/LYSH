// @ts-check

(function () {
    const MAX_LOGS = 300;
    const buffer = [];

    function nowIso() {
        return new Date().toISOString();
    }

    function makeTraceId(prefix) {
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function push(type, payload) {
        buffer.push({
            type,
            at: nowIso(),
            payload
        });
        if (buffer.length > MAX_LOGS) {
            buffer.shift();
        }
    }

    const diagnostics = {
        newTraceId: function newTraceId(prefix) {
            return makeTraceId(prefix || 'lysh');
        },
        captureClientError: function captureClientError(kind, message, extra) {
            push('client_error', { kind, message, extra: extra || null });
        },
        reportNetwork: function reportNetwork(direction, event, traceId, detail) {
            push('network', {
                direction,
                event,
                traceId: traceId || null,
                detail: detail || null
            });
        },
        reportStateWarning: function reportStateWarning(prop, reason, value) {
            push('state_warning', { prop, reason, value });
        },
        getRecentLogs: function getRecentLogs(limit) {
            const size = Number.isInteger(limit) && limit > 0 ? limit : 50;
            return buffer.slice(-size);
        }
    };

    window.LYSH_DIAGNOSTICS = diagnostics;

    window.addEventListener('error', function onWindowError(event) {
        diagnostics.captureClientError(
            'window.error',
            event.message || 'Unknown error',
            {
                file: event.filename || null,
                line: event.lineno || null,
                col: event.colno || null
            }
        );
    });

    window.addEventListener('unhandledrejection', function onUnhandledRejection(event) {
        const reason = event.reason;
        diagnostics.captureClientError(
            'window.unhandledrejection',
            reason && reason.message ? reason.message : String(reason),
            {
                stack: reason && reason.stack ? reason.stack : null
            }
        );
    });
})();
