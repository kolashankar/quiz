#!/usr/bin/env python3
"""
Backend Test Suite for Quiz App Content Management Module
Tests all CRUD operations for the hierarchical content structure
"""

import requests
import json
import sys
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
    
    # First, try to create an admin user
    admin_data = {
        "email": "admin@quizapp.com",
        "password": "AdminPass123!",
        "name": "Quiz Admin",
        "role": "admin"
    }
    
    try:
        # Try to register admin
        response = requests.post(f"{BASE_URL}/auth/signup", json=admin_data)
        if response.status_code in [200, 201]:
            print_success("Admin user created successfully")
        elif response.status_code == 400:
            print_info("Admin user already exists")
        else:
            print_warning(f"Admin signup response: {response.status_code}")
    except Exception as e:
        print_warning(f"Admin signup failed: {e}")
    
    # Login to get token
    try:
        login_data = {
            "email": "admin@quizapp.com",
            "password": "AdminPass123!"
        }
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

def test_exam_crud():
    """Test Exam CRUD operations"""
    print_header("Testing Exam CRUD Operations")
    
    # Test Create Exam (Admin)
    exam_data = {
        "name": "Joint Entrance Examination (JEE)",
        "description": "Engineering entrance exam for admission to IITs, NITs, and other technical institutes"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/exams",
            json=exam_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            exam = response.json()
            TEST_DATA['exam_id'] = exam['id']
            print_success(f"Exam created: {exam['name']} (ID: {exam['id']})")
        else:
            print_error(f"Exam creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Exam creation error: {e}")
        return False
    
    # Test Get Exams (Admin)
    try:
        response = requests.get(f"{BASE_URL}/content/admin/exams", headers=get_admin_headers())
        if response.status_code == 200:
            exams = response.json()
            print_success(f"Retrieved {len(exams)} exams (Admin)")
        else:
            print_error(f"Get exams (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get exams (admin) error: {e}")
    
    # Test Get Exams (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/exams")
        if response.status_code == 200:
            exams = response.json()
            print_success(f"Retrieved {len(exams)} exams (Public)")
        else:
            print_error(f"Get exams (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get exams (public) error: {e}")
    
    # Test Update Exam
    if 'exam_id' in TEST_DATA:
        update_data = {
            "name": "Joint Entrance Examination (JEE) - Updated",
            "description": "Updated description for JEE exam"
        }
        try:
            response = requests.put(
                f"{BASE_URL}/content/admin/exams/{TEST_DATA['exam_id']}",
                json=update_data,
                headers=get_admin_headers()
            )
            if response.status_code == 200:
                print_success("Exam updated successfully")
            else:
                print_error(f"Exam update failed: {response.status_code}")
        except Exception as e:
            print_error(f"Exam update error: {e}")
    
    return True

def test_subject_crud():
    """Test Subject CRUD operations"""
    print_header("Testing Subject CRUD Operations")
    
    if 'exam_id' not in TEST_DATA:
        print_error("No exam_id available for subject testing")
        return False
    
    # Test Create Subject
    subject_data = {
        "exam_id": TEST_DATA['exam_id'],
        "name": "Physics",
        "description": "Classical and Modern Physics topics for JEE"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/subjects",
            json=subject_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            subject = response.json()
            TEST_DATA['subject_id'] = subject['id']
            print_success(f"Subject created: {subject['name']} (ID: {subject['id']})")
        else:
            print_error(f"Subject creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Subject creation error: {e}")
        return False
    
    # Test Get Subjects with filter (Admin)
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/subjects?exam_id={TEST_DATA['exam_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            subjects = response.json()
            print_success(f"Retrieved {len(subjects)} subjects for exam (Admin)")
        else:
            print_error(f"Get subjects (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get subjects (admin) error: {e}")
    
    # Test Get Subjects (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/subjects?exam_id={TEST_DATA['exam_id']}")
        if response.status_code == 200:
            subjects = response.json()
            print_success(f"Retrieved {len(subjects)} subjects for exam (Public)")
        else:
            print_error(f"Get subjects (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get subjects (public) error: {e}")
    
    return True

def test_chapter_crud():
    """Test Chapter CRUD operations"""
    print_header("Testing Chapter CRUD Operations")
    
    if 'subject_id' not in TEST_DATA:
        print_error("No subject_id available for chapter testing")
        return False
    
    # Test Create Chapter
    chapter_data = {
        "subject_id": TEST_DATA['subject_id'],
        "name": "Mechanics",
        "description": "Laws of motion, work, energy, and power"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/chapters",
            json=chapter_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            chapter = response.json()
            TEST_DATA['chapter_id'] = chapter['id']
            print_success(f"Chapter created: {chapter['name']} (ID: {chapter['id']})")
        else:
            print_error(f"Chapter creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Chapter creation error: {e}")
        return False
    
    # Test Get Chapters with filter
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/chapters?subject_id={TEST_DATA['subject_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            chapters = response.json()
            print_success(f"Retrieved {len(chapters)} chapters for subject (Admin)")
        else:
            print_error(f"Get chapters (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get chapters (admin) error: {e}")
    
    # Test Get Chapters (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/chapters?subject_id={TEST_DATA['subject_id']}")
        if response.status_code == 200:
            chapters = response.json()
            print_success(f"Retrieved {len(chapters)} chapters for subject (Public)")
        else:
            print_error(f"Get chapters (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get chapters (public) error: {e}")
    
    return True

def test_topic_crud():
    """Test Topic CRUD operations"""
    print_header("Testing Topic CRUD Operations")
    
    if 'chapter_id' not in TEST_DATA:
        print_error("No chapter_id available for topic testing")
        return False
    
    # Test Create Topic
    topic_data = {
        "chapter_id": TEST_DATA['chapter_id'],
        "name": "Newton's Laws of Motion",
        "description": "First, second, and third laws of motion with applications"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/topics",
            json=topic_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            topic = response.json()
            TEST_DATA['topic_id'] = topic['id']
            print_success(f"Topic created: {topic['name']} (ID: {topic['id']})")
        else:
            print_error(f"Topic creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Topic creation error: {e}")
        return False
    
    # Test Get Topics with filter
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/topics?chapter_id={TEST_DATA['chapter_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            topics = response.json()
            print_success(f"Retrieved {len(topics)} topics for chapter (Admin)")
        else:
            print_error(f"Get topics (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get topics (admin) error: {e}")
    
    # Test Get Topics (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/topics?chapter_id={TEST_DATA['chapter_id']}")
        if response.status_code == 200:
            topics = response.json()
            print_success(f"Retrieved {len(topics)} topics for chapter (Public)")
        else:
            print_error(f"Get topics (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get topics (public) error: {e}")
    
    return True

def test_subtopic_crud():
    """Test SubTopic CRUD operations"""
    print_header("Testing SubTopic CRUD Operations")
    
    if 'topic_id' not in TEST_DATA:
        print_error("No topic_id available for subtopic testing")
        return False
    
    # Test Create SubTopic
    subtopic_data = {
        "topic_id": TEST_DATA['topic_id'],
        "name": "First Law of Motion",
        "description": "Law of inertia and its applications"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/sub-topics",
            json=subtopic_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            subtopic = response.json()
            TEST_DATA['subtopic_id'] = subtopic['id']
            print_success(f"SubTopic created: {subtopic['name']} (ID: {subtopic['id']})")
        else:
            print_error(f"SubTopic creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"SubTopic creation error: {e}")
        return False
    
    # Test Get SubTopics with filter
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/sub-topics?topic_id={TEST_DATA['topic_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            subtopics = response.json()
            print_success(f"Retrieved {len(subtopics)} sub-topics for topic (Admin)")
        else:
            print_error(f"Get sub-topics (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sub-topics (admin) error: {e}")
    
    # Test Get SubTopics (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/sub-topics?topic_id={TEST_DATA['topic_id']}")
        if response.status_code == 200:
            subtopics = response.json()
            print_success(f"Retrieved {len(subtopics)} sub-topics for topic (Public)")
        else:
            print_error(f"Get sub-topics (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sub-topics (public) error: {e}")
    
    return True

def test_section_crud():
    """Test Section CRUD operations"""
    print_header("Testing Section CRUD Operations")
    
    if 'subtopic_id' not in TEST_DATA:
        print_error("No subtopic_id available for section testing")
        return False
    
    # Test Create Section
    section_data = {
        "sub_topic_id": TEST_DATA['subtopic_id'],
        "name": "Inertia of Rest",
        "description": "Objects at rest tend to stay at rest"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/sections",
            json=section_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            section = response.json()
            TEST_DATA['section_id'] = section['id']
            print_success(f"Section created: {section['name']} (ID: {section['id']})")
        else:
            print_error(f"Section creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"Section creation error: {e}")
        return False
    
    # Test Get Sections with filter
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/sections?sub_topic_id={TEST_DATA['subtopic_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            sections = response.json()
            print_success(f"Retrieved {len(sections)} sections for sub-topic (Admin)")
        else:
            print_error(f"Get sections (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sections (admin) error: {e}")
    
    # Test Get Sections (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/sections?sub_topic_id={TEST_DATA['subtopic_id']}")
        if response.status_code == 200:
            sections = response.json()
            print_success(f"Retrieved {len(sections)} sections for sub-topic (Public)")
        else:
            print_error(f"Get sections (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sections (public) error: {e}")
    
    return True

def test_subsection_crud():
    """Test SubSection CRUD operations"""
    print_header("Testing SubSection CRUD Operations")
    
    if 'section_id' not in TEST_DATA:
        print_error("No section_id available for subsection testing")
        return False
    
    # Test Create SubSection
    subsection_data = {
        "section_id": TEST_DATA['section_id'],
        "name": "Examples of Inertia",
        "description": "Real-world examples demonstrating inertia of rest"
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/content/admin/sub-sections",
            json=subsection_data,
            headers=get_admin_headers()
        )
        
        if response.status_code in [200, 201]:
            subsection = response.json()
            TEST_DATA['subsection_id'] = subsection['id']
            print_success(f"SubSection created: {subsection['name']} (ID: {subsection['id']})")
        else:
            print_error(f"SubSection creation failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"SubSection creation error: {e}")
        return False
    
    # Test Get SubSections with filter
    try:
        response = requests.get(
            f"{BASE_URL}/content/admin/sub-sections?section_id={TEST_DATA['section_id']}",
            headers=get_admin_headers()
        )
        if response.status_code == 200:
            subsections = response.json()
            print_success(f"Retrieved {len(subsections)} sub-sections for section (Admin)")
        else:
            print_error(f"Get sub-sections (admin) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sub-sections (admin) error: {e}")
    
    # Test Get SubSections (Public)
    try:
        response = requests.get(f"{BASE_URL}/content/sub-sections?section_id={TEST_DATA['section_id']}")
        if response.status_code == 200:
            subsections = response.json()
            print_success(f"Retrieved {len(subsections)} sub-sections for section (Public)")
        else:
            print_error(f"Get sub-sections (public) failed: {response.status_code}")
    except Exception as e:
        print_error(f"Get sub-sections (public) error: {e}")
    
    return True

def test_update_operations():
    """Test update operations for all entities"""
    print_header("Testing Update Operations")
    
    # Test update SubSection
    if 'subsection_id' in TEST_DATA:
        update_data = {
            "section_id": TEST_DATA['section_id'],
            "name": "Examples of Inertia - Updated",
            "description": "Updated description with more examples"
        }
        try:
            response = requests.put(
                f"{BASE_URL}/content/admin/sub-sections/{TEST_DATA['subsection_id']}",
                json=update_data,
                headers=get_admin_headers()
            )
            if response.status_code == 200:
                print_success("SubSection updated successfully")
            else:
                print_error(f"SubSection update failed: {response.status_code}")
        except Exception as e:
            print_error(f"SubSection update error: {e}")
    
    # Test update Topic
    if 'topic_id' in TEST_DATA:
        update_data = {
            "chapter_id": TEST_DATA['chapter_id'],
            "name": "Newton's Laws of Motion - Comprehensive",
            "description": "Updated comprehensive coverage of Newton's laws"
        }
        try:
            response = requests.put(
                f"{BASE_URL}/content/admin/topics/{TEST_DATA['topic_id']}",
                json=update_data,
                headers=get_admin_headers()
            )
            if response.status_code == 200:
                print_success("Topic updated successfully")
            else:
                print_error(f"Topic update failed: {response.status_code}")
        except Exception as e:
            print_error(f"Topic update error: {e}")

def test_error_cases():
    """Test error handling"""
    print_header("Testing Error Cases")
    
    # Test invalid ID
    try:
        response = requests.get(f"{BASE_URL}/content/admin/chapters?subject_id=invalid_id", headers=get_admin_headers())
        if response.status_code == 200:
            chapters = response.json()
            if len(chapters) == 0:
                print_success("Invalid ID handled correctly (empty result)")
            else:
                print_warning("Invalid ID returned unexpected results")
        else:
            print_info(f"Invalid ID response: {response.status_code}")
    except Exception as e:
        print_error(f"Invalid ID test error: {e}")
    
    # Test missing required fields
    try:
        invalid_data = {"name": "Test Chapter"}  # Missing subject_id and description
        response = requests.post(
            f"{BASE_URL}/content/admin/chapters",
            json=invalid_data,
            headers=get_admin_headers()
        )
        if response.status_code == 422:
            print_success("Missing fields validation working correctly")
        else:
            print_warning(f"Missing fields validation response: {response.status_code}")
    except Exception as e:
        print_error(f"Missing fields test error: {e}")
    
    # Test unauthorized access (without admin token)
    try:
        response = requests.post(f"{BASE_URL}/content/admin/exams", json={"name": "Test", "description": "Test"})
        if response.status_code == 401:
            print_success("Unauthorized access blocked correctly")
        else:
            print_warning(f"Unauthorized access response: {response.status_code}")
    except Exception as e:
        print_error(f"Unauthorized access test error: {e}")

def test_delete_operations():
    """Test delete operations (cleanup)"""
    print_header("Testing Delete Operations (Cleanup)")
    
    # Delete in reverse hierarchical order
    entities_to_delete = [
        ('subsection_id', 'sub-sections'),
        ('section_id', 'sections'),
        ('subtopic_id', 'sub-topics'),
        ('topic_id', 'topics'),
        ('chapter_id', 'chapters'),
        ('subject_id', 'subjects'),
        ('exam_id', 'exams')
    ]
    
    for id_key, endpoint in entities_to_delete:
        if id_key in TEST_DATA:
            try:
                response = requests.delete(
                    f"{BASE_URL}/content/admin/{endpoint}/{TEST_DATA[id_key]}",
                    headers=get_admin_headers()
                )
                if response.status_code in [200, 204]:
                    print_success(f"Deleted {endpoint[:-1]} successfully")
                else:
                    print_error(f"Delete {endpoint[:-1]} failed: {response.status_code}")
            except Exception as e:
                print_error(f"Delete {endpoint[:-1]} error: {e}")

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
    print_header("Quiz App Content Management Backend Testing")
    print_info(f"Testing backend at: {BASE_URL}")
    print_info(f"Test started at: {datetime.now()}")
    
    # Check backend health
    if not check_backend_health():
        print_error("Backend is not accessible. Please ensure it's running on localhost:8001")
        sys.exit(1)
    
    # Setup authentication
    if not setup_admin_auth():
        print_error("Failed to setup admin authentication. Some tests may fail.")
    
    # Run all tests
    test_results = []
    
    tests = [
        ("Exam CRUD", test_exam_crud),
        ("Subject CRUD", test_subject_crud),
        ("Chapter CRUD", test_chapter_crud),
        ("Topic CRUD", test_topic_crud),
        ("SubTopic CRUD", test_subtopic_crud),
        ("Section CRUD", test_section_crud),
        ("SubSection CRUD", test_subsection_crud),
        ("Update Operations", test_update_operations),
        ("Error Cases", test_error_cases),
        ("Delete Operations", test_delete_operations)
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
        print_success("All tests passed! Content Management Module is working correctly.")
    else:
        print_error(f"{total - passed} tests failed. Please check the issues above.")
    
    print_info(f"Test completed at: {datetime.now()}")

if __name__ == "__main__":
    main()