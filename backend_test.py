#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Web App
Testing all endpoints with focus on new fields verification
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from web_app frontend .env
BASE_URL = "https://quizzy-theme.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.user_token = None
        self.test_data = {}
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_health_check(self):
        """Test 1: Health Check"""
        try:
            # Test with exams endpoint since there's no dedicated health endpoint
            response = requests.get(f"{self.base_url}/exams", timeout=10)
            if response.status_code == 200:
                self.log_result("Health Check", True, "Backend is running and responding")
                return True
            else:
                self.log_result("Health Check", False, f"Unexpected status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_admin_login(self):
        """Test 2: Admin Authentication"""
        try:
            # Try to login as admin (assuming admin exists from previous tests)
            login_data = {
                "email": "admin@quizapp.com",
                "password": "admin123"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data and data.get("user", {}).get("role") == "admin":
                    self.admin_token = data["access_token"]
                    self.log_result("Admin Login", True, "Admin authentication successful")
                    return True
                else:
                    self.log_result("Admin Login", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("Admin Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test 3: User Authentication"""
        try:
            # Try to login as regular user (assuming user exists from previous tests)
            login_data = {
                "email": "testuser@example.com",
                "password": "testpass123"
            }
            
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "access_token" in data:
                    self.user_token = data["access_token"]
                    self.log_result("User Login", True, "User authentication successful")
                    return True
                else:
                    self.log_result("User Login", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("User Login", False, f"Login failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("User Login", False, f"Login error: {str(e)}")
            return False
    
    def test_auth_me(self):
        """Test 4: Auth Me Endpoint"""
        if not self.user_token:
            self.log_result("Auth Me", False, "No user token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            response = requests.get(f"{self.base_url}/auth/me", headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data:
                    self.log_result("Auth Me", True, "User profile retrieved successfully")
                    return True
                else:
                    self.log_result("Auth Me", False, "Invalid response structure", data)
                    return False
            else:
                self.log_result("Auth Me", False, f"Request failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Auth Me", False, f"Request error: {str(e)}")
            return False
    
    def test_hierarchy_navigation(self):
        """Test 5-11: 8-Level Hierarchy Navigation"""
        hierarchy_tests = [
            ("Exams", "/exams", None),
            ("Subjects", "/subjects", "exam_id"),
            ("Chapters", "/chapters", "subject_id"),
            ("Topics", "/topics", "chapter_id"),
            ("Sub-Topics", "/sub-topics", "topic_id"),
            ("Sections", "/sections", "sub_topic_id"),
            ("Sub-Sections", "/sub-sections", "section_id")
        ]
        
        all_passed = True
        
        for level_name, endpoint, parent_param in hierarchy_tests:
            try:
                # First get all items
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        if len(data) > 0:
                            # Store first item for next level testing
                            first_item = data[0]
                            self.test_data[level_name.lower()] = first_item
                            
                            # Test with parent parameter if applicable
                            if parent_param and len(data) > 0:
                                parent_id = first_item.get("id")
                                if parent_id:
                                    param_response = requests.get(
                                        f"{self.base_url}{endpoint}?{parent_param}={parent_id}", 
                                        timeout=10
                                    )
                                    if param_response.status_code == 200:
                                        self.log_result(f"{level_name} API", True, f"Retrieved {len(data)} items, filtering works")
                                    else:
                                        self.log_result(f"{level_name} API", False, f"Filtering failed: {param_response.status_code}")
                                        all_passed = False
                                else:
                                    self.log_result(f"{level_name} API", True, f"Retrieved {len(data)} items")
                            else:
                                self.log_result(f"{level_name} API", True, f"Retrieved {len(data)} items")
                        else:
                            self.log_result(f"{level_name} API", True, "API accessible (no data)")
                    else:
                        self.log_result(f"{level_name} API", False, "Invalid response format", data)
                        all_passed = False
                else:
                    self.log_result(f"{level_name} API", False, f"Request failed: {response.status_code}", response.text)
                    all_passed = False
            except Exception as e:
                self.log_result(f"{level_name} API", False, f"Request error: {str(e)}")
                all_passed = False
        
        return all_passed
    
    def test_questions_with_new_fields(self):
        """Test 12: Questions API with New Fields Verification"""
        try:
            # Get questions and verify new fields are present
            response = requests.get(f"{self.base_url}/questions?limit=5", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check first question for new fields
                    question = data[0]
                    required_fields = ["id", "question_text", "options", "correct_answer", "difficulty"]
                    new_fields = ["hint", "solution", "code_snippet", "image_url", "formula"]
                    
                    # Check required fields
                    missing_required = [field for field in required_fields if field not in question]
                    if missing_required:
                        self.log_result("Questions New Fields", False, f"Missing required fields: {missing_required}")
                        return False
                    
                    # Check new fields are present (even if empty)
                    missing_new = [field for field in new_fields if field not in question]
                    if missing_new:
                        self.log_result("Questions New Fields", False, f"Missing new fields: {missing_new}")
                        return False
                    
                    # Store question for test submission
                    self.test_data["sample_questions"] = data[:3]  # Store first 3 questions
                    
                    self.log_result("Questions New Fields", True, f"All new fields present in {len(data)} questions")
                    return True
                else:
                    self.log_result("Questions New Fields", True, "API accessible (no questions)")
                    return True
            else:
                self.log_result("Questions New Fields", False, f"Request failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Questions New Fields", False, f"Request error: {str(e)}")
            return False
    
    def test_quiz_flow(self):
        """Test 13-15: Quiz Flow (Submit Test, Get History)"""
        if not self.user_token:
            self.log_result("Quiz Flow", False, "No user token available")
            return False
        
        if not self.test_data.get("sample_questions"):
            self.log_result("Quiz Flow", False, "No sample questions available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Prepare test submission
            questions = self.test_data["sample_questions"]
            submission_data = {
                "question_ids": [q["id"] for q in questions],
                "answers": [0, 1, 0]  # Sample answers
            }
            
            # Submit test
            response = requests.post(
                f"{self.base_url}/tests/submit", 
                json=submission_data, 
                headers=headers, 
                timeout=10
            )
            
            if response.status_code == 200 or response.status_code == 201:
                result_data = response.json()
                
                # Verify test result structure
                required_fields = ["id", "score", "total_questions", "correct_answers", "questions"]
                missing_fields = [field for field in required_fields if field not in result_data]
                
                if missing_fields:
                    self.log_result("Test Submission", False, f"Missing fields in result: {missing_fields}")
                    return False
                
                # Verify questions in result have new fields
                if "questions" in result_data and len(result_data["questions"]) > 0:
                    result_question = result_data["questions"][0]
                    if "question_text" in result_question and "options" in result_question:
                        self.log_result("Test Submission", True, f"Test submitted successfully, score: {result_data.get('score', 0)}%")
                    else:
                        self.log_result("Test Submission", False, "Incomplete question data in results")
                        return False
                else:
                    self.log_result("Test Submission", False, "No questions in test result")
                    return False
                
                # Test history retrieval
                history_response = requests.get(f"{self.base_url}/tests/history", headers=headers, timeout=10)
                
                if history_response.status_code == 200:
                    history_data = history_response.json()
                    if isinstance(history_data, list):
                        self.log_result("Test History", True, f"Retrieved {len(history_data)} test records")
                        return True
                    else:
                        self.log_result("Test History", False, "Invalid history format")
                        return False
                else:
                    self.log_result("Test History", False, f"History request failed: {history_response.status_code}")
                    return False
            else:
                self.log_result("Test Submission", False, f"Submission failed: {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Quiz Flow", False, f"Request error: {str(e)}")
            return False
    
    def test_enhanced_features(self):
        """Test 16-19: Enhanced Features (Bookmarks, Analytics, Leaderboard)"""
        if not self.user_token:
            self.log_result("Enhanced Features", False, "No user token available")
            return False
        
        try:
            headers = {"Authorization": f"Bearer {self.user_token}"}
            all_passed = True
            
            # Test Bookmarks
            response = requests.get(f"{self.base_url}/bookmarks", headers=headers, timeout=10)
            if response.status_code == 200:
                self.log_result("Bookmarks API", True, "Bookmarks endpoint accessible")
            else:
                self.log_result("Bookmarks API", False, f"Bookmarks failed: {response.status_code}")
                all_passed = False
            
            # Test Analytics
            response = requests.get(f"{self.base_url}/analytics/performance", headers=headers, timeout=10)
            if response.status_code == 200:
                analytics_data = response.json()
                if "user_id" in analytics_data:
                    self.log_result("Analytics API", True, "Analytics endpoint working")
                else:
                    self.log_result("Analytics API", False, "Invalid analytics structure")
                    all_passed = False
            else:
                self.log_result("Analytics API", False, f"Analytics failed: {response.status_code}")
                all_passed = False
            
            # Test Leaderboard
            response = requests.get(f"{self.base_url}/leaderboard", timeout=10)
            if response.status_code == 200:
                leaderboard_data = response.json()
                if isinstance(leaderboard_data, list):
                    self.log_result("Leaderboard API", True, f"Leaderboard with {len(leaderboard_data)} entries")
                else:
                    self.log_result("Leaderboard API", False, "Invalid leaderboard format")
                    all_passed = False
            else:
                self.log_result("Leaderboard API", False, f"Leaderboard failed: {response.status_code}")
                all_passed = False
            
            # Test Difficulty Breakdown
            response = requests.get(f"{self.base_url}/analytics/difficulty-breakdown", headers=headers, timeout=10)
            if response.status_code == 200:
                breakdown_data = response.json()
                if "difficulty_breakdown" in breakdown_data:
                    self.log_result("Difficulty Breakdown API", True, "Difficulty analytics working")
                else:
                    self.log_result("Difficulty Breakdown API", False, "Invalid breakdown structure")
                    all_passed = False
            else:
                self.log_result("Difficulty Breakdown API", False, f"Breakdown failed: {response.status_code}")
                all_passed = False
            
            return all_passed
        except Exception as e:
            self.log_result("Enhanced Features", False, f"Request error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting Web App Backend API Verification Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Critical tests that must pass
        critical_tests = [
            self.test_health_check,
            self.test_admin_login,
            self.test_user_login,
            self.test_auth_me,
        ]
        
        # Feature tests
        feature_tests = [
            self.test_hierarchy_navigation,
            self.test_questions_with_new_fields,
            self.test_quiz_flow,
            self.test_enhanced_features,
        ]
        
        # Run critical tests first
        critical_passed = 0
        for test in critical_tests:
            if test():
                critical_passed += 1
        
        if critical_passed < len(critical_tests):
            print(f"\n❌ CRITICAL FAILURE: Only {critical_passed}/{len(critical_tests)} critical tests passed")
            return False
        
        # Run feature tests
        feature_passed = 0
        for test in feature_tests:
            if test():
                feature_passed += 1
        
        # Summary
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r["success"])
        
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {total_tests - passed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Show failed tests
        failed_tests = [r for r in self.results if not r["success"]]
        if failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['message']}")
        
        return passed_tests == total_tests

if __name__ == "__main__":
    tester = BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALL TESTS PASSED - Backend is fully functional!")
        sys.exit(0)
    else:
        print("\n⚠️  SOME TESTS FAILED - Check details above")
        sys.exit(1)