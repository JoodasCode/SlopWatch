import { BaseDetector } from './base-detector.js';
import { AIClaim, FileChange, AnalysisResult } from '../types/index.js';
/**
 * Detector for CSS and styling-related AI claims
 * Analyzes claims about responsive design, styling changes, layout fixes, etc.
 */
export declare class CSSDetector extends BaseDetector {
    private cssFileExtensions;
    private componentFileExtensions;
    constructor();
    canHandle(claim: AIClaim): boolean;
    analyze(claim: AIClaim, changes: FileChange[], sessionId: string): Promise<AnalysisResult>;
    private getStyleRelatedChanges;
    private handleNoStyleChanges;
    private isResponsiveDesignClaim;
    private analyzeResponsiveDesign;
    private isDimensionClaim;
    private analyzeDimensions;
    private isColorClaim;
    private analyzeColors;
    private isLayoutClaim;
    private analyzeLayout;
    private isAnimationClaim;
    private analyzeAnimations;
    private analyzeGenericCSS;
}
//# sourceMappingURL=css-detector.d.ts.map