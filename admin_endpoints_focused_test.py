#!/usr/bin/env python3
"""
Focused Backend Test for Admin Dashboard Endpoints
Tests specific endpoints requested in the review
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration - Using web app's backend URL
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

def test_authentication():
    """Test authentication endpoints as specified in review request"""
    global ADMIN_TOKEN
    
    print_header("1. Authentication Test")
    
    # Credentials from review request
    admin_credentials = {
        "email": "admin@test.com",
        "password": "admin123"
    }
    
    # First try to login
    print_info("Attempting login with admin@test.com...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_credentials)
        
        if response.status_code == 200:
            data = response.json()
            ADMIN_TOKEN = data.get("access_token")
            if ADMIN_TOKEN:
                print_success("✅ Login successful - Admin user exists")
                print_info(f"Token received: {ADMIN_TOKEN[:20]}...")
                return True
            else:
                print_error("No access token in login response")
        elif response.status_code == 401:
            print_info("Admin user doesn't exist or wrong credentials, attempting signup...")
        else:
            print_warning(f"Login failed with status: {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Login request failed: {e}")
    
    # If login failed, try to create admin user
    print_info("Creating admin user...")
    admin_signup_data = {
        "email": "admin@test.com",
        "password": "admin123",
        "name": "Admin User",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=admin_signup_data)
        
        if response.status_code in [200, 201]:
            print_success("✅ Admin user created successfully")
        elif response.status_code == 400:
            print_info("Admin user already exists")
        else:
            print_warning(f"Signup failed with status: {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Signup request failed: {e}")
    
    # Try login again after signup
    print_info("Attempting login after signup...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_credentials)
        
        if response.status_code == 200:
            data = response.json()
            ADMIN_TOKEN = data.get("access_token")
            if ADMIN_TOKEN:
                print_success("✅ Login successful after signup")
                print_info(f"Token received: {ADMIN_TOKEN[:20]}...")
                return True
            else:
                print_error("No access token in login response")
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Login request failed: {e}")
    
    return False

def get_admin_headers():
    """Get headers with admin authentication"""
    if ADMIN_TOKEN:
        return {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    return {}

def test_admin_dashboard_analytics():
    """Test admin dashboard analytics endpoint"""
    print_header("2. Admin Dashboard Analytics")
    
    if not ADMIN_TOKEN:
        print_error("No admin token available")
        return False
    
    try:
        response = requests.get(f"{BASE_URL}/admin/analytics/dashboard", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Dashboard analytics endpoint working")
            print_info(f"Response structure: {json.dumps(data, indent=2)}")
            return True
        elif response.status_code == 401:
            print_error("❌ Unauthorized - Token may be invalid")
        elif response.status_code == 403:
            print_error("❌ Forbidden - User may not have admin privileges")
        else:
            print_error(f"❌ Request failed: {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Request failed: {e}")
    
    return False

def test_admin_question_routes():
    """Test admin question routes"""
    print_header("3. Admin Question Routes")
    
    if not ADMIN_TOKEN:
        print_error("No admin token available")
        return False
    
    results = []
    
    # Test GET /api/admin/questions (with pagination)
    print_info("Testing GET /api/admin/questions...")
    try:
        response = requests.get(f"{BASE_URL}/admin/questions?page=1&limit=10", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Admin questions endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)[:200]}...")
            results.append(True)
        else:
            print_error(f"❌ Admin questions failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            results.append(False)
    except Exception as e:
        print_error(f"Admin questions request failed: {e}")
        results.append(False)
    
    # Test GET /api/admin/questions/analytics/distribution
    print_info("Testing GET /api/admin/questions/analytics/distribution...")
    try:
        response = requests.get(f"{BASE_URL}/admin/questions/analytics/distribution", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Questions analytics distribution endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            results.append(True)
        else:
            print_error(f"❌ Questions analytics distribution failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            results.append(False)
    except Exception as e:
        print_error(f"Questions analytics distribution request failed: {e}")
        results.append(False)
    
    # Test GET /api/admin/questions/analytics/quality
    print_info("Testing GET /api/admin/questions/analytics/quality...")
    try:
        response = requests.get(f"{BASE_URL}/admin/questions/analytics/quality", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Questions analytics quality endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            results.append(True)
        else:
            print_error(f"❌ Questions analytics quality failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            results.append(False)
    except Exception as e:
        print_error(f"Questions analytics quality request failed: {e}")
        results.append(False)
    
    return all(results)

def test_admin_content_routes():
    """Test admin content routes"""
    print_header("4. Admin Content Routes")
    
    if not ADMIN_TOKEN:
        print_error("No admin token available")
        return False
    
    results = []
    
    # Test GET /api/admin/exams
    print_info("Testing GET /api/admin/exams...")
    try:
        response = requests.get(f"{BASE_URL}/admin/exams", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Admin exams endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            results.append(True)
        else:
            print_error(f"❌ Admin exams failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            results.append(False)
    except Exception as e:
        print_error(f"Admin exams request failed: {e}")
        results.append(False)
    
    # Test GET /api/admin/subjects
    print_info("Testing GET /api/admin/subjects...")
    try:
        response = requests.get(f"{BASE_URL}/admin/subjects", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Admin subjects endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            results.append(True)
        else:
            print_error(f"❌ Admin subjects failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            results.append(False)
    except Exception as e:
        print_error(f"Admin subjects request failed: {e}")
        results.append(False)
    
    return all(results)

def test_ai_tools():
    """Test AI tools endpoint"""
    print_header("5. AI Tools")
    
    if not ADMIN_TOKEN:
        print_error("No admin token available")
        return False
    
    # Test GET /api/admin/analytics/advanced
    print_info("Testing GET /api/admin/analytics/advanced...")
    try:
        response = requests.get(f"{BASE_URL}/admin/analytics/advanced", headers=get_admin_headers())
        
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("✅ Advanced analytics endpoint working")
            print_info(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print_error(f"❌ Advanced analytics failed: {response.status_code}")
            print_info(f"Response: {response.text}")
    except Exception as e:
        print_error(f"Advanced analytics request failed: {e}")
    
    return False

def check_backend_health():
    """Check if backend is running"""
    print_header("Backend Health Check")
    
    try:
        response = requests.get(f"{BASE_URL.replace('/api', '')}/health", timeout=5)
        if response.status_code == 200:
            print_success("✅ Backend is running and healthy")
            return True
        else:
            print_error(f"❌ Backend health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print_error("❌ Cannot connect to backend - is it running?")
    except Exception as e:
        print_error(f"❌ Backend health check error: {e}")
    
    return False

def main():
    """Main test execution"""
    print_header("Admin Dashboard Endpoints Testing")
    print_info(f"Testing backend at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now()}")
    
    # Check backend health
    if not check_backend_health():
        print_error("Backend is not accessible. Please ensure it's running.")
        sys.exit(1)
    
    # Run all tests
    test_results = []
    
    tests = [
        ("Authentication", test_authentication),
        ("Admin Dashboard Analytics", test_admin_dashboard_analytics),
        ("Admin Question Routes", test_admin_question_routes),
        ("Admin Content Routes", test_admin_content_routes),
        ("AI Tools", test_ai_tools)
    ]
    
    for test_name, test_func in tests:
        try:
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
        print_success("🎉 All tests passed! Admin endpoints are working correctly.")
    else:
        print_error(f"⚠️  {total - passed} tests failed. Please check the issues above.")
    
    print_info(f"Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()