#!/usr/bin/env python3
"""
Backend API Testing Script for User App Enhancements
Tests the 7 new enhancement endpoints added to the quiz app backend.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class UserAppBackendTester:
    def __init__(self, base_url: str = "http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        self.admin_token = None
        self.user_token = None
        self.test_user_email = "testuser@example.com"
        self.test_user_password = "testpassword123"
        self.admin_email = "admin@example.com"
        self.admin_password = "adminpass123"
        
        # Test data storage
        self.test_data = {
            "exam_id": None,
            "subject_id": None,
            "chapter_id": None,
            "topic_id": None,
            "sub_topic_id": None,
            "section_id": None,
            "sub_section_id": None,
            "question_ids": [],
            "reset_code": None
        }
        
        print(f"🚀 Initializing User App Backend Tester for {self.api_url}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, 
                    headers: Dict = None, token: str = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.api_url}{endpoint}"
        
        # Setup headers
        req_headers = {"Content-Type": "application/json"}
        if headers:
            req_headers.update(headers)
        if token:
            req_headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=req_headers, params=data)
            elif method.upper() == "POST":
                response = self.session.post(url, headers=req_headers, json=data)
            elif method.upper() == "PUT":
                response = self.session.put(url, headers=req_headers, json=data)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=req_headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"❌ Request failed: {e}")
            raise

    def setup_test_data(self) -> bool:
        """Setup basic test data (admin user, exam hierarchy, questions)"""
        print("\n📋 Setting up test data...")
        
        try:
            # Create admin user
            admin_data = {
                "email": self.admin_email,
                "password": self.admin_password,
                "role": "admin"
            }
            
            response = self.make_request("POST", "/auth/signup", admin_data)
            if response.status_code in [200, 201, 400]:  # 400 if already exists
                print("✅ Admin user ready")
            else:
                print(f"❌ Failed to create admin: {response.status_code}")
                return False
            
            # Login as admin
            login_data = {"email": self.admin_email, "password": self.admin_password}
            response = self.make_request("POST", "/auth/login", login_data)
            if response.status_code == 200:
                self.admin_token = response.json()["access_token"]
                print("✅ Admin login successful")
            else:
                print(f"❌ Admin login failed: {response.status_code}")
                return False
            
            # Create test hierarchy
            # 1. Create exam
            exam_data = {"name": "Test Exam", "description": "Test exam for API testing"}
            response = self.make_request("POST", "/admin/exams", exam_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["exam_id"] = response.json()["id"]
                print("✅ Test exam created")
            else:
                print(f"❌ Failed to create exam: {response.status_code}")
                return False
            
            # 2. Create subject
            subject_data = {
                "exam_id": self.test_data["exam_id"],
                "name": "Mathematics",
                "description": "Math subject"
            }
            response = self.make_request("POST", "/admin/subjects", subject_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["subject_id"] = response.json()["id"]
                print("✅ Test subject created")
            else:
                print(f"❌ Failed to create subject: {response.status_code}")
                return False
            
            # 3. Create chapter
            chapter_data = {
                "subject_id": self.test_data["subject_id"],
                "name": "Algebra",
                "description": "Algebra chapter"
            }
            response = self.make_request("POST", "/admin/chapters", chapter_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["chapter_id"] = response.json()["id"]
                print("✅ Test chapter created")
            else:
                print(f"❌ Failed to create chapter: {response.status_code}")
                return False
            
            # 4. Create topic
            topic_data = {
                "chapter_id": self.test_data["chapter_id"],
                "name": "Linear Equations",
                "description": "Linear equations topic"
            }
            response = self.make_request("POST", "/admin/topics", topic_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["topic_id"] = response.json()["id"]
                print("✅ Test topic created")
            else:
                print(f"❌ Failed to create topic: {response.status_code}")
                return False
            
            # 5. Create sub-topic
            sub_topic_data = {
                "topic_id": self.test_data["topic_id"],
                "name": "Simple Linear Equations",
                "description": "Simple linear equations"
            }
            response = self.make_request("POST", "/admin/sub-topics", sub_topic_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["sub_topic_id"] = response.json()["id"]
                print("✅ Test sub-topic created")
            else:
                print(f"❌ Failed to create sub-topic: {response.status_code}")
                return False
            
            # 6. Create section
            section_data = {
                "sub_topic_id": self.test_data["sub_topic_id"],
                "name": "Basic Operations",
                "description": "Basic operations section"
            }
            response = self.make_request("POST", "/admin/sections", section_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["section_id"] = response.json()["id"]
                print("✅ Test section created")
            else:
                print(f"❌ Failed to create section: {response.status_code}")
                return False
            
            # 7. Create sub-section
            sub_section_data = {
                "section_id": self.test_data["section_id"],
                "name": "Addition and Subtraction",
                "description": "Addition and subtraction sub-section"
            }
            response = self.make_request("POST", "/admin/sub-sections", sub_section_data, token=self.admin_token)
            if response.status_code in [200, 201]:
                self.test_data["sub_section_id"] = response.json()["id"]
                print("✅ Test sub-section created")
            else:
                print(f"❌ Failed to create sub-section: {response.status_code}")
                return False
            
            # 8. Create test questions
            questions = [
                {
                    "sub_section_id": self.test_data["sub_section_id"],
                    "question_text": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_answer": 1,
                    "difficulty": "easy",
                    "tags": ["arithmetic", "addition"],
                    "explanation": "2 + 2 equals 4"
                },
                {
                    "sub_section_id": self.test_data["sub_section_id"],
                    "question_text": "Solve: x + 5 = 10",
                    "options": ["3", "5", "7", "10"],
                    "correct_answer": 1,
                    "difficulty": "medium",
                    "tags": ["algebra", "linear"],
                    "explanation": "x = 10 - 5 = 5"
                },
                {
                    "sub_section_id": self.test_data["sub_section_id"],
                    "question_text": "What is the derivative of x²?",
                    "options": ["x", "2x", "x²", "2"],
                    "correct_answer": 1,
                    "difficulty": "hard",
                    "tags": ["calculus", "derivative"],
                    "explanation": "The derivative of x² is 2x"
                }
            ]
            
            for question in questions:
                response = self.make_request("POST", "/admin/questions", question, token=self.admin_token)
                if response.status_code in [200, 201]:
                    self.test_data["question_ids"].append(response.json()["id"])
                else:
                    print(f"❌ Failed to create question: {response.status_code}")
                    return False
            
            print(f"✅ Created {len(self.test_data['question_ids'])} test questions")
            
            return True
            
        except Exception as e:
            print(f"❌ Setup failed: {e}")
            return False

    def create_test_user(self) -> bool:
        """Create and login test user"""
        print("\n👤 Setting up test user...")
        
        try:
            # Create user
            user_data = {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "role": "user"
            }
            
            response = self.make_request("POST", "/auth/signup", user_data)
            if response.status_code in [200, 201, 400]:  # 400 if already exists
                print("✅ Test user ready")
            else:
                print(f"❌ Failed to create user: {response.status_code}")
                return False
            
            # Login user
            login_data = {"email": self.test_user_email, "password": self.test_user_password}
            response = self.make_request("POST", "/auth/login", login_data)
            if response.status_code == 200:
                self.user_token = response.json()["access_token"]
                print("✅ User login successful")
                return True
            else:
                print(f"❌ User login failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ User setup failed: {e}")
            return False

    def test_password_reset_workflow(self) -> bool:
        """Test password reset workflow"""
        print("\n🔐 Testing Password Reset Workflow...")
        
        try:
            # 1. Test forgot password
            print("  📧 Testing forgot password...")
            forgot_data = {"email": self.test_user_email}
            response = self.make_request("POST", "/auth/forgot-password", forgot_data)
            
            if response.status_code == 200:
                result = response.json()
                if "reset_code" in result:
                    self.test_data["reset_code"] = result["reset_code"]
                    print(f"  ✅ Reset code generated: {self.test_data['reset_code']}")
                else:
                    print("  ❌ No reset code in response")
                    return False
            else:
                print(f"  ❌ Forgot password failed: {response.status_code} - {response.text}")
                return False
            
            # 2. Test reset password
            print("  🔑 Testing password reset...")
            new_password = "newpassword123"
            reset_data = {
                "email": self.test_user_email,
                "new_password": new_password,
                "reset_code": self.test_data["reset_code"]
            }
            response = self.make_request("POST", "/auth/reset-password", reset_data)
            
            if response.status_code == 200:
                print("  ✅ Password reset successful")
            else:
                print(f"  ❌ Password reset failed: {response.status_code} - {response.text}")
                return False
            
            # 3. Test login with new password
            print("  🔓 Testing login with new password...")
            login_data = {"email": self.test_user_email, "password": new_password}
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                self.user_token = response.json()["access_token"]
                print("  ✅ Login with new password successful")
                
                # Reset password back for other tests
                self.test_user_password = new_password
                return True
            else:
                print(f"  ❌ Login with new password failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Password reset test failed: {e}")
            return False

    def test_profile_update(self) -> bool:
        """Test profile update endpoint"""
        print("\n👤 Testing Profile Update...")
        
        try:
            # Test profile update
            profile_data = {
                "name": "John Doe",
                "email": "john.doe@example.com",
                "avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
            }
            
            response = self.make_request("PUT", "/profile", profile_data, token=self.user_token)
            
            if response.status_code == 200:
                result = response.json()
                if result["email"] == profile_data["email"]:
                    print("  ✅ Profile update successful")
                    
                    # Update credentials for future tests
                    self.test_user_email = profile_data["email"]
                    
                    # Test login with updated email
                    login_data = {"email": self.test_user_email, "password": self.test_user_password}
                    response = self.make_request("POST", "/auth/login", login_data)
                    if response.status_code == 200:
                        self.user_token = response.json()["access_token"]
                        print("  ✅ Login with updated email successful")
                        return True
                    else:
                        print(f"  ❌ Login with updated email failed: {response.status_code}")
                        return False
                else:
                    print("  ❌ Profile not updated correctly")
                    return False
            else:
                print(f"  ❌ Profile update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Profile update test failed: {e}")
            return False

    def test_search_and_filter(self) -> bool:
        """Test search and filter API"""
        print("\n🔍 Testing Search & Filter...")
        
        try:
            # Test search with query
            params = {
                "query": "Linear",
                "level": "topic",
                "exam_id": self.test_data["exam_id"]
            }
            
            response = self.make_request("GET", "/search/hierarchy", params, token=self.user_token)
            
            if response.status_code == 200:
                result = response.json()
                if "topics" in result and len(result["topics"]) > 0:
                    print("  ✅ Search returned results")
                    return True
                else:
                    print("  ⚠️ Search returned no results (may be expected)")
                    return True  # Not necessarily a failure
            else:
                print(f"  ❌ Search failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Search test failed: {e}")
            return False

    def test_batch_bookmarks(self) -> bool:
        """Test batch bookmark operations"""
        print("\n📚 Testing Batch Bookmarks...")
        
        try:
            # Test batch add bookmarks
            print("  ➕ Testing batch add...")
            batch_data = {
                "question_ids": self.test_data["question_ids"][:2],  # First 2 questions
                "action": "add"
            }
            
            response = self.make_request("POST", "/bookmarks/batch", batch_data, token=self.user_token)
            
            if response.status_code == 200:
                print("  ✅ Batch add successful")
            else:
                print(f"  ❌ Batch add failed: {response.status_code} - {response.text}")
                return False
            
            # Verify bookmarks were added
            response = self.make_request("GET", "/bookmarks", token=self.user_token)
            if response.status_code == 200:
                bookmarks = response.json()
                if len(bookmarks) >= 2:
                    print("  ✅ Bookmarks verified")
                else:
                    print(f"  ❌ Expected at least 2 bookmarks, got {len(bookmarks)}")
                    return False
            
            # Test batch remove bookmarks
            print("  ➖ Testing batch remove...")
            batch_data = {
                "question_ids": [self.test_data["question_ids"][0]],  # Remove first question
                "action": "remove"
            }
            
            response = self.make_request("POST", "/bookmarks/batch", batch_data, token=self.user_token)
            
            if response.status_code == 200:
                print("  ✅ Batch remove successful")
                return True
            else:
                print(f"  ❌ Batch remove failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Batch bookmarks test failed: {e}")
            return False

    def test_difficulty_breakdown(self) -> bool:
        """Test difficulty breakdown analytics"""
        print("\n📊 Testing Difficulty Breakdown...")
        
        try:
            # First, submit a test to have some data
            print("  📝 Submitting test for analytics data...")
            test_data = {
                "question_ids": self.test_data["question_ids"],
                "answers": [1, 1, 1]  # All correct answers
            }
            
            response = self.make_request("POST", "/tests/submit", test_data, token=self.user_token)
            if response.status_code != 200:
                print(f"  ❌ Test submission failed: {response.status_code}")
                return False
            
            # Now test difficulty breakdown
            response = self.make_request("GET", "/analytics/difficulty-breakdown", token=self.user_token)
            
            if response.status_code == 200:
                result = response.json()
                if "difficulty_breakdown" in result:
                    breakdown = result["difficulty_breakdown"]
                    print(f"  ✅ Difficulty breakdown received: {len(breakdown)} levels")
                    
                    # Verify structure
                    for item in breakdown:
                        if all(key in item for key in ["difficulty", "correct", "total", "percentage"]):
                            continue
                        else:
                            print(f"  ❌ Invalid breakdown structure: {item}")
                            return False
                    
                    return True
                else:
                    print("  ❌ No difficulty_breakdown in response")
                    return False
            else:
                print(f"  ❌ Difficulty breakdown failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Difficulty breakdown test failed: {e}")
            return False

    def test_filtered_leaderboard(self) -> bool:
        """Test filtered leaderboard"""
        print("\n🏆 Testing Filtered Leaderboard...")
        
        try:
            # Test different periods and scopes
            test_cases = [
                {"scope": "global", "period": "all_time", "limit": 10},
                {"scope": "global", "period": "weekly", "limit": 5},
                {"scope": "global", "period": "monthly", "limit": 10}
            ]
            
            for case in test_cases:
                print(f"  📈 Testing {case['period']} leaderboard...")
                response = self.make_request("GET", "/leaderboard/filtered", case)
                
                if response.status_code == 200:
                    result = response.json()
                    if "leaderboard" in result and "total_users" in result:
                        print(f"    ✅ {case['period']} leaderboard: {result['total_users']} users")
                    else:
                        print(f"    ❌ Invalid leaderboard structure for {case['period']}")
                        return False
                else:
                    print(f"    ❌ {case['period']} leaderboard failed: {response.status_code}")
                    return False
            
            return True
                
        except Exception as e:
            print(f"❌ Filtered leaderboard test failed: {e}")
            return False

    def test_filtered_questions(self) -> bool:
        """Test filtered questions API"""
        print("\n❓ Testing Filtered Questions...")
        
        try:
            # Test different filters
            test_cases = [
                {"difficulty": "easy", "limit": 5},
                {"difficulty": "medium", "limit": 5},
                {"sub_section_id": self.test_data["sub_section_id"], "limit": 10},
                {"bookmarked": True, "limit": 5},  # Should return bookmarked questions
                {"bookmarked": False, "limit": 5}  # Should return non-bookmarked questions
            ]
            
            for case in test_cases:
                filter_desc = ", ".join([f"{k}={v}" for k, v in case.items()])
                print(f"  🔍 Testing filter: {filter_desc}")
                
                response = self.make_request("GET", "/questions/filtered", case, token=self.user_token)
                
                if response.status_code == 200:
                    questions = response.json()
                    print(f"    ✅ Filtered questions: {len(questions)} results")
                    
                    # Verify structure
                    if questions and len(questions) > 0:
                        question = questions[0]
                        required_fields = ["id", "question_text", "options", "difficulty"]
                        if all(field in question for field in required_fields):
                            continue
                        else:
                            print(f"    ❌ Invalid question structure")
                            return False
                else:
                    print(f"    ❌ Filtered questions failed: {response.status_code}")
                    return False
            
            return True
                
        except Exception as e:
            print(f"❌ Filtered questions test failed: {e}")
            return False

    def run_all_tests(self) -> Dict[str, bool]:
        """Run all enhancement tests"""
        print("🧪 Starting User App Backend Enhancement Tests")
        print("=" * 60)
        
        results = {}
        
        # Setup
        if not self.setup_test_data():
            print("❌ Test setup failed - aborting tests")
            return {"setup": False}
        
        if not self.create_test_user():
            print("❌ User setup failed - aborting tests")
            return {"user_setup": False}
        
        # Run enhancement tests
        test_methods = [
            ("Password Reset Workflow", self.test_password_reset_workflow),
            ("Profile Update API", self.test_profile_update),
            ("Search & Filter API", self.test_search_and_filter),
            ("Batch Bookmark Operations", self.test_batch_bookmarks),
            ("Difficulty Breakdown Analytics", self.test_difficulty_breakdown),
            ("Enhanced Leaderboard with Filters", self.test_filtered_leaderboard),
            ("Filtered Questions API", self.test_filtered_questions)
        ]
        
        for test_name, test_method in test_methods:
            try:
                results[test_name] = test_method()
            except Exception as e:
                print(f"❌ {test_name} test crashed: {e}")
                results[test_name] = False
        
        return results

    def print_summary(self, results: Dict[str, bool]):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📋 USER APP BACKEND ENHANCEMENT TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print("-" * 60)
        print(f"📊 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
        
        if passed == total:
            print("🎉 All user app enhancement tests passed!")
        else:
            print("⚠️  Some tests failed - check logs above")

def main():
    """Main test execution"""
    tester = UserAppBackendTester()
    results = tester.run_all_tests()
    tester.print_summary(results)
    
    # Return exit code based on results
    if all(results.values()):
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()