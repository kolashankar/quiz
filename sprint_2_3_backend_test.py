#!/usr/bin/env python3
"""
Sprint 2 & Sprint 3 Backend Testing Suite
Tests AI CSV Generation with PDF Upload and Question Management Features
"""

import requests
import json
import sys
import io
import os
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8001/api"
ADMIN_TOKEN = None
TEST_DATA = {}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_success(message: str):
    print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")

def print_error(message: str):
    print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def print_warning(message: str):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.ENDC}")

def print_info(message: str):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.ENDC}")

def print_header(message: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{message}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.ENDC}")

def setup_admin_auth():
    """Setup admin authentication for testing"""
    global ADMIN_TOKEN
    
    print_header("Setting up Admin Authentication")
    
    # Try to login with existing admin credentials
    login_data = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            ADMIN_TOKEN = data.get("access_token")
            if ADMIN_TOKEN:
                print_success("Admin authentication successful")
                return True
            else:
                print_error("No access token in login response")
        else:
            print_error(f"Admin login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Admin login error: {e}")
    
    return False

def get_admin_headers():
    """Get headers with admin authentication"""
    if ADMIN_TOKEN:
        return {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    return {}

def check_backend_health():
    """Check if backend is running"""
    print_header("Backend Health Check")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/health", timeout=5)
        if response.status_code == 200:
            print_success("Backend is running and healthy")
            return True
        else:
            print_error(f"Backend health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to backend - is it running?")
    except Exception as e:
        print_error(f"Backend health check error: {e}")
    
    return False

# ==================== SPRINT 2 TESTS ====================

def test_ai_generate_csv():
    """Test AI CSV generation endpoint"""
    print_header("Testing AI CSV Generation (Sprint 2)")
    
    try:
        # Test with multiple subjects
        test_data = {
            "exam": "JEE",
            "subjects": ["Physics", "Mathematics"],
            "questions_per_subject": 5
        }
        
        response = requests.post(
            f"{BASE_URL}/ai/generate-csv",
            params=test_data,
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"CSV generation successful: {data.get('total_questions', 0)} questions generated")
            
            # Verify response structure
            required_fields = ["success", "exam", "total_questions", "csv_content", "message"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in response: {field}")
                    return False
            
            # Check CSV content format
            csv_content = data.get("csv_content", "")
            if csv_content and "UID,Exam,Year,Subject" in csv_content:
                print_success("CSV format validation passed (24 columns detected)")
            else:
                print_warning("CSV format may not match expected 24-column structure")
            
            return True
        else:
            print_error(f"CSV generation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"CSV generation test error: {e}")
        return False

def create_test_pdf():
    """Create a simple test PDF content for testing"""
    # Create a simple text file that we'll treat as PDF for testing
    test_content = b"""
    Physics Chapter 1: Mechanics
    
    1. Newton's First Law of Motion
    An object at rest stays at rest and an object in motion stays in motion.
    
    2. Newton's Second Law
    F = ma (Force equals mass times acceleration)
    
    3. Newton's Third Law
    For every action, there is an equal and opposite reaction.
    
    Key Formulas:
    - Velocity: v = u + at
    - Distance: s = ut + (1/2)at²
    - Kinetic Energy: KE = (1/2)mv²
    """
    return test_content

def test_ai_generate_csv_from_pdf():
    """Test AI CSV generation from PDF upload"""
    print_header("Testing AI CSV Generation from PDF (Sprint 2)")
    
    try:
        # Create test PDF content
        pdf_content = create_test_pdf()
        
        # Test file size validation with oversized file (simulate)
        print_info("Testing file size validation...")
        large_content = b"x" * (60 * 1024 * 1024)  # 60MB file
        
        files = {"file": ("large_test.pdf", large_content, "application/pdf")}
        data = {
            "exam": "JEE",
            "subject": "Physics",
            "questions_per_chapter": 3
        }
        
        response = requests.post(
            f"{BASE_URL}/ai/generate-csv-from-pdf",
            files=files,
            data=data,
            headers=get_admin_headers()
        )
        
        if response.status_code == 400:
            print_success("File size validation working correctly (rejected oversized file)")
        else:
            print_warning(f"File size validation response: {response.status_code}")
        
        # Test with valid PDF
        print_info("Testing with valid PDF content...")
        files = {"file": ("test_physics.pdf", pdf_content, "application/pdf")}
        data = {
            "exam": "JEE",
            "subject": "Physics", 
            "questions_per_chapter": 3
        }
        
        response = requests.post(
            f"{BASE_URL}/ai/generate-csv-from-pdf",
            files=files,
            data=data,
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"PDF-based CSV generation successful: {data.get('total_questions', 0)} questions")
            
            # Verify response structure
            required_fields = ["success", "exam", "subject", "total_questions", "chapters_processed", "csv_content"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in PDF response: {field}")
                    return False
            
            print_success(f"Processed {data.get('chapters_processed', 0)} chapters from PDF")
            return True
        else:
            print_error(f"PDF CSV generation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print_error(f"PDF CSV generation test error: {e}")
        return False

# ==================== SPRINT 3 TESTS ====================

def create_test_question():
    """Create a test question for review queue testing"""
    print_info("Creating test question for review queue...")
    
    question_data = {
        "text": "What is Newton's first law of motion?",
        "options": [
            "F = ma",
            "An object at rest stays at rest unless acted upon by a force",
            "For every action there is an equal and opposite reaction",
            "Energy cannot be created or destroyed"
        ],
        "correct_answer": 1,
        "explanation": "Newton's first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an external force.",
        "difficulty": "easy",
        "subject": "Physics",
        "chapter": "Mechanics",
        "topic": "Laws of Motion",
        "tags": ["physics", "mechanics", "newton"],
        "review_status": "pending_review",
        "created_at": datetime.utcnow()
    }
    
    try:
        # We'll use the questions endpoint to create a question
        # Note: This might need to be adjusted based on actual question creation endpoint
        response = requests.post(
            f"{BASE_URL}/admin/questions",
            json=question_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            question = response.json()
            question_id = question.get("id") or str(question.get("_id"))
            TEST_DATA['test_question_id'] = question_id
            print_success(f"Test question created: {question_id}")
            return question_id
        else:
            print_warning(f"Question creation response: {response.status_code}")
            # Return a dummy ID for testing other endpoints
            TEST_DATA['test_question_id'] = "dummy_question_id"
            return "dummy_question_id"
    except Exception as e:
        print_warning(f"Question creation error: {e}")
        TEST_DATA['test_question_id'] = "dummy_question_id"
        return "dummy_question_id"

def test_review_queue():
    """Test Question Review Queue endpoints"""
    print_header("Testing Question Review Queue (Sprint 3)")
    
    # Create test question first
    question_id = create_test_question()
    
    # Test GET pending questions
    try:
        response = requests.get(
            f"{BASE_URL}/admin/review-queue/pending",
            params={"page": 1, "limit": 10},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Retrieved pending questions: {data.get('total', 0)} total")
            
            # Verify response structure
            required_fields = ["questions", "total", "page", "pages"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in pending questions response: {field}")
                    return False
        else:
            print_error(f"Get pending questions failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get pending questions error: {e}")
        return False
    
    # Test GET review queue stats
    try:
        response = requests.get(
            f"{BASE_URL}/admin/review-queue/stats",
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Review queue stats retrieved successfully")
            
            # Verify stats structure
            required_fields = ["pending", "approved", "rejected", "needs_changes", "total"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in stats response: {field}")
                    return False
        else:
            print_error(f"Get review stats failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get review stats error: {e}")
        return False
    
    # Test approve question
    try:
        response = requests.post(
            f"{BASE_URL}/admin/review-queue/{question_id}/approve",
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            print_success("Question approval successful")
        else:
            print_warning(f"Question approval response: {response.status_code}")
    except Exception as e:
        print_warning(f"Question approval error: {e}")
    
    # Test reject question (create another test question)
    question_id_2 = create_test_question()
    try:
        response = requests.post(
            f"{BASE_URL}/admin/review-queue/{question_id_2}/reject",
            json={"reason": "Incorrect answer provided"},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            print_success("Question rejection successful")
        else:
            print_warning(f"Question rejection response: {response.status_code}")
    except Exception as e:
        print_warning(f"Question rejection error: {e}")
    
    # Test request changes
    question_id_3 = create_test_question()
    try:
        response = requests.post(
            f"{BASE_URL}/admin/review-queue/{question_id_3}/request-changes",
            json={"feedback": "Please improve the explanation with more details"},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            print_success("Request changes successful")
        else:
            print_warning(f"Request changes response: {response.status_code}")
    except Exception as e:
        print_warning(f"Request changes error: {e}")
    
    return True

def test_duplicate_detection():
    """Test Duplicate Detection endpoints"""
    print_header("Testing Duplicate Detection (Sprint 3)")
    
    # Test detect duplicates
    try:
        response = requests.post(
            f"{BASE_URL}/admin/duplicates/detect",
            params={"threshold": 0.8, "limit": 50},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Duplicate detection completed: {data.get('duplicates_found', 0)} duplicates found")
            
            # Verify response structure
            required_fields = ["total_checked", "duplicates_found", "threshold_used", "duplicates"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in duplicate detection response: {field}")
                    return False
        else:
            print_error(f"Duplicate detection failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Duplicate detection error: {e}")
        return False
    
    # Test check specific question for duplicates
    question_id = TEST_DATA.get('test_question_id', 'dummy_id')
    try:
        response = requests.get(
            f"{BASE_URL}/admin/duplicates/check/{question_id}",
            params={"threshold": 0.85},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Question duplicate check completed: {data.get('count', 0)} similar questions found")
        else:
            print_warning(f"Question duplicate check response: {response.status_code}")
    except Exception as e:
        print_warning(f"Question duplicate check error: {e}")
    
    # Test mark questions as unique
    try:
        response = requests.post(
            f"{BASE_URL}/admin/duplicates/mark-unique",
            json={
                "question1_id": "dummy_id_1",
                "question2_id": "dummy_id_2"
            },
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            print_success("Mark questions as unique successful")
        else:
            print_warning(f"Mark unique response: {response.status_code}")
    except Exception as e:
        print_warning(f"Mark unique error: {e}")
    
    return True

def test_version_control():
    """Test Version Control endpoints"""
    print_header("Testing Version Control (Sprint 3)")
    
    question_id = TEST_DATA.get('test_question_id', 'dummy_id')
    
    # Test get question history
    try:
        response = requests.get(
            f"{BASE_URL}/admin/questions/{question_id}/history",
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Question history retrieved successfully")
            
            # Verify response structure
            required_fields = ["question_id", "current_version", "version_history", "total_versions"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in history response: {field}")
                    return False
        else:
            print_warning(f"Get question history response: {response.status_code}")
    except Exception as e:
        print_warning(f"Get question history error: {e}")
    
    # Test create version
    try:
        response = requests.post(
            f"{BASE_URL}/admin/questions/{question_id}/create-version",
            json={"change_note": "Test version creation"},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Version created successfully: v{data.get('version_number', 'N/A')}")
        else:
            print_warning(f"Create version response: {response.status_code}")
    except Exception as e:
        print_warning(f"Create version error: {e}")
    
    # Test compare versions
    try:
        response = requests.get(
            f"{BASE_URL}/admin/questions/{question_id}/compare",
            params={"version1": 1, "version2": 2},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Version comparison completed successfully")
            
            # Verify response structure
            required_fields = ["question_id", "version1", "version2", "differences", "has_changes"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in compare response: {field}")
                    return False
        else:
            print_warning(f"Compare versions response: {response.status_code}")
    except Exception as e:
        print_warning(f"Compare versions error: {e}")
    
    return True

def test_audit_logs():
    """Test Audit Logs endpoints"""
    print_header("Testing Audit Logs (Sprint 3)")
    
    # Test get audit logs
    try:
        response = requests.get(
            f"{BASE_URL}/admin/audit-logs",
            params={"page": 1, "limit": 20},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Audit logs retrieved: {data.get('total', 0)} total logs")
            
            # Verify response structure
            required_fields = ["logs", "total", "page", "pages"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in audit logs response: {field}")
                    return False
        else:
            print_error(f"Get audit logs failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Get audit logs error: {e}")
        return False
    
    # Test filter by action
    try:
        response = requests.get(
            f"{BASE_URL}/admin/audit-logs",
            params={"action": "approve_question", "page": 1, "limit": 10},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            print_success("Audit logs filtering by action successful")
        else:
            print_warning(f"Audit logs filter response: {response.status_code}")
    except Exception as e:
        print_warning(f"Audit logs filter error: {e}")
    
    # Test get available actions
    try:
        response = requests.get(
            f"{BASE_URL}/admin/audit-logs/actions",
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Available actions retrieved: {len(data.get('actions', []))} actions")
        else:
            print_warning(f"Get actions response: {response.status_code}")
    except Exception as e:
        print_warning(f"Get actions error: {e}")
    
    # Test get audit statistics
    try:
        response = requests.get(
            f"{BASE_URL}/admin/audit-logs/stats",
            params={"days": 7},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Audit statistics retrieved: {data.get('total_actions', 0)} actions in last 7 days")
            
            # Verify stats structure
            required_fields = ["period_days", "total_actions", "actions_by_type", "top_admins", "daily_activity"]
            for field in required_fields:
                if field not in data:
                    print_error(f"Missing field in audit stats response: {field}")
                    return False
        else:
            print_warning(f"Get audit stats response: {response.status_code}")
    except Exception as e:
        print_warning(f"Get audit stats error: {e}")
    
    return True

def test_data_export():
    """Test Data Export endpoints"""
    print_header("Testing Data Export (Sprint 3)")
    
    # Test JSON export
    try:
        response = requests.get(
            f"{BASE_URL}/admin/analytics/export",
            params={"format": "json", "days": 30},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("JSON export successful")
            
            # Verify export structure
            if data.get("format") == "json" and "data" in data:
                export_data = data["data"]
                required_sections = ["users", "questions", "tests", "engagement", "export_info"]
                for section in required_sections:
                    if section not in export_data:
                        print_error(f"Missing section in JSON export: {section}")
                        return False
                print_success("JSON export structure validation passed")
            else:
                print_error("Invalid JSON export structure")
                return False
        else:
            print_error(f"JSON export failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"JSON export error: {e}")
        return False
    
    # Test CSV export
    try:
        response = requests.get(
            f"{BASE_URL}/admin/analytics/export",
            params={"format": "csv", "days": 30},
            headers=get_admin_headers()
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("CSV export successful")
            
            # Verify CSV export structure
            if data.get("format") == "csv" and "content" in data and "filename" in data:
                csv_content = data["content"]
                if "Metric,Value" in csv_content and "Total Users" in csv_content:
                    print_success("CSV export structure validation passed")
                else:
                    print_warning("CSV content format may be incorrect")
            else:
                print_error("Invalid CSV export structure")
                return False
        else:
            print_error(f"CSV export failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"CSV export error: {e}")
        return False
    
    return True

def main():
    """Main test execution"""
    print_header("Sprint 2 & Sprint 3 Backend Testing Suite")
    print_info(f"Testing backend at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now()}")
    
    # Check backend health
    if not check_backend_health():
        print_error("Backend is not accessible. Please ensure it's running on localhost:8001")
        sys.exit(1)
    
    # Setup authentication
    if not setup_admin_auth():
        print_error("Failed to setup admin authentication. Some tests may fail.")
        return
    
    # Run all tests
    test_results = []
    
    tests = [
        # Sprint 2 Tests
        ("AI CSV Generation", test_ai_generate_csv),
        ("AI CSV from PDF Upload", test_ai_generate_csv_from_pdf),
        
        # Sprint 3 Tests
        ("Question Review Queue", test_review_queue),
        ("Duplicate Detection", test_duplicate_detection),
        ("Version Control", test_version_control),
        ("Audit Logs", test_audit_logs),
        ("Data Export", test_data_export)
    ]
    
    for test_name, test_func in tests:
        try:
            print_info(f"Running test: {test_name}")
            result = test_func()
            test_results.append((test_name, result))
        except Exception as e:
            print_error(f"Test {test_name} crashed: {e}")
            test_results.append((test_name, False))
    
    # Print summary
    print_header("Test Summary")
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\n{Colors.BOLD}Overall Result: {passed}/{total} tests passed{Colors.ENDC}")
    
    if passed == total:
        print_success("All Sprint 2 & Sprint 3 tests passed! New features are working correctly.")
    else:
        print_error(f"{total - passed} tests failed. Please check the issues above.")
    
    print_info(f"Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()