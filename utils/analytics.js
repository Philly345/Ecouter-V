// AI-Powered Analytics Engine for Meeting Insights
import { GoogleGenerativeAI } from '@google/generative-ai';

class MeetingAnalytics {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  // Meeting Effectiveness Scoring (0-100)
  async calculateMeetingEffectiveness(transcript, speakers = []) {
    try {
      const prompt = `
        Analyze this meeting transcript and provide a meeting effectiveness score (0-100) based on:
        - Goal clarity and achievement
        - Participant engagement
        - Decision-making quality
        - Time management
        - Action items identified
        - Follow-up clarity

        Transcript: "${transcript}"

        Respond with JSON format:
        {
          "effectivenessScore": 85,
          "breakdown": {
            "goalClarity": 90,
            "engagement": 80,
            "decisionMaking": 85,
            "timeManagement": 75,
            "actionItems": 90,
            "followUp": 85
          },
          "strengths": ["Clear objectives", "Good participation"],
          "improvements": ["Better time management", "More concrete decisions"],
          "keyDecisions": ["Decision 1", "Decision 2"],
          "actionItems": ["Action 1", "Action 2"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error calculating meeting effectiveness:', error);
      return this.getDefaultEffectivenessScore();
    }
  }

  // Speaking Time Analysis
  analyzeSpeakingTime(transcript, speakers = []) {
    try {
      const speakerStats = {};
      const lines = transcript.split('\n');
      let totalWords = 0;

      // Initialize speaker stats
      speakers.forEach(speaker => {
        speakerStats[speaker] = {
          wordCount: 0,
          speakingTime: 0,
          segments: 0,
          averageSegmentLength: 0,
          longestSegment: 0,
          interruptions: 0
        };
      });

      // Analyze each line
      lines.forEach((line, index) => {
        const speakerMatch = line.match(/^([^:]+):\s*(.+)$/);
        if (speakerMatch) {
          const [, speaker, content] = speakerMatch;
          const words = content.trim().split(/\s+/).length;
          
          if (speakerStats[speaker]) {
            speakerStats[speaker].wordCount += words;
            speakerStats[speaker].segments += 1;
            speakerStats[speaker].longestSegment = Math.max(
              speakerStats[speaker].longestSegment, 
              words
            );
          }
          
          totalWords += words;
        }
      });

      // Calculate percentages and speaking time estimates
      Object.keys(speakerStats).forEach(speaker => {
        const stats = speakerStats[speaker];
        stats.percentage = totalWords > 0 ? (stats.wordCount / totalWords) * 100 : 0;
        stats.speakingTime = Math.round(stats.wordCount * 0.4); // ~150 words per minute
        stats.averageSegmentLength = stats.segments > 0 ? stats.wordCount / stats.segments : 0;
      });

      return {
        totalWords,
        totalEstimatedTime: Math.round(totalWords * 0.4),
        speakers: speakerStats,
        dominanceIndex: this.calculateDominanceIndex(speakerStats),
        engagementLevel: this.calculateEngagementLevel(speakerStats)
      };
    } catch (error) {
      console.error('Error analyzing speaking time:', error);
      return this.getDefaultSpeakingAnalysis();
    }
  }

  // Conversation Flow Analysis
  async analyzeConversationFlow(transcript) {
    try {
      const prompt = `
        Analyze the conversation flow in this meeting transcript and identify:
        - Topic transitions and flow
        - Interruption patterns
        - Question-answer dynamics
        - Energy levels throughout the meeting
        - Key turning points

        Transcript: "${transcript}"

        Respond with JSON:
        {
          "flowScore": 75,
          "topicTransitions": [
            {"time": "00:05", "from": "Introductions", "to": "Project Updates", "smoothness": 8},
            {"time": "00:15", "from": "Project Updates", "to": "Budget Discussion", "smoothness": 6}
          ],
          "interruptionPatterns": {
            "totalInterruptions": 12,
            "mostInterruptive": "Speaker A",
            "leastInterruptive": "Speaker C"
          },
          "energyLevels": [
            {"timeRange": "0-10min", "energy": 8, "engagement": 9},
            {"timeRange": "10-20min", "energy": 6, "engagement": 7}
          ],
          "keyMoments": [
            {"time": "00:12", "type": "decision", "description": "Budget approved"},
            {"time": "00:18", "type": "conflict", "description": "Disagreement on timeline"}
          ]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error analyzing conversation flow:', error);
      return this.getDefaultFlowAnalysis();
    }
  }

  // Key Topic Extraction and Trending
  async extractKeyTopics(transcript) {
    try {
      const prompt = `
        Extract key topics, themes, and trending subjects from this meeting transcript:

        Transcript: "${transcript}"

        Respond with JSON:
        {
          "mainTopics": [
            {"topic": "Budget Planning", "relevance": 95, "mentions": 15, "sentiment": "positive"},
            {"topic": "Timeline Concerns", "relevance": 80, "mentions": 8, "sentiment": "negative"}
          ],
          "emergingThemes": ["Remote Work Policy", "Team Expansion"],
          "actionableItems": [
            {"item": "Review budget proposal", "assignee": "John", "priority": "high"},
            {"item": "Schedule follow-up meeting", "assignee": "Sarah", "priority": "medium"}
          ],
          "sentimentAnalysis": {
            "overall": "neutral",
            "positive": 45,
            "neutral": 35,
            "negative": 20
          },
          "keyPhrases": ["budget approval", "timeline adjustment", "team collaboration"],
          "decisions": ["Approved Q4 budget", "Delayed product launch by 2 weeks"]
        }
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Error extracting key topics:', error);
      return this.getDefaultTopicAnalysis();
    }
  }

  // Generate Comprehensive Meeting Report
  async generateMeetingReport(transcript, speakers = []) {
    try {
      const [effectiveness, speakingAnalysis, conversationFlow, topicAnalysis] = await Promise.all([
        this.calculateMeetingEffectiveness(transcript, speakers),
        Promise.resolve(this.analyzeSpeakingTime(transcript, speakers)),
        this.analyzeConversationFlow(transcript),
        this.extractKeyTopics(transcript)
      ]);

      return {
        timestamp: new Date().toISOString(),
        effectiveness,
        speakingAnalysis,
        conversationFlow,
        topicAnalysis,
        overallScore: this.calculateOverallScore(effectiveness, speakingAnalysis, conversationFlow),
        recommendations: this.generateRecommendations(effectiveness, speakingAnalysis, conversationFlow)
      };
    } catch (error) {
      console.error('Error generating meeting report:', error);
      throw error;
    }
  }

  // Helper Methods
  calculateDominanceIndex(speakerStats) {
    const percentages = Object.values(speakerStats).map(s => s.percentage);
    const max = Math.max(...percentages);
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
    return max / avg; // Higher values indicate more dominance
  }

  calculateEngagementLevel(speakerStats) {
    const activeSpeakers = Object.values(speakerStats).filter(s => s.percentage > 5).length;
    const totalSpeakers = Object.keys(speakerStats).length;
    return totalSpeakers > 0 ? (activeSpeakers / totalSpeakers) * 100 : 0;
  }

  calculateOverallScore(effectiveness, speakingAnalysis, conversationFlow) {
    return Math.round(
      (effectiveness.effectivenessScore * 0.4) +
      (speakingAnalysis.engagementLevel * 0.3) +
      (conversationFlow.flowScore * 0.3)
    );
  }

  generateRecommendations(effectiveness, speakingAnalysis, conversationFlow) {
    const recommendations = [];

    if (effectiveness.effectivenessScore < 70) {
      recommendations.push("Consider setting clearer meeting objectives and agenda");
    }

    if (speakingAnalysis.dominanceIndex > 3) {
      recommendations.push("Encourage more balanced participation from all attendees");
    }

    if (conversationFlow.flowScore < 60) {
      recommendations.push("Work on smoother topic transitions and reducing interruptions");
    }

    if (speakingAnalysis.engagementLevel < 50) {
      recommendations.push("Consider smaller group sizes or more interactive formats");
    }

    return recommendations;
  }

  // Default fallback responses
  getDefaultEffectivenessScore() {
    return {
      effectivenessScore: 70,
      breakdown: {
        goalClarity: 70,
        engagement: 70,
        decisionMaking: 70,
        timeManagement: 70,
        actionItems: 70,
        followUp: 70
      },
      strengths: ["Meeting completed"],
      improvements: ["Analysis unavailable"],
      keyDecisions: [],
      actionItems: []
    };
  }

  getDefaultSpeakingAnalysis() {
    return {
      totalWords: 0,
      totalEstimatedTime: 0,
      speakers: {},
      dominanceIndex: 1,
      engagementLevel: 50
    };
  }

  getDefaultFlowAnalysis() {
    return {
      flowScore: 70,
      topicTransitions: [],
      interruptionPatterns: { totalInterruptions: 0 },
      energyLevels: [],
      keyMoments: []
    };
  }

  getDefaultTopicAnalysis() {
    return {
      mainTopics: [],
      emergingThemes: [],
      actionableItems: [],
      sentimentAnalysis: { overall: "neutral", positive: 33, neutral: 34, negative: 33 },
      keyPhrases: [],
      decisions: []
    };
  }
}

export default MeetingAnalytics;
