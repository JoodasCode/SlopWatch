/**
 * SlopWatch MCP Server - Base Detector Implementation
 * Copyright (c) 2025 SlopWatch Team
 */
export class BaseDetector {
    /**
     * Analyze files for the given claim
     */
    async analyzeFiles(files, claim) {
        const relevantFiles = files.filter(file => file.language === this.language);
        if (relevantFiles.length === 0) {
            return this.createNonApplicableResult(claim);
        }
        const allPatterns = [];
        const allEvidence = [];
        let totalConfidence = 0;
        for (const file of relevantFiles) {
            try {
                const patterns = this.detectPatterns(file.content, claim);
                const evidence = this.generateEvidence(file, patterns, claim);
                allPatterns.push(...patterns);
                allEvidence.push(...evidence);
                // Weight confidence by file relevance
                totalConfidence += this.calculateFileConfidence(file, patterns, claim);
            }
            catch (error) {
                console.error(`Error analyzing ${file.path}:`, error);
                allEvidence.push({
                    file: file.path,
                    description: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    severity: 'low',
                    category: 'analysis_error'
                });
            }
        }
        const averageConfidence = relevantFiles.length > 0 ? totalConfidence / relevantFiles.length : 0;
        const isLie = this.determineLieStatus(allPatterns, allEvidence, claim, averageConfidence);
        return {
            isLie,
            confidence: Math.min(Math.max(averageConfidence, 0), 1), // Clamp to [0, 1]
            evidence: allEvidence,
            summary: this.generateSummary(isLie, allEvidence, claim),
            detectedPatterns: allPatterns
        };
    }
    /**
     * Detect patterns in content based on claim
     */
    detectPatterns(content, claim) {
        const normalizedClaim = claim.toLowerCase();
        const patterns = [];
        for (const pattern of this.patterns) {
            if (this.isPatternRelevantToClaim(pattern, normalizedClaim)) {
                const matches = this.findMatches(content, pattern);
                if (matches.length > 0 || this.isAbsenceSignificant(pattern, normalizedClaim)) {
                    patterns.push({
                        pattern: pattern.name,
                        matches,
                        files: [], // Will be populated by caller
                        confidence: this.calculatePatternConfidence(pattern, matches, normalizedClaim)
                    });
                }
            }
        }
        return patterns;
    }
    /**
     * Check if pattern is relevant to the claim
     */
    isPatternRelevantToClaim(pattern, normalizedClaim) {
        const keywords = this.extractKeywords(pattern.category);
        return keywords.some(keyword => normalizedClaim.includes(keyword));
    }
    /**
     * Find matches for a pattern in content
     */
    findMatches(content, pattern) {
        const matches = [];
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags + 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            matches.push(match[0]);
            // Prevent infinite loop on zero-width matches
            if (match.index === regex.lastIndex) {
                regex.lastIndex++;
            }
        }
        return matches;
    }
    /**
     * Generate evidence from detected patterns
     */
    generateEvidence(file, patterns, claim) {
        const evidence = [];
        const normalizedClaim = claim.toLowerCase();
        for (const pattern of patterns) {
            if (pattern.matches.length > 0) {
                // Found evidence supporting the claim
                evidence.push({
                    file: file.path,
                    description: `Found ${pattern.matches.length} instance(s) of ${pattern.pattern}`,
                    severity: 'low',
                    category: 'supporting_evidence'
                });
            }
            else if (this.isAbsenceSignificant(this.getPatternByName(pattern.pattern), normalizedClaim)) {
                // Absence of expected pattern suggests a lie
                evidence.push({
                    file: file.path,
                    description: `Expected ${pattern.pattern} but none found - claim appears false`,
                    severity: this.calculateSeverity(pattern.pattern, normalizedClaim),
                    category: 'contradicting_evidence'
                });
            }
        }
        return evidence;
    }
    /**
     * Calculate confidence for a specific file
     */
    calculateFileConfidence(file, patterns, claim) {
        if (patterns.length === 0)
            return 0.5; // Neutral confidence when no patterns detected
        const normalizedClaim = claim.toLowerCase();
        let confidence = 0;
        let totalWeight = 0;
        for (const pattern of patterns) {
            const patternDef = this.getPatternByName(pattern.pattern);
            if (patternDef) {
                const weight = patternDef.weight;
                const patternConfidence = this.calculatePatternConfidence(patternDef, pattern.matches, normalizedClaim);
                confidence += patternConfidence * weight;
                totalWeight += weight;
            }
        }
        return totalWeight > 0 ? confidence / totalWeight : 0.5;
    }
    /**
     * Calculate confidence for a specific pattern
     */
    calculatePatternConfidence(pattern, matches, normalizedClaim) {
        const hasMatches = matches.length > 0;
        const expectsMatches = this.claimExpectsPattern(pattern, normalizedClaim);
        if (hasMatches && expectsMatches) {
            // Found expected pattern - supports truthfulness
            return Math.min(0.8 + (matches.length * 0.05), 1.0);
        }
        else if (!hasMatches && expectsMatches) {
            // Missing expected pattern - suggests lie
            return Math.max(0.2 - (this.getClaimConfidence(pattern, normalizedClaim) * 0.3), 0);
        }
        else if (hasMatches && !expectsMatches) {
            // Unexpected pattern found - might contradict claim
            return 0.6;
        }
        else {
            // No pattern, not expected - neutral
            return 0.5;
        }
    }
    /**
     * Determine if claim expects this pattern to be present
     */
    claimExpectsPattern(pattern, normalizedClaim) {
        const keywords = this.extractKeywords(pattern.category);
        return keywords.some(keyword => normalizedClaim.includes(keyword));
    }
    /**
     * Check if absence of pattern is significant (indicates lie)
     */
    isAbsenceSignificant(pattern, normalizedClaim) {
        if (!pattern)
            return false;
        return this.claimExpectsPattern(pattern, normalizedClaim);
    }
    /**
     * Calculate severity of missing pattern
     */
    calculateSeverity(patternName, normalizedClaim) {
        const strongIndicators = ['error', 'exception', 'validation', 'security'];
        const mediumIndicators = ['async', 'performance', 'optimization'];
        if (strongIndicators.some(indicator => normalizedClaim.includes(indicator) || patternName.toLowerCase().includes(indicator))) {
            return 'high';
        }
        else if (mediumIndicators.some(indicator => normalizedClaim.includes(indicator) || patternName.toLowerCase().includes(indicator))) {
            return 'medium';
        }
        return 'low';
    }
    /**
     * Get pattern definition by name
     */
    getPatternByName(name) {
        return this.patterns.find(p => p.name === name);
    }
    /**
     * Extract keywords from pattern category
     */
    extractKeywords(category) {
        return category.toLowerCase().split(/[_\s-]+/);
    }
    /**
     * Get confidence that claim mentions this pattern
     */
    getClaimConfidence(pattern, normalizedClaim) {
        const keywords = this.extractKeywords(pattern.category);
        const mentionCount = keywords.filter(keyword => normalizedClaim.includes(keyword)).length;
        return Math.min(mentionCount / keywords.length, 1.0);
    }
    /**
     * Determine if analysis indicates a lie
     */
    determineLieStatus(patterns, evidence, claim, confidence) {
        const contradictingEvidence = evidence.filter(e => e.category === 'contradicting_evidence');
        const supportingEvidence = evidence.filter(e => e.category === 'supporting_evidence');
        // Strong contradiction indicators
        if (contradictingEvidence.length > supportingEvidence.length && confidence < 0.4) {
            return true;
        }
        // High confidence with contradicting evidence
        if (contradictingEvidence.length > 0 && confidence < 0.3) {
            return true;
        }
        return false;
    }
    /**
     * Generate analysis summary
     */
    generateSummary(isLie, evidence, claim) {
        const contradictingCount = evidence.filter(e => e.category === 'contradicting_evidence').length;
        const supportingCount = evidence.filter(e => e.category === 'supporting_evidence').length;
        if (isLie) {
            return `🚨 LIE DETECTED: Analysis found ${contradictingCount} contradicting evidence(s) and ${supportingCount} supporting evidence(s) for the claim "${claim}". The code does not support the AI's assertion.`;
        }
        else {
            return `✅ CLAIM VERIFIED: Analysis found ${supportingCount} supporting evidence(s) and ${contradictingCount} contradicting evidence(s) for the claim "${claim}". The code appears to support the AI's assertion.`;
        }
    }
    /**
     * Create result for non-applicable language
     */
    createNonApplicableResult(claim) {
        return {
            isLie: false,
            confidence: 0,
            evidence: [],
            summary: `No ${this.language} files found to analyze the claim: "${claim}"`,
            detectedPatterns: []
        };
    }
}
//# sourceMappingURL=base-detector.js.map