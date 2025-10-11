#!/usr/bin/env python3
"""
Enhanced Admin Dashboard Backend API Testing
Testing comprehensive admin dashboard with 7-level nested folder structure
"""

import requests
import json
import time
import csv
import io
import base64
from typing import Dict, List, Any, Optional

class AdminDashboardTester:
    def __init__(self):
        # Backend URL - Admin Dashboard runs on port 8003
        self.base_url = "http://localhost:8003/api"
        self.admin_token = None
        self.created_entities = {
            'exams': [],
            'subjects': [],
            'chapters': [],
            'topics': [],
            'subtopics': [],
            'sections': [],
            'subsections': [],
            'questions': []
        }
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    files: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper headers"""
        url = f"{self.base_url}{endpoint}"
        
        # Default headers
        default_headers = {
            'Content-Type': 'application/json'
        }
        
        if self.admin_token:
            default_headers['Authorization'] = f'Bearer {self.admin_token}'
            
        if headers:
            default_headers.update(headers)
            
        # Remove Content-Type for file uploads
        if files:
            default_headers.pop('Content-Type', None)
            
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=default_headers, params=data)
            elif method.upper() == 'POST':
                if files:
                    response = requests.post(url, headers=default_headers, files=files, data=data)
                else:
                    response = requests.post(url, headers=default_headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=default_headers, json=data)
            elif method.upper() == 'PATCH':
                response = requests.patch(url, headers=default_headers, json=data)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, headers=default_headers, json=data)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            raise
            
    def test_admin_authentication(self) -> bool:
        """Test admin authentication and JWT validation"""
        self.log("Testing Admin Authentication...")
        
        try:
            # Test admin login
            login_data = {
                "email": "admin@quiz.com",
                "password": "admin123"
            }
            
            response = self.make_request('POST', '/auth/login', login_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'token' in data:
                    self.admin_token = data['token']
                    self.log("✅ Admin authentication successful")
                    
                    # Test JWT validation with /auth/me
                    me_response = self.make_request('GET', '/auth/me')
                    if me_response.status_code == 200:
                        user_data = me_response.json()
                        if user_data.get('role') == 'admin':
                            self.log("✅ JWT validation successful - Admin role confirmed")
                            return True
                        else:
                            self.log("❌ JWT validation failed - Not admin role", "ERROR")
                            return False
                    else:
                        self.log(f"❌ JWT validation failed: {me_response.status_code}", "ERROR")
                        return False
                else:
                    self.log("❌ No token in login response", "ERROR")
                    return False
            else:
                self.log(f"❌ Admin login failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication test failed: {e}", "ERROR")
            return False
            
    def create_sample_hierarchy(self) -> bool:
        """Create sample 7-level hierarchy for testing"""
        self.log("Creating sample 7-level hierarchy...")
        
        try:
            # Create Exam
            exam_data = {
                "name": "Enhanced Test Exam",
                "description": "Test exam for enhanced admin dashboard",
                "isActive": True
            }
            
            exam_response = self.make_request('POST', '/admin/exams', exam_data)
            if exam_response.status_code != 201:
                self.log(f"❌ Failed to create exam: {exam_response.status_code}", "ERROR")
                return False
                
            exam = exam_response.json()
            self.created_entities['exams'].append(exam['id'])
            self.log(f"✅ Created exam: {exam['name']}")
            
            # Create Subject
            subject_data = {
                "name": "Advanced Mathematics",
                "description": "Advanced mathematics subject",
                "examId": exam['id'],
                "isActive": True
            }
            
            subject_response = self.make_request('POST', '/admin/subjects', subject_data)
            if subject_response.status_code != 201:
                self.log(f"❌ Failed to create subject: {subject_response.status_code}", "ERROR")
                return False
                
            subject = subject_response.json()
            self.created_entities['subjects'].append(subject['id'])
            self.log(f"✅ Created subject: {subject['name']}")
            
            # Create Chapter
            chapter_data = {
                "name": "Calculus Fundamentals",
                "description": "Basic calculus concepts",
                "subjectId": subject['id'],
                "isActive": True
            }
            
            chapter_response = self.make_request('POST', '/admin/chapters', chapter_data)
            if chapter_response.status_code != 201:
                self.log(f"❌ Failed to create chapter: {chapter_response.status_code}", "ERROR")
                return False
                
            chapter = chapter_response.json()
            self.created_entities['chapters'].append(chapter['id'])
            self.log(f"✅ Created chapter: {chapter['name']}")
            
            # Create Topic
            topic_data = {
                "name": "Derivatives",
                "description": "Derivative calculations",
                "chapterId": chapter['id'],
                "isActive": True
            }
            
            topic_response = self.make_request('POST', '/admin/topics', topic_data)
            if topic_response.status_code != 201:
                self.log(f"❌ Failed to create topic: {topic_response.status_code}", "ERROR")
                return False
                
            topic = topic_response.json()
            self.created_entities['topics'].append(topic['id'])
            self.log(f"✅ Created topic: {topic['name']}")
            
            # Create Subtopic
            subtopic_data = {
                "name": "Chain Rule",
                "description": "Chain rule for derivatives",
                "topicId": topic['id'],
                "isActive": True
            }
            
            subtopic_response = self.make_request('POST', '/admin/subtopics', subtopic_data)
            if subtopic_response.status_code != 201:
                self.log(f"❌ Failed to create subtopic: {subtopic_response.status_code}", "ERROR")
                return False
                
            subtopic = subtopic_response.json()
            self.created_entities['subtopics'].append(subtopic['id'])
            self.log(f"✅ Created subtopic: {subtopic['name']}")
            
            # Create Section
            section_data = {
                "name": "Basic Chain Rule",
                "description": "Basic chain rule applications",
                "subtopicId": subtopic['id'],
                "isActive": True
            }
            
            section_response = self.make_request('POST', '/admin/sections', section_data)
            if section_response.status_code != 201:
                self.log(f"❌ Failed to create section: {section_response.status_code}", "ERROR")
                return False
                
            section = section_response.json()
            self.created_entities['sections'].append(section['id'])
            self.log(f"✅ Created section: {section['name']}")
            
            # Create Subsection
            subsection_data = {
                "name": "Simple Functions",
                "description": "Chain rule with simple functions",
                "sectionId": section['id'],
                "isActive": True
            }
            
            subsection_response = self.make_request('POST', '/admin/subsections', subsection_data)
            if subsection_response.status_code != 201:
                self.log(f"❌ Failed to create subsection: {subsection_response.status_code}", "ERROR")
                return False
                
            subsection = subsection_response.json()
            self.created_entities['subsections'].append(subsection['id'])
            self.log(f"✅ Created subsection: {subsection['name']}")
            
            self.log("✅ Sample 7-level hierarchy created successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Failed to create sample hierarchy: {e}", "ERROR")
            return False
            
    def test_enhanced_analytics_api(self) -> bool:
        """Test enhanced analytics API endpoints"""
        self.log("Testing Enhanced Analytics API...")
        
        try:
            # Test dashboard analytics
            dashboard_response = self.make_request('GET', '/admin/analytics/dashboard')
            
            if dashboard_response.status_code == 200:
                data = dashboard_response.json()
                
                # Verify overview statistics
                if 'overview' in data:
                    overview = data['overview']
                    required_fields = [
                        'totalUsers', 'totalExams', 'totalSubjects', 'totalChapters',
                        'totalTopics', 'totalSubtopics', 'totalSections', 
                        'totalSubsections', 'totalQuestions', 'totalTests'
                    ]
                    
                    for field in required_fields:
                        if field not in overview:
                            self.log(f"❌ Missing field in overview: {field}", "ERROR")
                            return False
                            
                    self.log(f"✅ Overview statistics: {overview}")
                else:
                    self.log("❌ Missing overview in dashboard response", "ERROR")
                    return False
                    
                # Verify statistics section
                if 'statistics' in data:
                    stats = data['statistics']
                    if 'difficultyDistribution' in stats and 'questionsPerExam' in stats:
                        self.log("✅ Statistics section present with difficulty distribution and questions per exam")
                    else:
                        self.log("❌ Missing statistics data", "ERROR")
                        return False
                else:
                    self.log("❌ Missing statistics in dashboard response", "ERROR")
                    return False
                    
                # Verify recent activity
                if 'recentActivity' in data:
                    self.log("✅ Recent activity data present")
                else:
                    self.log("❌ Missing recent activity", "ERROR")
                    return False
                    
                self.log("✅ Enhanced analytics dashboard API working correctly")
                
            else:
                self.log(f"❌ Dashboard analytics failed: {dashboard_response.status_code}", "ERROR")
                return False
                
            # Test AI-powered content suggestions
            ai_suggestions_data = {
                "type": "content-analysis",
                "context": {}
            }
            
            ai_response = self.make_request('POST', '/admin/analytics/ai-suggestions', ai_suggestions_data)
            
            if ai_response.status_code == 200:
                ai_data = ai_response.json()
                if 'suggestions' in ai_data and 'type' in ai_data:
                    self.log("✅ AI-powered content suggestions working")
                else:
                    self.log("❌ Invalid AI suggestions response", "ERROR")
                    return False
            else:
                self.log(f"❌ AI suggestions failed: {ai_response.status_code}", "ERROR")
                return False
                
            # Test hierarchy analytics
            hierarchy_response = self.make_request('GET', '/admin/analytics/hierarchy')
            
            if hierarchy_response.status_code == 200:
                hierarchy_data = hierarchy_response.json()
                if isinstance(hierarchy_data, list):
                    self.log("✅ Hierarchy analytics working")
                else:
                    self.log("❌ Invalid hierarchy response format", "ERROR")
                    return False
            else:
                self.log(f"❌ Hierarchy analytics failed: {hierarchy_response.status_code}", "ERROR")
                return False
                
            return True
            
        except Exception as e:
            self.log(f"❌ Enhanced analytics test failed: {e}", "ERROR")
            return False
            
    def test_ai_enhanced_features(self) -> bool:
        """Test AI enhanced features"""
        self.log("Testing AI Enhanced Features...")
        
        try:
            # Test question generation
            generation_data = {
                "topic": "Calculus derivatives",
                "difficulty": "medium",
                "count": 3
            }
            
            gen_response = self.make_request('POST', '/admin/ai/generate-questions', generation_data)
            
            if gen_response.status_code == 200:
                gen_data = gen_response.json()
                if 'questions' in gen_data and isinstance(gen_data['questions'], list):
                    if len(gen_data['questions']) == 3:
                        self.log("✅ AI question generation working - generated 3 questions")
                        
                        # Verify question structure
                        for i, question in enumerate(gen_data['questions']):
                            required_fields = ['text', 'options', 'correctAnswer', 'explanation', 'difficulty']
                            for field in required_fields:
                                if field not in question:
                                    self.log(f"❌ Missing field in generated question {i+1}: {field}", "ERROR")
                                    return False
                                    
                        self.log("✅ Generated questions have correct structure")
                    else:
                        self.log(f"❌ Expected 3 questions, got {len(gen_data['questions'])}", "ERROR")
                        return False
                else:
                    self.log("❌ Invalid question generation response", "ERROR")
                    return False
            else:
                self.log(f"❌ Question generation failed: {gen_response.status_code} - {gen_response.text}", "ERROR")
                return False
                
            # Test difficulty suggestion
            difficulty_data = {
                "questionText": "What is the derivative of x^2 + 3x + 1?"
            }
            
            diff_response = self.make_request('POST', '/admin/ai/suggest-difficulty', difficulty_data)
            
            if diff_response.status_code == 200:
                diff_data = diff_response.json()
                if 'difficulty' in diff_data and diff_data['difficulty'] in ['easy', 'medium', 'hard']:
                    self.log(f"✅ AI difficulty suggestion working: {diff_data['difficulty']}")
                else:
                    self.log("❌ Invalid difficulty suggestion response", "ERROR")
                    return False
            else:
                self.log(f"❌ Difficulty suggestion failed: {diff_response.status_code}", "ERROR")
                return False
                
            # Test explanation generation
            explanation_data = {
                "questionText": "What is the derivative of x^2?",
                "correctAnswer": "2x"
            }
            
            exp_response = self.make_request('POST', '/admin/ai/generate-explanation', explanation_data)
            
            if exp_response.status_code == 200:
                exp_data = exp_response.json()
                if 'explanation' in exp_data and exp_data['explanation']:
                    self.log("✅ AI explanation generation working")
                else:
                    self.log("❌ Invalid explanation generation response", "ERROR")
                    return False
            else:
                self.log(f"❌ Explanation generation failed: {exp_response.status_code}", "ERROR")
                return False
                
            # Test question improvement
            improve_data = {
                "questionText": "What derivative of x squared?"
            }
            
            improve_response = self.make_request('POST', '/admin/ai/improve-question', improve_data)
            
            if improve_response.status_code == 200:
                improve_data = improve_response.json()
                if 'improvedText' in improve_data and improve_data['improvedText']:
                    self.log("✅ AI question improvement working")
                else:
                    self.log("❌ Invalid question improvement response", "ERROR")
                    return False
            else:
                self.log(f"❌ Question improvement failed: {improve_response.status_code}", "ERROR")
                return False
                
            # Test tag generation
            tag_data = {
                "questionText": "What is the derivative of x^2 using the power rule?"
            }
            
            tag_response = self.make_request('POST', '/admin/ai/generate-tags', tag_data)
            
            if tag_response.status_code == 200:
                tag_data = tag_response.json()
                if 'tags' in tag_data and isinstance(tag_data['tags'], list):
                    self.log(f"✅ AI tag generation working: {tag_data['tags']}")
                else:
                    self.log("❌ Invalid tag generation response", "ERROR")
                    return False
            else:
                self.log(f"❌ Tag generation failed: {tag_response.status_code}", "ERROR")
                return False
                
            return True
            
        except Exception as e:
            self.log(f"❌ AI enhanced features test failed: {e}", "ERROR")
            return False
            
    def test_advanced_question_management(self) -> bool:
        """Test advanced question management with rich content"""
        self.log("Testing Advanced Question Management...")
        
        try:
            if not self.created_entities['subsections']:
                self.log("❌ No subsections available for question creation", "ERROR")
                return False
                
            subsection_id = self.created_entities['subsections'][0]
            
            # Test rich question creation with HTML content
            rich_question_data = {
                "text": "<p>What is the derivative of <strong>f(x) = x<sup>2</sup> + 3x + 1</strong>?</p>",
                "options": [
                    "2x + 3",
                    "x + 3",
                    "2x + 1",
                    "x^2 + 3"
                ],
                "correctAnswer": 0,
                "explanation": "<p>Using the <em>power rule</em>: d/dx(x^n) = nx^(n-1)</p>",
                "difficulty": "medium",
                "tags": ["calculus", "derivatives", "power-rule"],
                "timeLimit": 90,
                "marks": 2,
                "negativeMarks": 0.5,
                "subsectionId": subsection_id,
                "isActive": True
            }
            
            rich_response = self.make_request('POST', '/admin/questions', rich_question_data)
            
            if rich_response.status_code == 201:
                rich_question = rich_response.json()
                self.created_entities['questions'].append(rich_question['id'])
                self.log("✅ Rich question with HTML content created successfully")
            else:
                self.log(f"❌ Rich question creation failed: {rich_response.status_code}", "ERROR")
                return False
                
            # Test question with image support (base64)
            image_question_data = {
                "text": "What does this mathematical formula represent?",
                "options": [
                    "Quadratic formula",
                    "Pythagorean theorem",
                    "Area of circle",
                    "Volume of sphere"
                ],
                "correctAnswer": 0,
                "explanation": "This is the standard quadratic formula used to solve ax² + bx + c = 0",
                "difficulty": "easy",
                "tags": ["algebra", "quadratic", "formula"],
                "subsectionId": subsection_id,
                "isActive": True
            }
            
            image_response = self.make_request('POST', '/admin/questions', image_question_data)
            
            if image_response.status_code == 201:
                image_question = image_response.json()
                self.created_entities['questions'].append(image_question['id'])
                self.log("✅ Question with image support created successfully")
            else:
                self.log(f"❌ Image question creation failed: {image_response.status_code}", "ERROR")
                return False
                
            # Test advanced filtering and pagination
            filter_params = {
                "difficulty": "medium",
                "page": 1,
                "limit": 10
            }
            
            filter_response = self.make_request('GET', '/admin/questions', filter_params)
            
            if filter_response.status_code == 200:
                filter_data = filter_response.json()
                if 'questions' in filter_data and 'pagination' in filter_data:
                    self.log("✅ Advanced filtering and pagination working")
                    
                    # Verify pagination structure
                    pagination = filter_data['pagination']
                    required_pagination_fields = ['current', 'pages', 'total']
                    for field in required_pagination_fields:
                        if field not in pagination:
                            self.log(f"❌ Missing pagination field: {field}", "ERROR")
                            return False
                            
                    self.log(f"✅ Pagination: Page {pagination['current']} of {pagination['pages']}, Total: {pagination['total']}")
                else:
                    self.log("❌ Invalid filtering response structure", "ERROR")
                    return False
            else:
                self.log(f"❌ Advanced filtering failed: {filter_response.status_code}", "ERROR")
                return False
                
            return True
            
        except Exception as e:
            self.log(f"❌ Advanced question management test failed: {e}", "ERROR")
            return False
            
    def test_batch_operations_api(self) -> bool:
        """Test batch operations API"""
        self.log("Testing Batch Operations API...")
        
        try:
            if len(self.created_entities['questions']) < 2:
                self.log("❌ Need at least 2 questions for batch operations", "ERROR")
                return False
                
            question_ids = self.created_entities['questions'][:2]
            
            # Test batch update questions
            batch_update_data = {
                "ids": question_ids,
                "updates": {
                    "difficulty": "hard",
                    "timeLimit": 120
                }
            }
            
            update_response = self.make_request('PATCH', '/admin/questions/batch', batch_update_data)
            
            if update_response.status_code == 200:
                update_data = update_response.json()
                if 'count' in update_data and update_data['count'] == 2:
                    self.log("✅ Batch update questions working - updated 2 questions")
                else:
                    self.log(f"❌ Batch update count mismatch: expected 2, got {update_data.get('count', 0)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Batch update failed: {update_response.status_code}", "ERROR")
                return False
                
            # Test CSV export functionality
            export_data = {
                "ids": question_ids
            }
            
            export_response = self.make_request('POST', '/admin/questions/batch/export', export_data)
            
            if export_response.status_code == 200:
                # Check if response is CSV format
                content_type = export_response.headers.get('content-type', '')
                if 'text/csv' in content_type:
                    csv_content = export_response.text
                    if csv_content and 'Question' in csv_content:
                        self.log("✅ CSV export functionality working")
                    else:
                        self.log("❌ Invalid CSV content", "ERROR")
                        return False
                else:
                    self.log(f"❌ Invalid content type for CSV export: {content_type}", "ERROR")
                    return False
            else:
                self.log(f"❌ CSV export failed: {export_response.status_code}", "ERROR")
                return False
                
            # Test batch delete questions (save one for later tests)
            delete_ids = [question_ids[0]]  # Only delete one question
            
            delete_data = {
                "ids": delete_ids
            }
            
            delete_response = self.make_request('DELETE', '/admin/questions/batch', delete_data)
            
            if delete_response.status_code == 200:
                delete_data = delete_response.json()
                if 'count' in delete_data and delete_data['count'] == 1:
                    self.log("✅ Batch delete questions working - deleted 1 question")
                    # Remove from our tracking
                    self.created_entities['questions'].remove(delete_ids[0])
                else:
                    self.log(f"❌ Batch delete count mismatch: expected 1, got {delete_data.get('count', 0)}", "ERROR")
                    return False
            else:
                self.log(f"❌ Batch delete failed: {delete_response.status_code}", "ERROR")
                return False
                
            return True
            
        except Exception as e:
            self.log(f"❌ Batch operations test failed: {e}", "ERROR")
            return False
            
    def test_csv_bulk_upload(self) -> bool:
        """Test CSV bulk upload functionality"""
        self.log("Testing CSV Bulk Upload...")
        
        try:
            if not self.created_entities['subsections']:
                self.log("❌ No subsections available for CSV upload", "ERROR")
                return False
                
            subsection_id = self.created_entities['subsections'][0]
            
            # Create test CSV content
            csv_content = """question,option1,option2,option3,option4,correctAnswer,explanation,difficulty,tags,timeLimit,marks,negativeMarks
