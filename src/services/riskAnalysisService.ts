/**
 * Risk Analysis Service
 * Analyzes chat messages to determine user risk level
 */

export enum RiskLevel {
  SAFE = 'safe',           // 0-30: Normal, friendly conversation
  LOW = 'low',             // 31-50: Minor concerns, slightly aggressive
  MEDIUM = 'medium',       // 51-70: Moderate risk, concerning behavior
  HIGH = 'high',           // 71-85: High risk, dangerous patterns
  CRITICAL = 'critical'    // 86-100: Critical risk, immediate threat
}

export interface RiskAnalysis {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  flags: string[];
  reasons: string[];
}

// Dangerous keywords and patterns
const DANGEROUS_PATTERNS = {
  // Violence
  violence: {
    keywords: [
      'kill', 'murder', 'death', 'die', 'suicide', 'harm', 'hurt', 'attack',
      'violence', 'weapon', 'gun', 'knife', 'bomb', 'explosive', 'shoot',
      'assault', 'fight', 'beat', 'destroy', 'eliminate', 'execute'
    ],
    weight: 15
  },
  
  // Threats
  threats: {
    keywords: [
      'threat', 'threaten', 'revenge', 'retaliate', 'punish', 'get back',
      'payback', 'consequences', 'you\'ll see', 'you\'ll pay', 'watch out',
      'be careful', 'i\'ll get you', 'i\'ll hurt', 'i\'ll kill'
    ],
    weight: 20
  },
  
  // Illegal activities
  illegal: {
    keywords: [
      'drug', 'cocaine', 'heroin', 'meth', 'illegal', 'steal', 'rob', 'hack',
      'fraud', 'scam', 'blackmail', 'extort', 'bribe', 'corrupt', 'smuggle'
    ],
    weight: 12
  },
  
  // Manipulation/Exploitation
  manipulation: {
    keywords: [
      'manipulate', 'exploit', 'groom', 'control', 'isolate', 'gaslight',
      'abuse', 'victim', 'vulnerable', 'weak', 'easy target', 'naive'
    ],
    weight: 10
  },
  
  // Aggressive language
  aggressive: {
    keywords: [
      'hate', 'despise', 'disgusting', 'pathetic', 'worthless', 'stupid',
      'idiot', 'moron', 'fool', 'loser', 'trash', 'garbage', 'scum'
    ],
    weight: 8
  },
  
  // Suspicious behavior
  suspicious: {
    keywords: [
      'secret', 'hidden', 'cover up', 'lie', 'deceive', 'trick', 'fake',
      'pretend', 'disguise', 'anonymous', 'untraceable', 'no one will know'
    ],
    weight: 6
  },
  
  // Extremist content
  extremist: {
    keywords: [
      'terrorist', 'extremist', 'radical', 'jihad', 'hate group', 'supremacy',
      'genocide', 'ethnic cleansing', 'purge', 'eliminate all'
    ],
    weight: 25
  },
  
  // Self-harm indicators
  selfHarm: {
    keywords: [
      'end it all', 'give up', 'no point', 'worthless', 'better off dead',
      'no one cares', 'alone forever', 'hopeless', 'suicidal', 'cut myself'
    ],
    weight: 18
  }
};

// Positive indicators that reduce risk
const POSITIVE_INDICATORS = {
  friendly: {
    keywords: [
      'thank', 'appreciate', 'helpful', 'kind', 'nice', 'friendly', 'respect',
      'understand', 'sorry', 'apologize', 'grateful', 'pleasure'
    ],
    weight: -3
  },
  
  constructive: {
    keywords: [
      'learn', 'improve', 'grow', 'develop', 'progress', 'positive', 'solution',
      'help', 'support', 'encourage', 'motivate', 'inspire'
    ],
    weight: -2
  }
};

/**
 * Analyze a message for risk indicators
 */
