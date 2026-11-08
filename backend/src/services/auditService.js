const AuditLog = require('../models/AuditLog');

/**
 * Dispatches and persists structured audit log records safely without throwing
 */
const logAuditEvent = async ({
  userId = null,
  userRole = 'system',
  action,
  entityType,
  entityId = '',
  details = {},
  ipAddress = ''
}) => {
  try {
    // Sanitize details: ensure no passwords or secrets are ever recorded
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.token;
    delete sanitizedDetails.jwt;

    await AuditLog.create({
      userId,
      userRole,
      action,
      entityType,
      entityId: String(entityId),
      details: sanitizedDetails,
      ipAddress
    });
  } catch (error) {
    // Audit logging should never bring down the primary transaction
    console.error('[AuditLog] Failed to record audit event:', error.message);
  }
};

module.exports = {
  logAuditEvent
};

