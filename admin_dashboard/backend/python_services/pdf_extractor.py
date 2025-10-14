"""PDF Extraction Service - Extracts questions, options, and images from PDF files"""

import fitz  # PyMuPDF
import pytesseract
import pdfplumber
import re
import uuid
import io
import base64
from PIL import Image
from typing import List, Dict, Any, Optional, Tuple
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFExtractor:
    """Extracts questions, options, and answer keys from PDF files"""
    
    def __init__(self):
        self.question_patterns = [
            r'(\d+)[\).\s]+(.+?)(?=\d+[\).\s]+|$)',  # Pattern: "1. Question text" or "1) Question text"
            r'Q[\s]*(\d+)[\s]*[:\.\-]?[\s]*(.+?)(?=Q[\s]*\d+|$)',  # Pattern: "Q1: Question text"
            r'Question[\s]*(\d+)[\s]*[:\.\-]?[\s]*(.+?)(?=Question[\s]*\d+|$)'  # Pattern: "Question 1: text"
        ]
        
        self.option_patterns = [
            r'([A-D])[\).\s]+(.+?)(?=[A-D][\).\s]+|$)',  # Pattern: "A) Option" or "A. Option"
            r'\(([A-D])\)[\s]*(.+?)(?=\([A-D]\)|$)'  # Pattern: "(A) Option"
        ]
        
        self.answer_patterns = [
            r'(\d+)[\s]*[:\.\-]?[\s]*([A-D])',  # Pattern: "1: A" or "1. A" or "1 A"
            r'([A-D])[\s]*[:\.\-]?[\s]*(\d+)'  # Pattern: "A: 1" or "A. 1"
        ]
    
    def extract_from_pdf(self, pdf_path: str, answer_key_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Main extraction method that combines OCR and text extraction
        
        Args:
            pdf_path: Path to the PDF file with questions
            answer_key_path: Optional path to answer key PDF
            
        Returns:
            Dictionary with extracted questions, options, answers, and images
        """
        try:
            # Extract questions and options
            questions_data = self._extract_questions_with_options(pdf_path)
            
            # Extract images
            images_data = self._extract_images(pdf_path)
            
            # Extract answer key if provided
            answer_key = {}
            if answer_key_path:
                answer_key = self._extract_answer_key(answer_key_path)
            
            # Match questions with answers
            matched_questions = self._match_questions_with_answers(questions_data, answer_key, images_data)
            
            return {
                'success': True,
                'questions': matched_questions,
                'total_questions': len(matched_questions),
                'total_images': len(images_data),
                'warnings': self._generate_warnings(matched_questions)
            }
            
        except Exception as e:
            logger.error(f"PDF extraction error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'questions': [],
                'total_questions': 0
            }
    
    def _extract_questions_with_options(self, pdf_path: str) -> List[Dict]:
        """Extract questions and their options from PDF"""
        questions = []
        
        try:
            # Try pdfplumber first (better for structured text)
            with pdfplumber.open(pdf_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
            
            # Parse questions and options
            questions = self._parse_questions_from_text(full_text)
            
            # If no questions found, try OCR
            if not questions:
                logger.info("No questions found with text extraction, trying OCR...")
                questions = self._ocr_extract_questions(pdf_path)
                
        except Exception as e:
            logger.error(f"Question extraction error: {str(e)}")
            # Fallback to OCR
            questions = self._ocr_extract_questions(pdf_path)
        
        return questions
    
    def _parse_questions_from_text(self, text: str) -> List[Dict]:
        """Parse questions and options from extracted text"""
        questions = []
        
        # Try each question pattern
        for pattern in self.question_patterns:
            matches = re.finditer(pattern, text, re.DOTALL | re.MULTILINE)
            for match in matches:
                q_num = match.group(1) if len(match.groups()) > 1 else len(questions) + 1
                q_text = match.group(2) if len(match.groups()) > 1 else match.group(1)
                
                # Extract options for this question
                options = self._extract_options_for_question(q_text)
                
                if len(options) >= 4:  # Valid MCQ must have at least 4 options
                    questions.append({
                        'question_number': int(q_num) if str(q_num).isdigit() else len(questions) + 1,
                        'question_text': q_text.strip(),
                        'options': options[:4],  # Take first 4 options
                        'raw_text': q_text
                    })
            
            if questions:
                break  # Found questions with this pattern
        
        return questions
    
    def _extract_options_for_question(self, question_text: str) -> List[str]:
        """Extract options (A, B, C, D) from question text"""
        options = []
        
        for pattern in self.option_patterns:
            matches = re.finditer(pattern, question_text, re.MULTILINE)
            for match in matches:
                option_letter = match.group(1)
                option_text = match.group(2).strip()
                
                if option_text and len(option_text) > 0:
                    options.append(option_text)
        
        return options
    
    def _ocr_extract_questions(self, pdf_path: str) -> List[Dict]:
        """Extract questions using OCR (for scanned PDFs)"""
        questions = []
        
        try:
            doc = fitz.open(pdf_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Perform OCR
                text = pytesseract.image_to_string(img)
                
                # Parse questions from OCR text
                page_questions = self._parse_questions_from_text(text)
                questions.extend(page_questions)
            
            doc.close()
            
        except Exception as e:
            logger.error(f"OCR extraction error: {str(e)}")
        
        return questions
    
    def _extract_images(self, pdf_path: str) -> List[Dict]:
        """Extract all images from PDF"""
        images = []
        
        try:
            doc = fitz.open(pdf_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                for img_index, img_info in enumerate(image_list):
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)
                    
                    image_bytes = base_image["image"]
                    image_ext = base_image["ext"]
                    
                    # Convert to base64 for temporary storage
                    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
                    
                    images.append({
                        'page': page_num + 1,
                        'index': img_index,
                        'format': image_ext,
                        'data': image_base64,
                        'size': len(image_bytes)
                    })
            
            doc.close()
            
        except Exception as e:
            logger.error(f"Image extraction error: {str(e)}")
        
        return images
    
    def _extract_answer_key(self, answer_key_path: str) -> Dict[int, str]:
        """Extract answer key from PDF"""
        answer_key = {}
        
        try:
            # Try text extraction first
            with pdfplumber.open(answer_key_path) as pdf:
                full_text = ""
                for page in pdf.pages:
                    full_text += page.extract_text() or ""
            
            # Parse answers
            for pattern in self.answer_patterns:
                matches = re.finditer(pattern, full_text, re.MULTILINE)
                for match in matches:
                    # Determine which group is question number and which is answer
                    group1, group2 = match.group(1), match.group(2)
                    
                    if group1.isdigit():
                        q_num, answer = int(group1), group2
                    else:
                        q_num, answer = int(group2), group1
                    
                    answer_key[q_num] = answer.upper()
            
            # If no answers found, try OCR
            if not answer_key:
                logger.info("No answers found with text extraction, trying OCR...")
                answer_key = self._ocr_extract_answer_key(answer_key_path)
                
        except Exception as e:
            logger.error(f"Answer key extraction error: {str(e)}")
        
        return answer_key
    
    def _ocr_extract_answer_key(self, answer_key_path: str) -> Dict[int, str]:
        """Extract answer key using OCR"""
        answer_key = {}
        
        try:
            doc = fitz.open(answer_key_path)
            
            for page_num in range(len(doc)):
                page = doc[page_num]
                
                # Convert page to image
                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                
                # Perform OCR
                text = pytesseract.image_to_string(img)
                
                # Parse answers
                for pattern in self.answer_patterns:
                    matches = re.finditer(pattern, text, re.MULTILINE)
                    for match in matches:
                        group1, group2 = match.group(1), match.group(2)
                        
                        if group1.isdigit():
                            q_num, answer = int(group1), group2
                        else:
                            q_num, answer = int(group2), group1
                        
                        answer_key[q_num] = answer.upper()
            
            doc.close()
            
        except Exception as e:
            logger.error(f"OCR answer key extraction error: {str(e)}")
        
        return answer_key
    
    def _match_questions_with_answers(self, questions: List[Dict], answer_key: Dict[int, str], images: List[Dict]) -> List[Dict]:
        """Match extracted questions with their answers"""
        matched = []
        
        for q in questions:
            q_num = q['question_number']
            
            # Find answer from key
            correct_answer = answer_key.get(q_num)
            
            # Calculate confidence score
            confidence = 1.0 if correct_answer else 0.5
            
            # Try to match images to questions (basic proximity matching)
            related_images = [img for img in images if img['page'] == q.get('page', 1)]
            
            matched_q = {
                'question_number': q_num,
                'question_text': q['question_text'],
                'options': q['options'],
                'correct_answer': correct_answer,
                'confidence_score': confidence,
                'has_answer': correct_answer is not None,
                'related_images': related_images,
                'source_notes': f"Extracted from PDF, page {q.get('page', 'unknown')}"
            }
            
            matched.append(matched_q)
        
        return matched
    
    def _generate_warnings(self, questions: List[Dict]) -> List[str]:
        """Generate warnings for extracted data"""
        warnings = []
        
        # Check for questions without answers
        no_answer_count = sum(1 for q in questions if not q.get('has_answer'))
        if no_answer_count > 0:
            warnings.append(f"{no_answer_count} questions missing answer key")
        
        # Check for low confidence questions
        low_confidence = sum(1 for q in questions if q.get('confidence_score', 0) < 0.7)
        if low_confidence > 0:
            warnings.append(f"{low_confidence} questions with low confidence score")
        
        # Check if too many questions failed
        if len(questions) == 0:
            warnings.append("No questions extracted from PDF")
        
        return warnings
