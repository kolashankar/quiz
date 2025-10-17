#!/usr/bin/env python3
"""
Admin Endpoints Test Suite for Quiz App
Tests specific admin endpoints as requested in the review
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8001/api"
ADMIN_TOKEN = None

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
    """Setup admin authentication using the specified credentials"""
    global ADMIN_TOKEN
    
    print_header("Setting up Admin Authentication")
    
    # Use the specific admin credentials from the review request
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
                print_info(f"Token: {ADMIN_TOKEN[:20]}...")
                return True
            else:
                print_error("No access token in login response")
                print_info(f"Response: {data}")
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

def test_authentication():
    """Test authentication endpoint"""
    print_header("Testing Authentication")
    
    # Test login with admin credentials
    login_data = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print_success("POST /api/auth/login - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Validate response structure
            required_fields = ["access_token", "token_type", "user"]
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                print_warning(f"Missing fields in response: {missing_fields}")
            else:
                print_success("Response contains all required fields")
                
            # Check user object structure
            if "user" in data:
                user = data["user"]
                user_fields = ["id", "email", "role"]
                missing_user_fields = [field for field in user_fields if field not in user]
                if missing_user_fields:
                    print_warning(f"Missing user fields: {missing_user_fields}")
                else:
                    print_success("User object contains all required fields")
                    print_info(f"User role: {user.get('role')}")
            
            return True
        else:
            print_error(f"POST /api/auth/login - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Authentication test error: {e}")
        return False

def test_dashboard_analytics():
    """Test dashboard analytics endpoint"""
    print_header("Testing Dashboard Analytics")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/analytics/dashboard", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/analytics/dashboard - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Check for expected fields
            if "overview" in data:
                overview = data["overview"]
                expected_counts = ["totalUsers", "totalExams", "totalSubjects", "totalQuestions", "totalTests"]
                for count_field in expected_counts:
                    if count_field in overview:
                        print_success(f"  {count_field}: {overview[count_field]}")
                    else:
                        print_warning(f"  Missing field: {count_field}")
            else:
                print_warning("No 'overview' field in response")
                
            return True
        else:
            print_error(f"GET /api/admin/analytics/dashboard - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Dashboard analytics test error: {e}")
        return False

def test_admin_questions():
    """Test admin questions endpoint"""
    print_header("Testing Admin Questions")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/questions", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/questions - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Check pagination structure
            expected_fields = ["data", "total", "page", "limit"]
            for field in expected_fields:
                if field in data:
                    print_success(f"  {field}: {data[field] if field != 'data' else f'{len(data[field])} items'}")
                else:
                    print_warning(f"  Missing field: {field}")
                    
            return True
        else:
            print_error(f"GET /api/admin/questions - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Admin questions test error: {e}")
        return False

def test_questions_analytics():
    """Test questions analytics endpoints"""
    print_header("Testing Questions Analytics")
    
    # Test distribution analytics
    try:
        response = requests.get(f"{BASE_URL}/admin/questions/analytics/distribution", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/questions/analytics/distribution - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Check expected analytics fields
            expected_fields = ["by_difficulty", "by_subject", "by_exam"]
            for field in expected_fields:
                if field in data:
                    print_success(f"  {field}: {len(data[field])} items")
                else:
                    print_warning(f"  Missing field: {field}")
        else:
            print_error(f"GET /api/admin/questions/analytics/distribution - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Questions distribution analytics test error: {e}")
        return False
    
    # Test quality analytics
    try:
        response = requests.get(f"{BASE_URL}/admin/questions/analytics/quality", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/questions/analytics/quality - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Check expected quality metrics
            expected_fields = ["total_questions", "with_explanation", "with_formula", "with_image", "high_confidence"]
            for field in expected_fields:
                if field in data:
                    print_success(f"  {field}: {data[field]}")
                else:
                    print_warning(f"  Missing field: {field}")
        else:
            print_error(f"GET /api/admin/questions/analytics/quality - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Questions quality analytics test error: {e}")
        return False
    
    return True

def test_admin_content():
    """Test admin content endpoints"""
    print_header("Testing Admin Content Routes")
    
    # Test admin exams
    try:
        response = requests.get(f"{BASE_URL}/admin/exams", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/exams - SUCCESS")
            print_info(f"Found {len(data)} exams")
            
            # Check structure of first exam if exists
            if data and len(data) > 0:
                exam = data[0]
                expected_fields = ["id", "name", "description", "created_at"]
                for field in expected_fields:
                    if field in exam:
                        print_success(f"  Exam has {field}")
                    else:
                        print_warning(f"  Exam missing {field}")
        else:
            print_error(f"GET /api/admin/exams - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Admin exams test error: {e}")
        return False
    
    # Test admin subjects
    try:
        response = requests.get(f"{BASE_URL}/admin/subjects", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/subjects - SUCCESS")
            print_info(f"Found {len(data)} subjects")
            
            # Check structure of first subject if exists
            if data and len(data) > 0:
                subject = data[0]
                expected_fields = ["id", "exam_id", "name", "description", "created_at"]
                for field in expected_fields:
                    if field in subject:
                        print_success(f"  Subject has {field}")
                    else:
                        print_warning(f"  Subject missing {field}")
        else:
            print_error(f"GET /api/admin/subjects - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"Admin subjects test error: {e}")
        return False
    
    return True

def test_ai_tools():
    """Test AI tools endpoint"""
    print_header("Testing AI Tools")
    
    try:
        response = requests.get(f"{BASE_URL}/admin/analytics/advanced", headers=get_admin_headers())
        
        if response.status_code == 200:
            data = response.json()
            print_success("GET /api/admin/analytics/advanced - SUCCESS")
            print_info(f"Response structure: {list(data.keys())}")
            
            # Check expected analytics sections
            expected_sections = ["engagement", "difficulty_analysis", "time_trends"]
            for section in expected_sections:
                if section in data:
                    print_success(f"  {section}: Available")
                    if section == "engagement" and "active_users" in data[section]:
                        print_info(f"    Active users: {data[section]['active_users']}")
                else:
                    print_warning(f"  Missing section: {section}")
        else:
            print_error(f"GET /api/admin/analytics/advanced - FAILED: {response.status_code}")
            print_error(f"Response: {response.text}")
            return False
    except Exception as e:
        print_error(f"AI tools test error: {e}")
        return False
    
    return True

def test_authentication_required():
    """Test that admin routes require authentication"""
    print_header("Testing Authentication Requirements")
    
    endpoints_to_test = [
        "/admin/analytics/dashboard",
        "/admin/questions",
        "/admin/questions/analytics/distribution",
        "/admin/questions/analytics/quality",
        "/admin/exams",
        "/admin/subjects",
        "/admin/analytics/advanced"
    ]
    
    all_protected = True
    
    for endpoint in endpoints_to_test:
        try:
            # Test without token
            response = requests.get(f"{BASE_URL}{endpoint}")
            
            if response.status_code in [401, 403]:
                print_success(f"  {endpoint} - Properly protected")
            else:
                print_error(f"  {endpoint} - NOT protected (status: {response.status_code})")
                all_protected = False
        except Exception as e:
            print_error(f"  {endpoint} - Test error: {e}")
            all_protected = False
    
    return all_protected

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

def main():
    """Main test execution"""
    print_header("Admin Endpoints Test Suite")
    print_info(f"Testing backend at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now()}")
    
    # Check backend health
    if not check_backend_health():
        print_error("Backend is not accessible. Please ensure it's running on localhost:8001")
        sys.exit(1)
    
    # Setup authentication
    if not setup_admin_auth():
        print_error("Failed to setup admin authentication. Cannot proceed with admin tests.")
        sys.exit(1)
    
    # Run all tests
    test_results = []
    
    tests = [
        ("Authentication", test_authentication),
        ("Dashboard Analytics", test_dashboard_analytics),
        ("Admin Questions", test_admin_questions),
        ("Questions Analytics", test_questions_analytics),
        ("Admin Content Routes", test_admin_content),
        ("AI Tools", test_ai_tools),
        ("Authentication Requirements", test_authentication_required)
    ]
    
    for test_name, test_func in tests:
        try:
            print_info(f"\nRunning test: {test_name}")
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
        print_success("All tests passed! Admin endpoints are working correctly.")
    else:
        print_error(f"{total - passed} tests failed. Please check the issues above.")
    
    print_info(f"Test completed at: {datetime.now()}")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)