const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Generate questions using AI
router.post('/generate-questions', async (req, res) => {
  try {
    const { topic, difficulty, count = 1 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const prompt = `Generate ${count} multiple choice question(s) about "${topic}" with difficulty level "${difficulty}".

For each question, provide:
1. Question text
2. Four options (A, B, C, D)
3. Correct answer (0-3 index)
4. Detailed explanation

Format the response as JSON array with this structure:
[
  {
    "text": "question text here",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "detailed explanation here",
    "difficulty": "${difficulty}",
    "tags": ["tag1", "tag2"]
  }
]

Make questions clear, accurate, and educational.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      res.json({ questions });
    } else {
      res.status(500).json({ error: 'Failed to parse AI response' });
    }
  } catch (error) {
    console.error('AI generate questions error:', error);
    res.status(500).json({ error: 'Failed to generate questions', details: error.message });
  }
});

// Suggest difficulty level for a question
router.post('/suggest-difficulty', async (req, res) => {
  try {
    const { questionText } = req.body;

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const prompt = `Analyze this question and suggest its difficulty level (easy, medium, or hard):

"${questionText}"

Respond with only ONE word: easy, medium, or hard`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().toLowerCase().trim();
    
    let difficulty = 'medium';
    if (text.includes('easy')) difficulty = 'easy';
    else if (text.includes('hard')) difficulty = 'hard';
    
    res.json({ difficulty });
  } catch (error) {
    console.error('AI suggest difficulty error:', error);
    res.status(500).json({ error: 'Failed to suggest difficulty' });
  }
});

// Generate explanation for a question
router.post('/generate-explanation', async (req, res) => {
  try {
    const { questionText, correctAnswer } = req.body;

    if (!questionText || !correctAnswer) {
      return res.status(400).json({ error: 'Question text and correct answer are required' });
    }

    const prompt = `For this question:
"${questionText}"

The correct answer is: "${correctAnswer}"

Generate a clear, educational explanation (2-3 sentences) explaining why this is the correct answer.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text().trim();
    
    res.json({ explanation });
  } catch (error) {
    console.error('AI generate explanation error:', error);
    res.status(500).json({ error: 'Failed to generate explanation' });
  }
});

// Improve question text
router.post('/improve-question', async (req, res) => {
  try {
    const { questionText } = req.body;

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const prompt = `Improve this question to make it clearer and more professional:

"${questionText}"

Return only the improved question text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const improvedText = response.text().trim();
    
    res.json({ improvedText });
  } catch (error) {
    console.error('AI improve question error:', error);
    res.status(500).json({ error: 'Failed to improve question' });
  }
});

// Generate tags for a question
router.post('/generate-tags', async (req, res) => {
  try {
    const { questionText } = req.body;

    if (!questionText) {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const prompt = `Generate 3-5 relevant tags for this question:

"${questionText}"

Return only comma-separated tags, nothing else. Example: physics, mechanics, force, newton`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const tagsText = response.text().trim();
    const tags = tagsText.split(',').map(tag => tag.trim());
    
    res.json({ tags });
  } catch (error) {
    console.error('AI generate tags error:', error);
    res.status(500).json({ error: 'Failed to generate tags' });
  }
});

module.exports = router;
