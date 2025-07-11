#!/usr/bin/env node

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import chokidar from 'chokidar';

class AutoSlopWatch {
  constructor() {
    this.lastCommitTime = 0;
    this.aiClaimPatterns = [
      /I (?:added|fixed|implemented|created|built|updated)/gi,
      /(?:Added|Fixed|Implemented|Created|Built|Updated) .+/gi,
      /✅.+/gi,
      /Now .+ (?:works|supports|includes)/gi
    ];
  }

  async start() {
    console.log('🔍 AutoSlopWatch starting...');
    
    // Watch for git commits
    this.watchGitCommits();
    
    // Watch for file changes (indicates recent AI activity)
    this.watchFileChanges();
    
    console.log('👀 Monitoring for AI claims automatically...');
  }

  watchGitCommits() {
    // Monitor .git/logs/HEAD for new commits
    const gitLogPath = '.git/logs/HEAD';
    
    if (require('fs').existsSync(gitLogPath)) {
      chokidar.watch(gitLogPath).on('change', async () => {
        await this.analyzeRecentCommits();
      });
    }
  }

  watchFileChanges() {
    const watcher = chokidar.watch('.', {
      ignored: [/node_modules/, /.git/, /\.DS_Store/],
      ignoreInitial: true
    });

    let changeBuffer = [];
    let changeTimer = null;

    watcher.on('change', (path) => {
      changeBuffer.push({ path, timestamp: Date.now() });
      
      // Debounce: analyze after 5 seconds of no changes
      clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        this.analyzeRecentChanges(changeBuffer);
        changeBuffer = [];
      }, 5000);
    });
  }

  async analyzeRecentCommits() {
    try {
      // Get last 3 commits
      const commits = await this.getRecentCommits(3);
      
      for (const commit of commits) {
        const claims = this.extractClaimsFromText(commit.message);
        
        if (claims.length > 0) {
          console.log(`\n🤖 Detected AI claims in commit: ${commit.hash.slice(0, 7)}`);
          console.log(`📝 Message: "${commit.message}"`);
          
          for (const claim of claims) {
            await this.verifyClaim(claim, commit.files);
          }
        }
      }
    } catch (error) {
      // Silently fail if not a git repo
    }
  }

  async analyzeRecentChanges(changes) {
    // Look for rapid file changes (indicates AI coding session)
    const rapidChanges = changes.filter(c => 
      Date.now() - c.timestamp < 30000 // Within last 30 seconds
    );

    if (rapidChanges.length >= 3) {
      console.log(`\n⚡ Detected rapid changes (${rapidChanges.length} files) - possible AI activity`);
      
      // Check if there's a pattern suggesting AI claims
      const recentCommits = await this.getRecentCommits(1);
      if (recentCommits.length > 0) {
        const claims = this.extractClaimsFromText(recentCommits[0].message);
        
        for (const claim of claims) {
          await this.verifyClaim(claim, rapidChanges.map(c => c.path));
        }
      }
    }
  }

  extractClaimsFromText(text) {
    const claims = [];
    
    for (const pattern of this.aiClaimPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        claims.push(...matches);
      }
    }
    
    // Filter out generic/unhelpful claims
    return claims.filter(claim => 
      claim.length > 10 && 
      !claim.includes('typo') &&
      !claim.includes('formatting')
    );
  }

  async verifyClaim(claim, affectedFiles = []) {
    console.log(`\n🔍 Auto-verifying claim: "${claim}"`);
    
    // Use existing pattern detection logic
    const { SlopWatchMCPServer } = await import('./server.js');
    const detector = new SlopWatchMCPServer();
    
    try {
      const result = await detector.performLieDetection(
        claim,
        process.cwd(),
        ['.js', '.ts', '.jsx', '.tsx', '.css', '.py'],
        50
      );
      
      if (result.isLie) {
        console.log(`🚨 AUTOMATIC LIE DETECTION: "${claim}"`);
        console.log(`📊 Confidence: ${result.confidence}%`);
        console.log(`📁 Files checked: ${result.filesAnalyzed}`);
        
        // Could send notification, log to file, etc.
        await this.reportLie(claim, result);
      } else {
        console.log(`✅ Claim verified automatically: ${result.confidence}% confidence`);
      }
    } catch (error) {
      console.log(`❌ Failed to verify claim: ${error.message}`);
    }
  }

  async reportLie(claim, result) {
    // Log to file for dashboard
    const logEntry = {
      timestamp: new Date().toISOString(),
      claim,
      confidence: result.confidence,
      evidence: result.contradictingEvidence.slice(0, 3)
    };
    
    await fs.appendFile('.slopwatch-auto.log', JSON.stringify(logEntry) + '\n');
    
    // Could also:
    // - Send desktop notification
    // - Post to Slack/Discord
    // - Update dashboard
    console.log(`📝 Logged lie to .slopwatch-auto.log`);
  }

  async getRecentCommits(count = 5) {
    return new Promise((resolve, reject) => {
      const git = spawn('git', ['log', `--pretty=format:%H|%s|%an|%ad`, `-${count}`]);
      let output = '';
      
      git.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      git.on('close', (code) => {
        if (code !== 0) {
          resolve([]);
          return;
        }
        
        const commits = output.trim().split('\n').map(line => {
          const [hash, message, author, date] = line.split('|');
          return { hash, message, author, date };
        });
        
        resolve(commits);
      });
    });
  }
}

// Auto-start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new AutoSlopWatch();
  monitor.start();
}

export { AutoSlopWatch }; 