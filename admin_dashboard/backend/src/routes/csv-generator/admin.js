const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { adminMiddleware } = require('../../middleware/auth/authMiddleware');

const router = express.Router();
router.use(adminMiddleware);

// Configure multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Python microservice URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8003';

/**
 * Generate CSV for an exam using AI
 * POST /api/admin/csv-generator/generate-exam
 */
router.post('/generate-exam', async (req, res) => {
  try {
    const { exam_name, questions_per_subject = 40 } = req.body;

    if (!exam_name) {
      return res.status(400).json({ error: 'Exam name is required' });
    }

    // Valid exam names
    const validExams = ['JEE', 'GATE', 'UPSC', 'NEET', 'NMMS'];
    if (!validExams.includes(exam_name)) {
      return res.status(400).json({ 
        error: `Invalid exam name. Must be one of: ${validExams.join(', ')}` 
      });
    }

    // Call Python microservice
    const response = await axios.post(`${PYTHON_SERVICE_URL}/generate-exam-csv`, {
      exam_name,
      questions_per_subject: parseInt(questions_per_subject)
    });

    res.json(response.data);
  } catch (error) {
    console.error('Generate exam CSV error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate exam CSV', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * Convert PDF to CSV
 * POST /api/admin/csv-generator/pdf-to-csv
 */
router.post('/pdf-to-csv', upload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'answer_key_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const { exam_name, year, subject } = req.body;
    const pdfFile = req.files['pdf_file']?.[0];
    const answerKeyFile = req.files['answer_key_file']?.[0];

    if (!exam_name || !year || !subject) {
      return res.status(400).json({ error: 'Exam name, year, and subject are required' });
    }

    if (!pdfFile) {
      return res.status(400).json({ error: 'PDF file is required' });
    }

    // Create form data
    const formData = new FormData();
    formData.append('pdf_file', require('fs').createReadStream(pdfFile.path), pdfFile.originalname);
    
    if (answerKeyFile) {
      formData.append('answer_key_file', require('fs').createReadStream(answerKeyFile.path), answerKeyFile.originalname);
    }

    // Call Python microservice with query parameters
    const response = await axios.post(
      `${PYTHON_SERVICE_URL}/pdf-to-csv?exam_name=${exam_name}&year=${year}&subject=${subject}`,
      formData,
      {
        headers: formData.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    // Cleanup uploaded files
    require('fs').unlinkSync(pdfFile.path);
    if (answerKeyFile) {
      require('fs').unlinkSync(answerKeyFile.path);
    }

    res.json(response.data);
  } catch (error) {
    console.error('PDF to CSV error:', error.message);
    res.status(500).json({ 
      error: 'Failed to convert PDF to CSV', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * Get job status
 * GET /api/admin/csv-generator/job-status/:job_id
 */
router.get('/job-status/:job_id', async (req, res) => {
  try {
    const { job_id } = req.params;

    const response = await axios.get(`${PYTHON_SERVICE_URL}/job-status/${job_id}`);

    res.json(response.data);
  } catch (error) {
    console.error('Get job status error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.status(500).json({ 
      error: 'Failed to get job status', 
      details: error.message 
    });
  }
});

/**
 * Download generated file
 * GET /api/admin/csv-generator/download/:filename
 */
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;

    const response = await axios.get(
      `${PYTHON_SERVICE_URL}/download/${filename}`,
      { responseType: 'stream' }
    );

    // Set headers
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Download file error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.status(500).json({ 
      error: 'Failed to download file', 
      details: error.message 
    });
  }
});

/**
 * List all generated files
 * GET /api/admin/csv-generator/files
 */
router.get('/files', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/generated-files`);

    res.json(response.data);
  } catch (error) {
    console.error('List files error:', error.message);
    res.status(500).json({ 
      error: 'Failed to list files', 
      details: error.message 
    });
  }
});

/**
 * Health check for Python microservice
 * GET /api/admin/csv-generator/health
 */
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`);

    res.json(response.data);
  } catch (error) {
    console.error('Health check error:', error.message);
    res.status(500).json({ 
      error: 'Python microservice is not available', 
      details: error.message 
    });
  }
});

module.exports = router;
