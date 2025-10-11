const { GoogleGenerativeAI } = require('@google/generative-ai');
const environment = require('../environment');

class AIConfig {
  constructor() {
    this.apiKey = environment.GEMINI_API_KEY;
    this.model = environment.AI_MODEL;
    this.temperature = environment.AI_TEMPERATURE;
    this.maxTokens = environment.AI_MAX_TOKENS;
    
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.modelInstance = this.genAI.getGenerativeModel({ model: this.model });
    }
  }

  // Check if AI is configured
  isConfigured() {
    return Boolean(this.apiKey && this.genAI);
  }

  // Get model instance
  getModel() {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured. Missing API key.');
    }
    return this.modelInstance;
  }

  // Generate content with context
  async generateContent(prompt, context = {}) {
    if (!this.isConfigured()) {
      throw new Error('AI service not configured');
    }

    try {
      const enhancedPrompt = this.enhancePrompt(prompt, context);
      const result = await this.modelInstance.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error('Failed to generate AI content');
    }
  }

  // Enhance prompt with context
  enhancePrompt(prompt, context) {
    let enhancedPrompt = prompt;

    if (context.role) {
      enhancedPrompt = `Acting as a ${context.role}, ${enhancedPrompt}`;
    }

    if (context.format) {
      enhancedPrompt += `\n\nPlease format the response as: ${context.format}`;
    }

    if (context.constraints) {
      enhancedPrompt += `\n\nConstraints: ${context.constraints.join(', ')}`;
    }

    return enhancedPrompt;
  }

  // Question generation
  async generateQuestions(topic, difficulty = 'medium', count = 5) {
    const prompt = `Generate ${count} multiple-choice questions for the topic: ${topic}.
Difficulty level: ${difficulty}
Each question should have:
1. Clear question text
2. Four options (A, B, C, D)
3. Correct answer indication
4. Brief explanation

Format as JSON array with structure:
[{
  "text": "Question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this is correct",
  "difficulty": "${difficulty}"
}]`;

    return await this.generateContent(prompt, {
      role: 'education expert',
      format: 'JSON array',
      constraints: ['factually accurate', 'appropriate difficulty level']
    });
  }

  // Content analysis
  async analyzeContent(content, analysisType = 'general') {
    const prompts = {
      general: 'Analyze this educational content and provide insights about its quality, completeness, and areas for improvement.',
      difficulty: 'Analyze the difficulty level of this content and suggest appropriate student levels.',
      gaps: 'Identify knowledge gaps or missing topics in this educational content.',
      structure: 'Analyze the structure and organization of this educational content.'
    };

    const prompt = `${prompts[analysisType] || prompts.general}\n\nContent: ${content}`;
    
    return await this.generateContent(prompt, {
      role: 'educational content analyst',
      format: 'structured analysis'
    });
  }

  // Performance recommendations
  async generateRecommendations(userPerformance) {
    const prompt = `Based on this student performance data, provide personalized study recommendations:
${JSON.stringify(userPerformance, null, 2)}

Provide:
1. Strengths identified
2. Areas needing improvement
3. Specific study strategies
4. Recommended topics to focus on
5. Time allocation suggestions`;

    return await this.generateContent(prompt, {
      role: 'educational advisor',
      format: 'structured recommendations'
    });
  }

  // Batch content processing
  async processBatch(items, processor) {
    const results = [];
    const batchSize = 5; // Process in small batches to avoid rate limits

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(processor);
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + batchSize < items.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}

module.exports = new AIConfig();