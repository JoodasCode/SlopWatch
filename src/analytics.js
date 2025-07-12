#!/usr/bin/env node

// Enhanced Analytics for SlopWatch MCP Server
// Sends data to Vercel-hosted analytics API

class SlopWatchAnalytics {
  constructor() {
    this.apiUrl = process.env.ANALYTICS_API_URL || 'https://slopdetector-nu.vercel.app/api/analytics';
    this.analyticsSecret = process.env.ANALYTICS_SECRET || 'b3ad9c84a61a0abd783c237584fb5dfa09f5dafca198bc950cb3e213a68b37c9';
    this.userId = this.generateUserId();
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.ANALYTICS_ENABLED !== 'false';
    
    if (this.isEnabled) {
      console.log('📊 SlopWatch Analytics enabled');
    }
  }

  generateUserId() {
    // Generate a persistent but anonymous user ID
    const crypto = require('crypto');
    const os = require('os');
    const userInfo = `${os.hostname()}-${os.userInfo().username}`;
    return crypto.createHash('sha256').update(userInfo).digest('hex').substring(0, 16);
  }

  generateSessionId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async sendEvent(event, data = {}) {
    if (!this.isEnabled) return;

    try {
      const payload = {
        event,
        data: {
          ...data,
          userId: this.userId,
          sessionId: this.sessionId,
          timestamp: Date.now(),
          version: '2.2.0'
        }
      };

      // Fire and forget - don't wait for response
      fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Analytics-Secret': this.analyticsSecret
        },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Silently fail - analytics shouldn't break functionality
      });

    } catch (error) {
      // Silently fail - analytics shouldn't break functionality
    }
  }

  // Server lifecycle events
  trackServerStart(version, transport, tools) {
    this.sendEvent('server_start', {
      version,
      transport,
      tools,
      nodeVersion: process.version,
      platform: process.platform
    });
  }

  trackServerStop() {
    this.sendEvent('server_stop', {
      uptime: process.uptime()
    });
  }

  // Tool usage events
  trackToolUsage(toolName, success, duration) {
    this.sendEvent('tool_usage', {
      tool: toolName,
      success,
      duration,
      timestamp: Date.now()
    });
  }

  // Claim events
  trackClaim(claimId, claimType, filesCount) {
    this.sendEvent('claim_registered', {
      claimId,
      claimType,
      filesCount,
      timestamp: Date.now()
    });
  }

  trackVerification(claimId, success, confidence, evidence) {
    this.sendEvent('verification_complete', {
      claimId,
      success,
      confidence,
      evidenceCount: evidence ? evidence.length : 0,
      timestamp: Date.now()
    });
  }

  // Rules setup events
  trackRulesSetup(success, existingRules) {
    this.sendEvent('rules_setup', {
      success,
      hadExistingRules: existingRules,
      timestamp: Date.now()
    });
  }

  // Error tracking
  trackError(error, context) {
    this.sendEvent('error', {
      error: error.message,
      context,
      stack: error.stack ? error.stack.substring(0, 500) : null,
      timestamp: Date.now()
    });
  }

  // Performance tracking
  trackPerformance(operation, duration, success) {
    this.sendEvent('performance', {
      operation,
      duration,
      success,
      timestamp: Date.now()
    });
  }
}

// Create singleton instance
const analytics = new SlopWatchAnalytics();

// Export both the class and instance
export default analytics;
export { SlopWatchAnalytics }; 