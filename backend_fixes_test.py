#!/usr/bin/env python3
"""
Backend Fixes Test Suite for Quiz App
Tests specific fixes mentioned in the review request:
1. Fixed KeyError: 'created_at' Issue
2. CORS Configuration
3. Authentication Flow
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration - Using the backend URL from environment
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

def test_cors_configuration():
    """Test CORS configuration"""
    print_header("Testing CORS Configuration")
    
    # Test OPTIONS request to auth/login
    try:
        response = requests.options(f"{BASE_URL}/auth/login")
        print_info(f"OPTIONS /auth/login status: {response.status_code}")
        
        # Check CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        print_info("CORS Headers found:")
        for header, value in cors_headers.items():
            if value:
                print_info(f"  {header}: {value}")
            else:
                print_warning(f"  {header}: Not present")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print_success("CORS Access-Control-Allow-Origin header is present")
        else:
            print_error("CORS Access-Control-Allow-Origin header is missing")
            
    except Exception as e:
        print_error(f"CORS test error: {e}")

def test_authentication_flow():
    """Test authentication flow - signup, login, me"""
    print_header("Testing Authentication Flow")
    global ADMIN_TOKEN
    
    # Test 1: Signup
    print_info("Testing POST /auth/signup")
    signup_data = {
        "email": "testuser@quizapp.com",
        "password": "TestPass123!",
        "name": "Test User",
        "role": "admin"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        print_info(f"Signup response status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success("User signup successful")
            if 'access_token' in data:
                ADMIN_TOKEN = data['access_token']
                print_success("Access token received from signup")
            else:
                print_error("No access token in signup response")
        elif response.status_code == 400:
            print_info("User already exists (expected if running multiple times)")
        else:
            print_error(f"Signup failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Signup error: {e}")
    
    # Test 2: Login
    print_info("Testing POST /auth/login")
    login_data = {
        "email": "testuser@quizapp.com",
        "password": "TestPass123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        print_info(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("User login successful")
            if 'access_token' in data:
                ADMIN_TOKEN = data['access_token']
                print_success("Access token received from login")
            else:
                print_error("No access token in login response")
        else:
            print_error(f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Login error: {e}")
    
    # Test 3: Get current user profile
    if ADMIN_TOKEN:
        print_info("Testing GET /auth/me")
        try:
            headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            print_info(f"Get me response status: {response.status_code}")
            
            if response.status_code == 200:
                user_data = response.json()
                print_success("Get current user profile successful")
                print_info(f"User email: {user_data.get('email')}")
                print_info(f"User role: {user_data.get('role')}")
            else:
                print_error(f"Get me failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Get me error: {e}")
    else:
        print_error("No admin token available for /auth/me test")

def test_created_at_fix():
    """Test the KeyError: 'created_at' fix"""
    print_header("Testing KeyError: 'created_at' Fix")
    
    # Test 1: GET /api/exams (public endpoint)
    print_info("Testing GET /api/exams (public endpoint)")
    try:
        response = requests.get(f"{BASE_URL}/content/exams")
        print_info(f"Public exams response status: {response.status_code}")
        
        if response.status_code == 200:
            exams = response.json()
            print_success(f"Public exams endpoint working - returned {len(exams)} exams")
            
            # Check if any exam has created_at field or if default is applied
            for exam in exams[:3]:  # Check first 3 exams
                if 'created_at' in exam:
                    print_success(f"Exam '{exam.get('name', 'Unknown')}' has created_at field")
                else:
                    print_info(f"Exam '{exam.get('name', 'Unknown')}' missing created_at (should use default)")
        else:
            print_error(f"Public exams failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Public exams error: {e}")
    
    # Test 2: GET /api/admin/exams (admin endpoint)
    if ADMIN_TOKEN:
        print_info("Testing GET /api/admin/exams (admin endpoint)")
        try:
            headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            response = requests.get(f"{BASE_URL}/content/admin/exams", headers=headers)
            print_info(f"Admin exams response status: {response.status_code}")
            
            if response.status_code == 200:
                exams = response.json()
                print_success(f"Admin exams endpoint working - returned {len(exams)} exams")
            else:
                print_error(f"Admin exams failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Admin exams error: {e}")
    else:
        print_warning("No admin token available for admin exams test")
    
    # Test 3: GET /api/subjects (public endpoint)
    print_info("Testing GET /api/subjects (public endpoint)")
    try:
        response = requests.get(f"{BASE_URL}/content/subjects")
        print_info(f"Public subjects response status: {response.status_code}")
        
        if response.status_code == 200:
            subjects = response.json()
            print_success(f"Public subjects endpoint working - returned {len(subjects)} subjects")
        else:
            print_error(f"Public subjects failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_error(f"Public subjects error: {e}")
    
    # Test 4: GET /api/admin/subjects (admin endpoint)
    if ADMIN_TOKEN:
        print_info("Testing GET /api/admin/subjects (admin endpoint)")
        try:
            headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
            response = requests.get(f"{BASE_URL}/content/admin/subjects", headers=headers)
            print_info(f"Admin subjects response status: {response.status_code}")
            
            if response.status_code == 200:
                subjects = response.json()
                print_success(f"Admin subjects endpoint working - returned {len(subjects)} subjects")
            else:
                print_error(f"Admin subjects failed: {response.status_code} - {response.text}")
        except Exception as e:
            print_error(f"Admin subjects error: {e}")
    else:
        print_warning("No admin token available for admin subjects test")

def main():
    """Main test execution"""
    print_header("Backend Fixes Testing - Quiz App")
    print_info(f"Testing backend at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now()}")
    
    # Check backend health
    if not check_backend_health():
        print_error("Backend is not accessible. Please ensure it's running.")
        sys.exit(1)
    
    # Run specific fix tests
    test_results = []
    
    tests = [
        ("CORS Configuration", test_cors_configuration),
        ("Authentication Flow", test_authentication_flow),
        ("KeyError: 'created_at' Fix", test_created_at_fix)
    ]
    
    for test_name, test_func in tests:
        try:
            print_info(f"Running {test_name}...")
            test_func()
            test_results.append((test_name, True))
        except Exception as e:
            print_error(f"Test {test_name} crashed: {e}")
            test_results.append((test_name, False))
    
    # Print summary
    print_header("Test Summary")
    passed = sum(1 for _, result in test_results if result)
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ COMPLETED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\n{Colors.BOLD}Overall Result: {passed}/{total} tests completed{Colors.ENDC}")
    
    if passed == total:
        print_success("All backend fixes tests completed successfully!")
    else:
        print_error(f"{total - passed} tests failed. Please check the issues above.")
    
    print_info(f"Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()