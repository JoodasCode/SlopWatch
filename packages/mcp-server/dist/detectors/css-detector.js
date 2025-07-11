import { BaseDetector } from './base-detector.js';
import { log } from '../utils/logger.js';
/**
 * Detector for CSS and styling-related AI claims
 * Analyzes claims about responsive design, styling changes, layout fixes, etc.
 */
export class CSSDetector extends BaseDetector {
    cssFileExtensions = ['css', 'scss', 'sass', 'less', 'styl', 'stylus'];
    componentFileExtensions = ['tsx', 'jsx', 'vue', 'svelte'];
    constructor() {
        super('CSS', 0.8);
    }
    canHandle(claim) {
        // Check if claim type is CSS
        if (claim.type === 'css') {
            return true;
        }
        // Check if claim text contains CSS-related keywords
        const cssKeywords = [
            'css', 'style', 'styling', 'responsive', 'mobile', 'desktop',
            'height', 'width', 'margin', 'padding', 'border', 'color',
            'background', 'font', 'layout', 'flexbox', 'grid', 'position',
            'display', 'visibility', 'opacity', 'transform', 'animation',
            'media query', '@media', 'breakpoint', 'viewport'
        ];
        const claimText = claim.text.toLowerCase();
        return cssKeywords.some(keyword => claimText.includes(keyword));
    }
    async analyze(claim, changes, sessionId) {
        this.validateInput(claim, changes);
        this.logAnalysisStart(claim);
        try {
            // Filter for CSS and style-related changes
            const styleChanges = this.getStyleRelatedChanges(changes);
            if (styleChanges.length === 0) {
                return this.handleNoStyleChanges(claim, sessionId);
            }
            // Analyze specific claim types
            if (this.isResponsiveDesignClaim(claim)) {
                return await this.analyzeResponsiveDesign(claim, styleChanges, sessionId);
            }
            if (this.isDimensionClaim(claim)) {
                return await this.analyzeDimensions(claim, styleChanges, sessionId);
            }
            if (this.isColorClaim(claim)) {
                return await this.analyzeColors(claim, styleChanges, sessionId);
            }
            if (this.isLayoutClaim(claim)) {
                return await this.analyzeLayout(claim, styleChanges, sessionId);
            }
            if (this.isAnimationClaim(claim)) {
                return await this.analyzeAnimations(claim, styleChanges, sessionId);
            }
            // Generic CSS analysis
            return await this.analyzeGenericCSS(claim, styleChanges, sessionId);
        }
        catch (error) {
            log.error('CSS_DETECTOR', 'Analysis failed', error);
            return this.createUnknownResult(claim, sessionId, `Analysis failed: ${error.message}`);
        }
    }
    getStyleRelatedChanges(changes) {
        return changes.filter(change => {
            const ext = this.getFileExtension(change.path);
            return this.cssFileExtensions.includes(ext) ||
                this.componentFileExtensions.includes(ext) ||
                change.diff.includes('style') ||
                change.diff.includes('className') ||
                change.diff.includes('styled-components');
        });
    }
    handleNoStyleChanges(claim, sessionId) {
        const reason = 'Claimed to modify styling but no CSS/style-related file changes detected';
        return this.createLieResult(claim, sessionId, reason, 0.9, [
            'No .css, .scss, or component files modified',
            'No style-related changes in diffs'
        ]);
    }
    isResponsiveDesignClaim(claim) {
        const responsiveKeywords = ['responsive', 'mobile', 'tablet', 'desktop', 'breakpoint', 'media query'];
        return responsiveKeywords.some(keyword => claim.text.toLowerCase().includes(keyword));
    }
    async analyzeResponsiveDesign(claim, changes, sessionId) {
        const evidence = [];
        let hasMediaQueries = false;
        let hasViewportMeta = false;
        let hasResponsiveUnits = false;
        for (const change of changes) {
            const diff = change.diff;
            // Check for media queries
            if (/@media\s*\([^)]*\)/.test(diff)) {
                hasMediaQueries = true;
                evidence.push(`Added media query in ${change.path}`);
            }
            // Check for viewport meta tag
            if (/viewport.*width=device-width/.test(diff)) {
                hasViewportMeta = true;
                evidence.push(`Added viewport meta tag in ${change.path}`);
            }
            // Check for responsive units (%, vw, vh, em, rem)
            if (/\d+(%|vw|vh|em|rem)/.test(diff)) {
                hasResponsiveUnits = true;
                evidence.push(`Used responsive units in ${change.path}`);
            }
            // Check for flexbox/grid
            if (/display:\s*(flex|grid)/.test(diff)) {
                evidence.push(`Added flexbox/grid layout in ${change.path}`);
            }
        }
        // Determine result based on evidence
        if (hasMediaQueries || hasResponsiveUnits) {
            const confidence = hasMediaQueries ? 0.9 : 0.7;
            return this.createVerifiedResult(claim, sessionId, 'Responsive design implementation detected', confidence, evidence);
        }
        return this.createLieResult(claim, sessionId, 'Claimed responsive design but no media queries or responsive units found', 0.85, ['No @media queries detected', 'No responsive units (%, vw, vh, em, rem) found']);
    }
    isDimensionClaim(claim) {
        const dimensionKeywords = ['height', 'width', 'size', 'dimension', 'resize'];
        return dimensionKeywords.some(keyword => claim.text.toLowerCase().includes(keyword));
    }
    async analyzeDimensions(claim, changes, sessionId) {
        const evidence = [];
        let hasDimensionChanges = false;
        for (const change of changes) {
            const diff = change.diff;
            // Check for width/height properties
            const dimensionPattern = /(width|height|min-width|max-width|min-height|max-height):\s*[^;]+/g;
            const matches = diff.match(dimensionPattern);
            if (matches) {
                hasDimensionChanges = true;
                matches.forEach(match => {
                    evidence.push(`Modified ${match} in ${change.path}`);
                });
            }
            // Check for CSS custom properties related to dimensions
            if (/--[\w-]*(width|height|size)/i.test(diff)) {
                hasDimensionChanges = true;
                evidence.push(`Modified size-related CSS variables in ${change.path}`);
            }
        }
        if (hasDimensionChanges) {
            return this.createVerifiedResult(claim, sessionId, 'Dimension changes detected', 0.85, evidence);
        }
        return this.createLieResult(claim, sessionId, 'Claimed to modify dimensions but no width/height changes found', 0.8, ['No width/height property changes detected']);
    }
    isColorClaim(claim) {
        const colorKeywords = ['color', 'background', 'theme', 'dark', 'light'];
        return colorKeywords.some(keyword => claim.text.toLowerCase().includes(keyword));
    }
    async analyzeColors(claim, changes, sessionId) {
        const evidence = [];
        let hasColorChanges = false;
        for (const change of changes) {
            const diff = change.diff;
            // Check for color properties
            const colorPattern = /(color|background-color|border-color):\s*[^;]+/g;
            const colorMatches = diff.match(colorPattern);
            if (colorMatches) {
                hasColorChanges = true;
                colorMatches.forEach(match => {
                    evidence.push(`Modified ${match} in ${change.path}`);
                });
            }
            // Check for hex colors, rgb, hsl
            if (/#[0-9a-fA-F]{3,6}|rgb\(|rgba\(|hsl\(|hsla\(/.test(diff)) {
                hasColorChanges = true;
                evidence.push(`Added color values in ${change.path}`);
            }
            // Check for CSS custom properties for colors
            if (/--[\w-]*(color|bg|background)/i.test(diff)) {
                hasColorChanges = true;
                evidence.push(`Modified color-related CSS variables in ${change.path}`);
            }
        }
        if (hasColorChanges) {
            return this.createVerifiedResult(claim, sessionId, 'Color changes detected', 0.8, evidence);
        }
        return this.createLieResult(claim, sessionId, 'Claimed to modify colors but no color changes found', 0.75, ['No color property changes detected', 'No color values (hex, rgb, hsl) added']);
    }
    isLayoutClaim(claim) {
        const layoutKeywords = ['layout', 'position', 'flex', 'grid', 'align', 'justify', 'center'];
        return layoutKeywords.some(keyword => claim.text.toLowerCase().includes(keyword));
    }
    async analyzeLayout(claim, changes, sessionId) {
        const evidence = [];
        let hasLayoutChanges = false;
        for (const change of changes) {
            const diff = change.diff;
            // Check for layout properties
            const layoutProperties = [
                'display', 'position', 'float', 'clear', 'flex', 'grid',
                'align-items', 'justify-content', 'align-content', 'justify-items',
                'align-self', 'justify-self', 'order', 'flex-direction',
                'flex-wrap', 'grid-template', 'grid-area'
            ];
            for (const prop of layoutProperties) {
                if (new RegExp(`${prop}:\\s*[^;]+`, 'g').test(diff)) {
                    hasLayoutChanges = true;
                    evidence.push(`Modified ${prop} in ${change.path}`);
                }
            }
        }
        if (hasLayoutChanges) {
            return this.createVerifiedResult(claim, sessionId, 'Layout changes detected', 0.85, evidence);
        }
        return this.createLieResult(claim, sessionId, 'Claimed to modify layout but no layout property changes found', 0.8, ['No layout property changes detected']);
    }
    isAnimationClaim(claim) {
        const animationKeywords = ['animation', 'transition', 'transform', 'animate'];
        return animationKeywords.some(keyword => claim.text.toLowerCase().includes(keyword));
    }
    async analyzeAnimations(claim, changes, sessionId) {
        const evidence = [];
        let hasAnimationChanges = false;
        for (const change of changes) {
            const diff = change.diff;
            // Check for animation/transition properties
            const animationPattern = /(animation|transition|transform|@keyframes)[\s:][^;{]+/g;
            const matches = diff.match(animationPattern);
            if (matches) {
                hasAnimationChanges = true;
                matches.forEach(match => {
                    evidence.push(`Added ${match} in ${change.path}`);
                });
            }
        }
        if (hasAnimationChanges) {
            return this.createVerifiedResult(claim, sessionId, 'Animation/transition changes detected', 0.9, evidence);
        }
        return this.createLieResult(claim, sessionId, 'Claimed to add animations but no animation properties found', 0.85, ['No animation, transition, or @keyframes detected']);
    }
    async analyzeGenericCSS(claim, changes, sessionId) {
        const evidence = [];
        let hasSignificantChanges = false;
        for (const change of changes) {
            const diff = change.diff;
            const lineCount = this.countDiffLines(diff);
            if (lineCount.added > 2) {
                hasSignificantChanges = true;
                evidence.push(`Added ${lineCount.added} lines in ${change.path}`);
            }
            // Check for new CSS rules
            const rulePattern = /[^{}]+\s*{\s*[^}]+\s*}/g;
            const rules = diff.match(rulePattern);
            if (rules && rules.length > 0) {
                hasSignificantChanges = true;
                evidence.push(`Added ${rules.length} CSS rules in ${change.path}`);
            }
        }
        if (hasSignificantChanges) {
            return this.createVerifiedResult(claim, sessionId, 'CSS changes detected', 0.7, evidence);
        }
        return this.createPartialResult(claim, sessionId, 'Minor CSS changes detected, but may not fully match claim', 0.5, evidence);
    }
}
//# sourceMappingURL=css-detector.js.map