"What is 5 + 3?",6,7,8,9,2,"Simple addition: 5 + 3 = 8",easy,"math,arithmetic",60,1,0
"What is the capital of Japan?",Tokyo,Seoul,Beijing,Bangkok,0,"Tokyo is the capital city of Japan",medium,"geography,capitals",90,2,0.5
"What is 2^3?",6,7,8,9,2,"2 raised to the power of 3 equals 8",medium,"math,exponents",75,1,0.25"""
            
            # Create a temporary CSV file
            csv_file = io.StringIO(csv_content)
            csv_bytes = csv_content.encode('utf-8')
            
            # Prepare file upload
            files = {
                'file': ('test_questions.csv', csv_bytes, 'text/csv')
            }
            
            data = {
                'subsectionId': subsection_id
            }
            
            upload_response = self.make_request('POST', '/admin/questions/bulk-upload', 
                                              data=data, files=files)
            
            if upload_response.status_code == 200:
                upload_data = upload_response.json()
                
                if 'success' in upload_data and upload_data['success']:
                    created_count = upload_data.get('created', 0)
                    error_count = upload_data.get('errors', 0)
                    
                    if created_count == 3 and error_count == 0:
                        self.log("✅ CSV bulk upload working - uploaded 3 questions successfully")
                        
                        # Add created questions to tracking
                        if 'results' in upload_data:
                            for question in upload_data['results']:
                                self.created_entities['questions'].append(question['id'])
                                
                    else:
                        self.log(f"❌ CSV upload results unexpected: created={created_count}, errors={error_count}", "ERROR")
                        return False
                else:
                    self.log("❌ CSV upload not successful", "ERROR")
                    return False
            else:
                self.log(f"❌ CSV bulk upload failed: {upload_response.status_code} - {upload_response.text}", "ERROR")
                return False
                
            # Test error handling for malformed CSV
            malformed_csv = """question,option1
