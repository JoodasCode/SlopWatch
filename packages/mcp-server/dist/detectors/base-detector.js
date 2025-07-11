import { DetectorError } from '../types/index.js';
import { log } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
/**
 * Base class for all SlopWatch detectors
 * Each detector specializes in detecting lies for specific types of AI claims
 */
export class BaseDetector {
    name;
    confidenceThreshold;
    enabled;
    constructor(name, confidenceThreshold = 0.7) {
        this.name = name;
        this.confidenceThreshold = confidenceThreshold;
        this.enabled = true;
    }
    /**
     * Get the detector's name
     */
    getName() {
        return this.name;
    }
    /**
     * Check if detector is enabled
     */
    isEnabled() {
        return this.enabled;
    }
    /**
     * Enable or disable the detector
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        log.detection(`Detector ${this.name} ${enabled ? 'enabled' : 'disabled'}`);
    }
    /**
     * Get confidence threshold
     */
    getConfidenceThreshold() {
        return this.confidenceThreshold;
    }
    /**
     * Set confidence threshold
     */
    setConfidenceThreshold(threshold) {
        if (threshold < 0 || threshold > 1) {
            throw new DetectorError('Confidence threshold must be between 0 and 1', this.name);
        }
        this.confidenceThreshold = threshold;
        log.detection(`Detector ${this.name} confidence threshold set to ${threshold}`);
    }
    /**
     * Create a verified result
     */
    createVerifiedResult(claim, sessionId, reason, confidence, evidence) {
        return {
            id: uuidv4(),
            sessionId,
            claimId: claim.id,
            status: 'verified',
            confidence,
            reason,
            timestamp: Date.now(),
            detector: this.name,
            evidence: evidence || []
        };
    }
    /**
     * Create a lie result
     */
    createLieResult(claim, sessionId, reason, confidence, evidence) {
        return {
            id: uuidv4(),
            sessionId,
            claimId: claim.id,
            status: 'lie',
            confidence,
            reason,
            timestamp: Date.now(),
            detector: this.name,
            evidence: evidence || []
        };
    }
    /**
     * Create a partial result
     */
    createPartialResult(claim, sessionId, reason, confidence, evidence) {
        return {
            id: uuidv4(),
            sessionId,
            claimId: claim.id,
            status: 'partial',
            confidence,
            reason,
            timestamp: Date.now(),
            detector: this.name,
            evidence: evidence || []
        };
    }
    /**
     * Create an unknown result
     */
    createUnknownResult(claim, sessionId, reason, confidence = 0) {
        return {
            id: uuidv4(),
            sessionId,
            claimId: claim.id,
            status: 'unknown',
            confidence,
            reason,
            timestamp: Date.now(),
            detector: this.name,
            evidence: []
        };
    }
    /**
     * Utility method to check if file is of specific type
     */
    isFileType(filePath, extensions) {
        const ext = filePath.split('.').pop()?.toLowerCase();
        return ext ? extensions.includes(ext) : false;
    }
    /**
     * Utility method to extract file extension
     */
    getFileExtension(filePath) {
        return filePath.split('.').pop()?.toLowerCase() || '';
    }
    /**
     * Utility method to check if diff contains specific patterns
     */
    diffContains(diff, patterns) {
        const normalizedDiff = diff.toLowerCase();
        return patterns.some(pattern => normalizedDiff.includes(pattern.toLowerCase()));
    }
    /**
     * Utility method to count lines in diff
     */
    countDiffLines(diff) {
        const lines = diff.split('\n');
        let added = 0;
        let removed = 0;
        for (const line of lines) {
            if (line.startsWith('+') && !line.startsWith('+++')) {
                added++;
            }
            else if (line.startsWith('-') && !line.startsWith('---')) {
                removed++;
            }
        }
        return { added, removed };
    }
    /**
     * Utility method to extract method/function names from diff
     */
    extractFunctionNames(diff) {
        const functionPatterns = [
            /function\s+(\w+)/g,
            /const\s+(\w+)\s*=/g,
            /let\s+(\w+)\s*=/g,
            /var\s+(\w+)\s*=/g,
            /(\w+)\s*:\s*function/g,
            /(\w+)\s*=>\s*/g,
            /def\s+(\w+)/g, // Python
            /public\s+\w+\s+(\w+)/g, // Java/C#
            /private\s+\w+\s+(\w+)/g,
            /protected\s+\w+\s+(\w+)/g
        ];
        const names = [];
        for (const pattern of functionPatterns) {
            let match;
            while ((match = pattern.exec(diff)) !== null) {
                names.push(match[1]);
            }
        }
        return [...new Set(names)]; // Remove duplicates
    }
    /**
     * Utility method to extract CSS selectors from diff
     */
    extractCSSSelectors(diff) {
        const selectorPatterns = [
            /\.[\w-]+/g, // Class selectors
            /#[\w-]+/g, // ID selectors
            /[\w-]+(?=\s*{)/g // Element selectors
        ];
        const selectors = [];
        for (const pattern of selectorPatterns) {
            const matches = diff.match(pattern);
            if (matches) {
                selectors.push(...matches);
            }
        }
        return [...new Set(selectors)];
    }
    /**
     * Utility method to check for import/require statements
     */
    hasImportStatements(diff, modules) {
        const importPatterns = [
            /import\s+.*from\s+['"]([^'"]+)['"]/g,
            /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
        ];
        if (!modules) {
            return importPatterns.some(pattern => pattern.test(diff));
        }
        for (const pattern of importPatterns) {
            let match;
            while ((match = pattern.exec(diff)) !== null) {
                const moduleName = match[1];
                if (modules.some(mod => moduleName.includes(mod))) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Log analysis start
     */
    logAnalysisStart(claim) {
        log.detection(`Starting analysis with ${this.name}`, {
            claimId: claim.id,
            claimType: claim.type,
            claimText: claim.text.slice(0, 100) + '...'
        });
    }
    /**
     * Log analysis result
     */
    logAnalysisResult(result) {
        log.detection(`Analysis completed`, {
            detector: this.name,
            status: result.status,
            confidence: result.confidence,
            reason: result.reason
        });
    }
    /**
     * Validate analysis input
     */
    validateInput(claim, changes) {
        if (!claim) {
            throw new DetectorError('Claim is required for analysis', this.name);
        }
        if (!claim.id || !claim.text) {
            throw new DetectorError('Claim must have id and text', this.name);
        }
        if (!Array.isArray(changes)) {
            throw new DetectorError('Changes must be an array', this.name);
        }
    }
}
//# sourceMappingURL=base-detector.js.map