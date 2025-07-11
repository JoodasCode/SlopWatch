import { EventEmitter } from 'events';
import { ProjectFileWatcher } from '../watchers/file-watcher.js';
import { ClaimCaptureSystem } from '../capture/claim-capture.js';
import { CSSDetector } from '../detectors/css-detector.js';
export class LiveAnalysisEngine extends EventEmitter {
    fileWatcher;
    claimCapture;
    detectors;
    options;
    // Store recent file changes and claims for correlation
    recentChanges = [];
    pendingClaims = new Map();
    analysisResults = new Map();
    // Timers for delayed analysis
    analysisTimers = new Map();
    constructor(options) {
        super();
        this.options = {
            projectPath: options.projectPath,
            analysisWindow: options.analysisWindow || 30000, // 30 seconds default
            autoAnalyze: options.autoAnalyze !== false, // default true
            detectors: options.detectors || [new CSSDetector()]
        };
        // Initialize components
        this.fileWatcher = new ProjectFileWatcher({ projectPath: options.projectPath });
        this.claimCapture = new ClaimCaptureSystem();
        this.detectors = this.options.detectors;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // File change events
        this.fileWatcher.on('change', (change) => {
            this.handleFileChange(change);
        });
        this.fileWatcher.on('error', (error) => {
            this.emit('error', error);
        });
        // Claim events
        this.claimCapture.on('claim', (claim) => {
            this.handleNewClaim(claim);
        });
        // Clean up old data periodically
        setInterval(() => {
            this.cleanup();
        }, 60000); // Every minute
    }
    async start() {
        console.log('🚀 Starting Live Analysis Engine...');
        await this.fileWatcher.start();
        console.log('✅ Live Analysis Engine ready');
        this.emit('ready');
    }
    async stop() {
        console.log('🛑 Stopping Live Analysis Engine...');
        await this.fileWatcher.stop();
        // Clear all timers
        for (const timer of this.analysisTimers.values()) {
            clearTimeout(timer);
        }
        this.analysisTimers.clear();
        console.log('✅ Live Analysis Engine stopped');
    }
    // Add a claim manually (for testing or external integration)
    addClaim(text, type) {
        return this.claimCapture.addClaim(text, type);
    }
    // Add a conversation message
    addMessage(content, role, conversationId = 'default') {
        const message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role,
            content,
            timestamp: Date.now()
        };
        return this.claimCapture.captureMessage(message, conversationId);
    }
    handleFileChange(change) {
        console.log(`📝 File change detected: ${change.type} ${change.path}`);
        // Add to recent changes
        this.recentChanges.push(change);
        // Emit file change event
        this.emit('fileChange', change);
        // Check if this change matches any pending claims
        if (this.options.autoAnalyze) {
            this.checkPendingClaims(change);
        }
        // Clean up old changes
        const cutoff = Date.now() - this.options.analysisWindow;
        this.recentChanges = this.recentChanges.filter(c => c.timestamp >= cutoff);
    }
    handleNewClaim(claim) {
        console.log(`🤖 New AI claim: "${claim.text}" (${claim.type})`);
        // Add to pending claims
        this.pendingClaims.set(claim.id, claim);
        // Emit claim event
        this.emit('claim', claim);
        if (this.options.autoAnalyze) {
            // Schedule analysis after a delay to wait for potential file changes
            const delay = Math.min(this.options.analysisWindow / 3, 10000); // Max 10 seconds
            const timer = setTimeout(() => {
                this.analyzeClaim(claim.id);
                this.analysisTimers.delete(claim.id);
            }, delay);
            this.analysisTimers.set(claim.id, timer);
        }
    }
    checkPendingClaims(change) {
        // Check if this file change could relate to any pending claims
        for (const [claimId, claim] of this.pendingClaims.entries()) {
            if (this.couldBeRelated(claim, change)) {
                // Cancel the delayed analysis and analyze immediately
                const timer = this.analysisTimers.get(claimId);
                if (timer) {
                    clearTimeout(timer);
                    this.analysisTimers.delete(claimId);
                }
                // Analyze with a short delay to allow for multiple related changes
                setTimeout(() => {
                    if (this.pendingClaims.has(claimId)) {
                        this.analyzeClaim(claimId);
                    }
                }, 2000);
            }
        }
    }
    couldBeRelated(claim, change) {
        // Simple heuristics to determine if a file change could be related to a claim
        // CSS claims should relate to CSS files
        if (claim.type === 'css' && /\.(css|scss|sass|less)$/.test(change.path)) {
            return true;
        }
        // JS claims should relate to JS/TS files
        if (claim.type === 'js' && /\.(js|ts|jsx|tsx)$/.test(change.path)) {
            return true;
        }
        // Generic claims could relate to any code file
        if (claim.type === 'generic' && this.fileWatcher.isRelevantFile(change.path)) {
            return true;
        }
        return false;
    }
    // Analyze a specific claim
    async analyzeClaim(claimId) {
        const claim = this.pendingClaims.get(claimId);
        if (!claim) {
            console.warn(`⚠️ Claim ${claimId} not found for analysis`);
            return null;
        }
        console.log(`🔍 Analyzing claim: "${claim.text}"`);
        // Get relevant file changes within the analysis window
        const cutoff = claim.timestamp - 5000; // Allow 5 seconds before claim
        const relevantChanges = this.recentChanges.filter(change => change.timestamp >= cutoff &&
            change.timestamp <= claim.timestamp + this.options.analysisWindow &&
            this.couldBeRelated(claim, change));
        // Find appropriate detector
        const detector = this.detectors.find(d => d.canHandle(claim));
        let result;
        if (!detector) {
            result = {
                id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                claimId: claim.id,
                fileChanges: relevantChanges,
                status: 'unknown',
                confidence: 0,
                reason: 'No suitable detector found for this claim type',
                detector: 'Unknown',
                timestamp: Date.now()
            };
        }
        else {
            try {
                // Convert CaptureAIClaim to the format expected by detectors
                const detectorClaim = {
                    id: claim.id,
                    text: claim.text,
                    type: claim.type,
                    action: claim.action,
                    target: claim.target,
                    extractedFrom: claim.text,
                    confidence: claim.confidence
                };
                const detectorResult = await detector.analyze(detectorClaim, relevantChanges, 'live-session');
                result = {
                    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    claimId: claim.id,
                    fileChanges: relevantChanges,
                    status: detectorResult.status,
                    confidence: detectorResult.confidence,
                    reason: detectorResult.reason,
                    detector: detector.getName(),
                    timestamp: Date.now()
                };
            }
            catch (error) {
                console.error(`❌ Error in detector ${detector.getName()}:`, error);
                result = {
                    id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    claimId: claim.id,
                    fileChanges: relevantChanges,
                    status: 'unknown',
                    confidence: 0,
                    reason: `Detector error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    detector: detector.getName(),
                    timestamp: Date.now()
                };
            }
        }
        // Store result
        this.analysisResults.set(result.id, result);
        // Remove from pending
        this.pendingClaims.delete(claimId);
        // Log result
        const statusIcon = result.status === 'lie' ? '🚨' :
            result.status === 'verified' ? '✅' : '⚠️';
        console.log(`${statusIcon} Analysis complete: ${result.status.toUpperCase()} (${Math.round(result.confidence * 100)}%)`);
        console.log(`   Reason: ${result.reason}`);
        console.log(`   Files checked: ${relevantChanges.length}`);
        // Emit result
        this.emit('analysis', result);
        return result;
    }
    // Manual analysis trigger
    async analyzeAllPending() {
        const results = [];
        for (const claimId of this.pendingClaims.keys()) {
            const result = await this.analyzeClaim(claimId);
            if (result) {
                results.push(result);
            }
        }
        return results;
    }
    // Get recent analysis results
    getRecentAnalyses(since = Date.now() - 300000) {
        return Array.from(this.analysisResults.values())
            .filter(result => result.timestamp >= since)
            .sort((a, b) => b.timestamp - a.timestamp);
    }
    // Get analysis by ID
    getAnalysis(id) {
        return this.analysisResults.get(id);
    }
    // Calculate current slop score
    calculateSlopScore(since = Date.now() - 3600000) {
        const recentAnalyses = this.getRecentAnalyses(since);
        if (recentAnalyses.length === 0) {
            return 0;
        }
        const lies = recentAnalyses.filter(a => a.status === 'lie').length;
        return Math.round((lies / recentAnalyses.length) * 100);
    }
    // Get comprehensive statistics
    getStats() {
        const analyses = Array.from(this.analysisResults.values());
        const recentAnalyses = this.getRecentAnalyses();
        const statusBreakdown = analyses.reduce((acc, analysis) => {
            acc[analysis.status] = (acc[analysis.status] || 0) + 1;
            return acc;
        }, {});
        const detectorStats = analyses.reduce((acc, analysis) => {
            acc[analysis.detector] = (acc[analysis.detector] || 0) + 1;
            return acc;
        }, {});
        return {
            totalClaims: this.claimCapture.getStats().totalClaims,
            totalAnalyses: analyses.length,
            pendingClaims: this.pendingClaims.size,
            recentFileChanges: this.recentChanges.length,
            slopScore: this.calculateSlopScore(),
            statusBreakdown,
            detectorStats
        };
    }
    cleanup() {
        const cutoff = Date.now() - 86400000; // 24 hours
        // Clean up old analysis results
        for (const [id, result] of this.analysisResults.entries()) {
            if (result.timestamp < cutoff) {
                this.analysisResults.delete(id);
            }
        }
        // Clean up old pending claims that are too old
        const pendingCutoff = Date.now() - this.options.analysisWindow * 2;
        for (const [id, claim] of this.pendingClaims.entries()) {
            if (claim.timestamp < pendingCutoff) {
                console.warn(`⚠️ Removing stale pending claim: ${claim.text}`);
                this.pendingClaims.delete(id);
                // Clear any associated timer
                const timer = this.analysisTimers.get(id);
                if (timer) {
                    clearTimeout(timer);
                    this.analysisTimers.delete(id);
                }
            }
        }
        // Clean up claim capture system
        this.claimCapture.cleanup(cutoff);
    }
}
// Factory function
export function createLiveAnalysis(projectPath, options = {}) {
    return new LiveAnalysisEngine({
        projectPath,
        ...options
    });
}
//# sourceMappingURL=live-analysis.js.map