/**
 * SlopWatch MCP Server - CSS Detector
 * Copyright (c) 2025 SlopWatch Team
 */
import { BaseDetector } from './base-detector.js';
export class CSSDetector extends BaseDetector {
    language = 'css';
    patterns = [
        // Responsive Design Patterns
        {
            name: 'media_queries',
            regex: /@media\s*(?:\([^)]*\))?\s*\{[\s\S]*?\}/g,
            category: 'responsive_design',
            weight: 0.9,
            description: 'CSS media queries for responsive design'
        },
        {
            name: 'viewport_units',
            regex: /\d+(?:\.\d+)?(?:vw|vh|vmin|vmax|dvw|dvh)/g,
            category: 'responsive_design',
            weight: 0.8,
            description: 'Viewport-relative units'
        },
        {
            name: 'container_queries',
            regex: /@container\s*[^{]*\{[\s\S]*?\}/g,
            category: 'responsive_design',
            weight: 0.9,
            description: 'CSS container queries'
        },
        {
            name: 'fluid_typography',
            regex: /clamp\s*\([^)]*\)|(?:font-size|line-height)\s*:\s*calc\([^)]*\)/g,
            category: 'responsive_design',
            weight: 0.7,
            description: 'Fluid typography with clamp() or calc()'
        },
        // Flexbox Patterns
        {
            name: 'flexbox_container',
            regex: /display\s*:\s*flex(?:box)?/g,
            category: 'flexbox_layout',
            weight: 0.8,
            description: 'Flexbox container declaration'
        },
        {
            name: 'flex_properties',
            regex: /(?:flex-direction|flex-wrap|flex-flow|justify-content|align-items|align-content|gap)\s*:/g,
            category: 'flexbox_layout',
            weight: 0.7,
            description: 'Flexbox layout properties'
        },
        {
            name: 'flex_item_properties',
            regex: /(?:flex|flex-grow|flex-shrink|flex-basis|align-self|order)\s*:/g,
            category: 'flexbox_layout',
            weight: 0.6,
            description: 'Flex item properties'
        },
        // Grid Patterns
        {
            name: 'grid_container',
            regex: /display\s*:\s*(?:grid|inline-grid)/g,
            category: 'grid_layout',
            weight: 0.8,
            description: 'CSS Grid container declaration'
        },
        {
            name: 'grid_template',
            regex: /(?:grid-template-columns|grid-template-rows|grid-template-areas|grid-template)\s*:/g,
            category: 'grid_layout',
            weight: 0.9,
            description: 'Grid template definitions'
        },
        {
            name: 'grid_item_properties',
            regex: /(?:grid-column|grid-row|grid-area|justify-self|align-self)\s*:/g,
            category: 'grid_layout',
            weight: 0.7,
            description: 'Grid item positioning'
        },
        // Accessibility Patterns
        {
            name: 'screen_reader_only',
            regex: /\.(?:sr-only|visually-hidden|screen-reader-only)\s*\{[\s\S]*?\}|position\s*:\s*absolute\s*;[\s\S]*?clip\s*:/g,
            category: 'accessibility',
            weight: 0.8,
            description: 'Screen reader only text patterns'
        },
        {
            name: 'focus_styles',
            regex: /:focus(?:-visible|-within)?\s*\{[\s\S]*?\}/g,
            category: 'accessibility',
            weight: 0.7,
            description: 'Focus state styling'
        },
        {
            name: 'reduced_motion',
            regex: /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\}/g,
            category: 'accessibility',
            weight: 0.9,
            description: 'Reduced motion preferences'
        },
        {
            name: 'high_contrast',
            regex: /@media\s*\(prefers-contrast:\s*high\)\s*\{[\s\S]*?\}/g,
            category: 'accessibility',
            weight: 0.8,
            description: 'High contrast preferences'
        },
        // Animation Patterns
        {
            name: 'css_animations',
            regex: /@keyframes\s+[\w-]+\s*\{[\s\S]*?\}|animation(?:-name|-duration|-timing-function|-delay|-iteration-count|-direction|-fill-mode|-play-state)?\s*:/g,
            category: 'animations',
            weight: 0.8,
            description: 'CSS animations and keyframes'
        },
        {
            name: 'css_transitions',
            regex: /transition(?:-property|-duration|-timing-function|-delay)?\s*:/g,
            category: 'animations',
            weight: 0.7,
            description: 'CSS transitions'
        },
        {
            name: 'transform_properties',
            regex: /transform\s*:\s*(?:translate|rotate|scale|skew|matrix)/g,
            category: 'animations',
            weight: 0.6,
            description: 'CSS transform properties'
        },
        // Dark Mode Patterns
        {
            name: 'dark_mode_media',
            regex: /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{[\s\S]*?\}/g,
            category: 'dark_mode',
            weight: 0.9,
            description: 'Dark mode media queries'
        },
        {
            name: 'css_custom_properties',
            regex: /--[\w-]+\s*:|var\s*\(\s*--[\w-]+/g,
            category: 'dark_mode',
            weight: 0.7,
            description: 'CSS custom properties (variables)'
        },
        {
            name: 'color_scheme_property',
            regex: /color-scheme\s*:\s*(?:light|dark|light\s+dark|dark\s+light)/g,
            category: 'dark_mode',
            weight: 0.8,
            description: 'Color scheme property'
        },
        // Performance Patterns
        {
            name: 'will_change',
            regex: /will-change\s*:/g,
            category: 'performance',
            weight: 0.7,
            description: 'will-change property for performance'
        },
        {
            name: 'contain_property',
            regex: /contain\s*:\s*(?:layout|style|paint|size|strict|content)/g,
            category: 'performance',
            weight: 0.8,
            description: 'CSS containment for performance'
        },
        {
            name: 'content_visibility',
            regex: /content-visibility\s*:\s*(?:visible|hidden|auto)/g,
            category: 'performance',
            weight: 0.9,
            description: 'Content visibility for performance'
        },
        // Modern CSS Features
        {
            name: 'aspect_ratio',
            regex: /aspect-ratio\s*:/g,
            category: 'modern_css',
            weight: 0.7,
            description: 'CSS aspect-ratio property'
        },
        {
            name: 'logical_properties',
            regex: /(?:margin|padding|border)(?:-inline|-block)(?:-start|-end)?\s*:|(?:inline|block)-size\s*:/g,
            category: 'modern_css',
            weight: 0.6,
            description: 'CSS logical properties'
        },
        {
            name: 'subgrid',
            regex: /(?:grid-template-columns|grid-template-rows)\s*:\s*subgrid/g,
            category: 'modern_css',
            weight: 0.8,
            description: 'CSS subgrid'
        },
        // Utility Classes
        {
            name: 'utility_classes',
            regex: /\.(?:flex|grid|hidden|block|inline|absolute|relative|fixed|sticky|text-center|text-left|text-right|m-\d+|p-\d+|w-\d+|h-\d+)/g,
            category: 'utility_first',
            weight: 0.5,
            description: 'Utility-first CSS classes'
        },
        // Print Styles
        {
            name: 'print_styles',
            regex: /@media\s*print\s*\{[\s\S]*?\}/g,
            category: 'print_styles',
            weight: 0.7,
            description: 'Print-specific styles'
        }
    ];
    isPatternRelevantToClaim(pattern, normalizedClaim) {
        const cssSpecificMappings = {
            responsive_design: ['responsive', 'mobile', 'tablet', 'desktop', 'breakpoint', 'media', 'viewport'],
            flexbox_layout: ['flex', 'flexbox', 'layout', 'align', 'justify', 'direction'],
            grid_layout: ['grid', 'layout', 'column', 'row', 'template', 'area'],
            accessibility: ['accessible', 'accessibility', 'a11y', 'screen reader', 'focus', 'contrast', 'motion'],
            animations: ['animate', 'animation', 'transition', 'transform', 'keyframe', 'motion'],
            dark_mode: ['dark', 'light', 'theme', 'mode', 'color scheme', 'variable'],
            performance: ['performance', 'optimize', 'efficient', 'smooth', 'contain', 'visibility'],
            modern_css: ['modern', 'new', 'latest', 'aspect', 'logical', 'subgrid'],
            utility_first: ['utility', 'atomic', 'functional', 'class'],
            print_styles: ['print', 'printing', 'pdf', 'paper']
        };
        const mappedKeywords = cssSpecificMappings[pattern.category] || this.extractKeywords(pattern.category);
        return mappedKeywords.some(keyword => normalizedClaim.includes(keyword)) ||
            super.isPatternRelevantToClaim(pattern, normalizedClaim);
    }
    calculatePatternConfidence(pattern, matches, normalizedClaim) {
        const baseConfidence = super.calculatePatternConfidence(pattern, matches, normalizedClaim);
        // Boost confidence for critical CSS patterns
        if (pattern.category === 'responsive_design' && normalizedClaim.includes('responsive')) {
            return Math.min(baseConfidence * 1.3, 1.0);
        }
        if (pattern.category === 'accessibility' && normalizedClaim.includes('accessible')) {
            return Math.min(baseConfidence * 1.2, 1.0);
        }
        if (pattern.category === 'dark_mode' && normalizedClaim.includes('dark')) {
            return Math.min(baseConfidence * 1.2, 1.0);
        }
        return baseConfidence;
    }
}
//# sourceMappingURL=css-detector.js.map