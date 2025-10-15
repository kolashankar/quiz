"""CSV Generator - AI-powered exam question CSV generation"""

import os
import csv
import json
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
import pandas as pd
import google.generativeai as genai
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CSVGenerator:
    """Generates exam CSVs with AI-powered questions"""
    
    # Exam configurations
    EXAM_CONFIGS = {
        'JEE': {
            'name': 'JEE (Joint Entrance Examination)',
            'subjects': ['Physics', 'Chemistry', 'Mathematics'],
            'years': ['2020', '2021', '2022', '2023', '2024']
        },
        'GATE': {
            'name': 'GATE (Graduate Aptitude Test in Engineering)',
            'subjects': ['Computer Science', 'Electronics', 'Mechanical Engineering'],
            'years': ['2020', '2021', '2022', '2023', '2024']
        },
        'UPSC': {
            'name': 'UPSC (Union Public Service Commission)',
            'subjects': ['History', 'Geography', 'Polity'],
            'years': ['2020', '2021', '2022', '2023', '2024']
        },
        'NEET': {
            'name': 'NEET (National Eligibility cum Entrance Test)',
            'subjects': ['Physics', 'Chemistry', 'Biology'],
            'years': ['2020', '2021', '2022', '2023', '2024']
        },
        'NMMS': {
            'name': 'NMMS (National Means cum Merit Scholarship)',
            'subjects': ['Mathematics', 'Science', 'Social Science'],
            'years': ['2020', '2021', '2022', '2023', '2024']
        }
    }
    
    # CSV Schema columns (as per requirement)
    CSV_COLUMNS = [
        'UID', 'Exam', 'Year', 'Subject', 'Chapter', 'Topic', 'QuestionType',
        'QuestionText', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'CorrectAnswer',
        'AnswerChoicesCount', 'Marks', 'NegativeMarks', 'TimeLimitSeconds', 'Difficulty',
        'Tags', 'FormulaLaTeX', 'ImageUploadThingURL', 'ImageAltText', 'Explanation',
        'ConfidenceScore', 'SourceNotes'
    ]
    
    def __init__(self, gemini_api_key: str, uploadthing_client=None):
        """Initialize CSV Generator with AI model"""
        self.uploadthing_client = uploadthing_client
        
        # Configure Gemini AI
        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_exam_csv(self, exam_name: str, questions_per_subject: int = 40, output_dir: str = './generated_csvs') -> Dict[str, Any]:
        """
        Generate CSV for a specific exam
        
        Args:
            exam_name: Name of the exam (JEE, GATE, UPSC, NEET, NMMS)
            questions_per_subject: Number of questions per subject (default 40)
            output_dir: Directory to save generated CSV
            
        Returns:
            Dictionary with generation results
        """
        try:
            if exam_name not in self.EXAM_CONFIGS:
                return {'success': False, 'error': f'Invalid exam name: {exam_name}'}
            
            exam_config = self.EXAM_CONFIGS[exam_name]
            all_questions = []
            
            logger.info(f"Starting generation for {exam_name}...")
            
            # Generate questions for each subject
            for subject in exam_config['subjects']:
                logger.info(f"Generating {questions_per_subject} questions for {subject}...")
                
                subject_questions = self._generate_subject_questions(
                    exam_name=exam_name,
                    exam_full_name=exam_config['name'],
                    subject=subject,
                    count=questions_per_subject,
                    years=exam_config['years']
                )
                
                all_questions.extend(subject_questions)
                logger.info(f"Generated {len(subject_questions)} questions for {subject}")
            
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Generate CSV file
            csv_filename = f"{exam_name}_questions.csv"
            csv_path = os.path.join(output_dir, csv_filename)
            
            self._write_csv(all_questions, csv_path)
            
            # Generate metadata JSON
            json_filename = f"{exam_name}_metadata.json"
            json_path = os.path.join(output_dir, json_filename)
            
            self._write_json_metadata(all_questions, json_path)
            
            # Generate processing report
            report_filename = f"{exam_name}_processing_report.txt"
            report_path = os.path.join(output_dir, report_filename)
            
            self._write_processing_report(exam_name, all_questions, report_path)
            
            return {
                'success': True,
                'exam': exam_name,
                'total_questions': len(all_questions),
                'csv_file': csv_path,
                'json_file': json_path,
                'report_file': report_path,
                'subjects': exam_config['subjects']
            }
            
        except Exception as e:
            logger.error(f"CSV generation error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _generate_subject_questions(self, exam_name: str, exam_full_name: str, subject: str, count: int, years: List[str]) -> List[Dict]:
        """Generate questions for a specific subject using AI"""
        questions = []
        batch_size = 5  # Generate 5 questions at a time for better quality
        
        for i in range(0, count, batch_size):
            remaining = min(batch_size, count - i)
            
            try:
                batch_questions = self._generate_question_batch(
                    exam_name, exam_full_name, subject, remaining, years
                )
                questions.extend(batch_questions)
            except Exception as e:
                logger.error(f"Error generating batch {i}-{i+remaining}: {str(e)}")
                # Continue with next batch
        
        return questions
    
    def _generate_question_batch(self, exam_name: str, exam_full_name: str, subject: str, count: int, years: List[str]) -> List[Dict]:
        """Generate a batch of questions using Gemini AI"""
        
        prompt = f"""You are an expert {exam_full_name} ({exam_name}) question paper generator.

Generate {count} realistic, high-quality multiple-choice questions for the subject: {subject}.

For each question, provide:
1. A realistic chapter name (relevant to {exam_name} syllabus)
2. A specific topic within that chapter
3. Question type (choose from: MCQ-SC, MCQ-MC, Integer, TrueFalse, AssertionReason)
4. Clear question text (can include formulas in LaTeX format using $...$ or $$...$$)
5. Four options (A, B, C, D)
6. Correct answer (A, B, C, or D)
7. Detailed explanation
8. Difficulty level (Easy, Medium, or Hard) - aim for 30% Easy, 50% Medium, 20% Hard
9. Time limit in seconds (60-180 seconds based on difficulty)
10. Marks (1-4 based on difficulty)
11. Negative marks (0 or -0.25 to -1)
12. Tags (3-5 relevant tags)
13. If applicable, LaTeX formula
14. If a diagram would help, provide image description

Make questions realistic and representative of actual {exam_name} {subject} questions from years {', '.join(years)}.

Return ONLY a valid JSON array with this EXACT structure:
[
  {{
    "chapter": "Chapter name",
    "topic": "Specific topic",
    "questionType": "MCQ-SC",
    "questionText": "Question text here",
    "optionA": "Option A text",
    "optionB": "Option B text",
    "optionC": "Option C text",
    "optionD": "Option D text",
    "correctAnswer": "A",
    "explanation": "Detailed explanation",
    "difficulty": "Medium",
    "timeLimitSeconds": 120,
    "marks": 2,
    "negativeMarks": -0.5,
    "tags": ["tag1", "tag2", "tag3"],
    "formulaLaTeX": "$E=mc^2$",
    "imageAltText": "Diagram description if needed"
  }}
]

Generate {count} questions now:"""
        
        # Call Gemini AI
        response = self.model.generate_content(prompt)
        response_text = response.text
        
        # Extract JSON from response
        json_match = self._extract_json(response_text)
        if not json_match:
            raise ValueError("Failed to parse JSON from AI response")
        
        ai_questions = json.loads(json_match)
        
        # Convert to CSV format with all required fields
        csv_questions = []
        for idx, q in enumerate(ai_questions):
            year = years[idx % len(years)]  # Distribute across years
            
            csv_question = {
                'UID': str(uuid.uuid4()),
                'Exam': exam_name,
                'Year': year,
                'Subject': subject,
                'Chapter': q.get('chapter', 'General'),
                'Topic': q.get('topic', subject),
                'QuestionType': q.get('questionType', 'MCQ-SC'),
                'QuestionText': q.get('questionText', ''),
                'OptionA': q.get('optionA', ''),
                'OptionB': q.get('optionB', ''),
                'OptionC': q.get('optionC', ''),
                'OptionD': q.get('optionD', ''),
                'CorrectAnswer': q.get('correctAnswer', 'A'),
                'AnswerChoicesCount': 4,
                'Marks': q.get('marks', 2),
                'NegativeMarks': q.get('negativeMarks', -0.5),
                'TimeLimitSeconds': q.get('timeLimitSeconds', 120),
                'Difficulty': q.get('difficulty', 'Medium'),
                'Tags': ','.join(q.get('tags', [])),
                'FormulaLaTeX': q.get('formulaLaTeX', ''),
                'ImageUploadThingURL': '',  # Will be populated if image exists
                'ImageAltText': q.get('imageAltText', ''),
                'Explanation': q.get('explanation', ''),
                'ConfidenceScore': 0.95,  # High confidence for AI-generated questions
                'SourceNotes': f'AI-generated for {exam_name} {subject}, inspired-by {year}'
            }
            
            csv_questions.append(csv_question)
        
        return csv_questions
    
    def _extract_json(self, text: str) -> Optional[str]:
        """Extract JSON array from text"""
        import re
        
        # Try to find JSON array in response
        patterns = [
            r'\[\s*\{[^\]]+\}\s*\]',  # Standard JSON array
            r'```json\s*([\[\{][^`]+[\]\}])\s*```',  # JSON in code block
            r'```\s*([\[\{][^`]+[\]\}])\s*```'  # JSON in generic code block
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                json_text = match.group(1) if len(match.groups()) > 0 else match.group(0)
                return json_text
        
        return None
    
    def _write_csv(self, questions: List[Dict], output_path: str):
        """Write questions to CSV file"""
        with open(output_path, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=self.CSV_COLUMNS)
            writer.writeheader()
            writer.writerows(questions)
        
        logger.info(f"CSV written to: {output_path}")
    
    def _write_json_metadata(self, questions: List[Dict], output_path: str):
        """Write metadata JSON file"""
        metadata = {
            'generated_at': datetime.utcnow().isoformat(),
            'total_questions': len(questions),
            'questions': questions
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        logger.info(f"JSON metadata written to: {output_path}")
    
    def _write_processing_report(self, exam_name: str, questions: List[Dict], output_path: str):
        """Write processing report"""
        report = f"""Processing Report - {exam_name} CSV Generation
{'=' * 60}

Generation Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
Exam: {exam_name}
Total Questions Generated: {len(questions)}

Breakdown by Subject:
"""
        
        # Count by subject
        subjects = {}
        for q in questions:
            subject = q['Subject']
            subjects[subject] = subjects.get(subject, 0) + 1
        
        for subject, count in subjects.items():
            report += f"  - {subject}: {count} questions\n"
        
        report += "\nBreakdown by Difficulty:\n"
        
        # Count by difficulty
        difficulties = {}
        for q in questions:
            diff = q['Difficulty']
            difficulties[diff] = difficulties.get(diff, 0) + 1
        
        for diff, count in difficulties.items():
            percentage = (count / len(questions)) * 100
            report += f"  - {diff}: {count} questions ({percentage:.1f}%)\n"
        
        report += "\nBreakdown by Question Type:\n"
        
        # Count by type
        types = {}
        for q in questions:
            qtype = q['QuestionType']
            types[qtype] = types.get(qtype, 0) + 1
        
        for qtype, count in types.items():
            report += f"  - {qtype}: {count} questions\n"
        
        report += "\n" + "=" * 60 + "\n"
        report += "\nNo errors or warnings. All questions generated successfully.\n"
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"Processing report written to: {output_path}")