export function analyzeMessageRisk(message: string): RiskAnalysis {
  const lowerMessage = message.toLowerCase();
  let riskScore = 0;
  const flags: string[] = [];
  const reasons: string[] = [];
  
  // Check for dangerous patterns
  for (const [category, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
    const matches = pattern.keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      const categoryScore = matches.length * pattern.weight;
      riskScore += categoryScore;
      flags.push(category);
      reasons.push(`Detected ${category} language: ${matches.join(', ')}`);
    }
  }
  
  // Check for positive indicators (reduce risk)
  for (const [category, pattern] of Object.entries(POSITIVE_INDICATORS)) {
    const matches = pattern.keywords.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    
    if (matches.length > 0) {
      riskScore += matches.length * pattern.weight;
    }
  }
  
  // Check message length and repetition (spam/abuse patterns)
  if (message.length > 500) {
    riskScore += 5; // Very long messages might indicate ranting
  }
  
  // Check for excessive caps (aggressive tone)
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  if (capsRatio > 0.5 && message.length > 20) {
    riskScore += 8;
    flags.push('excessive_caps');
    reasons.push('Excessive use of capital letters (aggressive tone)');
  }
  
  // Check for excessive punctuation (aggressive tone)
  const exclamationCount = (message.match(/!/g) || []).length;
  const questionCount = (message.match(/\?/g) || []).length;
  if (exclamationCount > 3 || (exclamationCount + questionCount) > 5) {
    riskScore += 5;
    flags.push('excessive_punctuation');
  }
  
  // Normalize risk score to 0-100
  riskScore = Math.max(0, Math.min(100, riskScore));
  
  // Determine risk level
  let riskLevel: RiskLevel;
  if (riskScore <= 30) {
    riskLevel = RiskLevel.SAFE;
  } else if (riskScore <= 50) {
    riskLevel = RiskLevel.LOW;
  } else if (riskScore <= 70) {
    riskLevel = RiskLevel.MEDIUM;
  } else if (riskScore <= 85) {
    riskLevel = RiskLevel.HIGH;
  } else {
    riskLevel = RiskLevel.CRITICAL;
  }
  
  return {
    riskLevel,
    riskScore: Math.round(riskScore),
    flags: [...new Set(flags)], // Remove duplicates
    reasons: reasons.length > 0 ? reasons : ['No specific risk indicators detected']
  };
}

/**
 * Analyze conversation history for cumulative risk
 */
export function analyzeConversationRisk(messages: Array<{ role: string; content: string }>): RiskAnalysis {
  const userMessages = messages.filter(msg => msg.role === 'user');
  
  if (userMessages.length === 0) {
    return {
      riskLevel: RiskLevel.SAFE,
      riskScore: 0,
      flags: [],
      reasons: ['No user messages to analyze']
    };
  }
  
  // Analyze each message
  const analyses = userMessages.map(msg => analyzeMessageRisk(msg.content));
  
  // Calculate cumulative risk
  const totalScore = analyses.reduce((sum, analysis) => sum + analysis.riskScore, 0);
  const averageScore = totalScore / analyses.length;
  
  // Recent messages weighted more heavily
  const recentMessages = userMessages.slice(-5); // Last 5 messages
  const recentAnalyses = recentMessages.map(msg => analyzeMessageRisk(msg.content));
  const recentAverageScore = recentAnalyses.reduce((sum, analysis) => sum + analysis.riskScore, 0) / recentAnalyses.length;
  
  // Weighted average: 60% recent, 40% overall
  const weightedScore = (recentAverageScore * 0.6) + (averageScore * 0.4);
  
  // Collect all flags and reasons
  const allFlags = new Set<string>();
  const allReasons: string[] = [];
  
  analyses.forEach(analysis => {
    analysis.flags.forEach(flag => allFlags.add(flag));
    if (analysis.riskScore > 50) {
      allReasons.push(...analysis.reasons);
    }
  });
  
  // Determine overall risk level
  let riskLevel: RiskLevel;
  if (weightedScore <= 30) {
    riskLevel = RiskLevel.SAFE;
  } else if (weightedScore <= 50) {
    riskLevel = RiskLevel.LOW;
  } else if (weightedScore <= 70) {
    riskLevel = RiskLevel.MEDIUM;
  } else if (weightedScore <= 85) {
    riskLevel = RiskLevel.HIGH;
  } else {
    riskLevel = RiskLevel.CRITICAL;
  }
  
  return {
    riskLevel,
    riskScore: Math.round(weightedScore),
    flags: Array.from(allFlags),
    reasons: allReasons.length > 0 ? allReasons : ['Conversation appears normal']
  };
}