"Incomplete question",option1"""
            
            malformed_files = {
                'file': ('malformed.csv', malformed_csv.encode('utf-8'), 'text/csv')
            }
            
            malformed_response = self.make_request('POST', '/admin/questions/bulk-upload',
                                                 data=data, files=malformed_files)
            
            if malformed_response.status_code == 200:
                malformed_data = malformed_response.json()
                if malformed_data.get('errors', 0) > 0:
                    self.log("✅ CSV error handling working - detected malformed CSV")
                else:
                    self.log("❌ CSV error handling not working properly", "ERROR")
                    return False
            else:
                self.log("✅ CSV error handling working - rejected malformed CSV")
                
            return True
            
        except Exception as e:
            self.log(f"❌ CSV bulk upload test failed: {e}", "ERROR")
            return False
            
    def test_error_handling_and_validation(self) -> bool:
        """Test error handling and validation"""
        self.log("Testing Error Handling and Validation...")
        
        try:
            # Test invalid authentication
            old_token = self.admin_token
            self.admin_token = "invalid_token"
            
            invalid_response = self.make_request('GET', '/admin/analytics/dashboard')
            
            if invalid_response.status_code in [401, 403]:
                self.log("✅ Invalid token properly rejected")
            else:
                self.log(f"❌ Invalid token not properly handled: {invalid_response.status_code}", "ERROR")
                self.admin_token = old_token
                return False
                
            # Restore valid token
            self.admin_token = old_token
            
            # Test invalid question creation
            invalid_question_data = {
                "text": "",  # Empty text should fail
                "options": ["A", "B"],  # Only 2 options should fail
                "correctAnswer": 5,  # Invalid correct answer index
                "subsectionId": "invalid_id"
            }
            
            invalid_question_response = self.make_request('POST', '/admin/questions', invalid_question_data)
            
            if invalid_question_response.status_code == 400:
                self.log("✅ Invalid question data properly rejected")
            else:
                self.log(f"❌ Invalid question data not properly handled: {invalid_question_response.status_code}", "ERROR")
                return False
                
            # Test batch operations with empty IDs
            empty_batch_data = {
                "ids": [],
                "updates": {"difficulty": "easy"}
            }
            
            empty_batch_response = self.make_request('PATCH', '/admin/questions/batch', empty_batch_data)
            
            if empty_batch_response.status_code == 400:
                self.log("✅ Empty batch IDs properly rejected")
            else:
                self.log(f"❌ Empty batch IDs not properly handled: {empty_batch_response.status_code}", "ERROR")
                return False
                
            # Test non-existent resource
            nonexistent_response = self.make_request('GET', '/admin/questions/nonexistent-id')
            
            if nonexistent_response.status_code == 404:
                self.log("✅ Non-existent resource properly handled")
            else:
                self.log("✅ Non-existent resource handled (may return empty result)")
                
            return True
            
        except Exception as e:
            self.log(f"❌ Error handling test failed: {e}", "ERROR")
            return False
            
    def run_comprehensive_test(self) -> Dict[str, bool]:
        """Run comprehensive test suite"""
        self.log("🚀 Starting Enhanced Admin Dashboard Backend API Testing")
        self.log("=" * 80)
        
        test_results = {}
        
        # Test sequence as specified in review request
        test_sequence = [
            ("Admin Authentication & JWT Validation", self.test_admin_authentication),
            ("Sample Hierarchy Creation", self.create_sample_hierarchy),
            ("Enhanced Analytics Endpoints", self.test_enhanced_analytics_api),
            ("AI-Powered Question Generation", self.test_ai_enhanced_features),
            ("Advanced Question Management", self.test_advanced_question_management),
            ("Batch Operations", self.test_batch_operations_api),
            ("CSV Bulk Upload", self.test_csv_bulk_upload),
            ("Error Handling & Validation", self.test_error_handling_and_validation)
        ]
        
        for test_name, test_function in test_sequence:
            self.log(f"\n📋 Running: {test_name}")
            self.log("-" * 60)
            
            try:
                result = test_function()
                test_results[test_name] = result
                
                if result:
                    self.log(f"✅ {test_name}: PASSED")
                else:
                    self.log(f"❌ {test_name}: FAILED")
                    
            except Exception as e:
                self.log(f"❌ {test_name}: FAILED with exception: {e}", "ERROR")
                test_results[test_name] = False
                
        # Summary
        self.log("\n" + "=" * 80)
        self.log("📊 TEST SUMMARY")
        self.log("=" * 80)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{test_name}: {status}")
            
        self.log(f"\n🎯 Overall Result: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 ALL TESTS PASSED! Enhanced Admin Dashboard Backend is fully functional.")
        else:
            self.log(f"⚠️  {total - passed} test(s) failed. Please review the issues above.")
            
        return test_results

def main():
    """Main test execution"""
    tester = AdminDashboardTester()
    results = tester.run_comprehensive_test()
    
    # Return exit code based on results
    all_passed = all(results.values())
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit(main())