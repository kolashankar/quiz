#!/usr/bin/env python3
"""
Simple Backend API Verification for Web App
Focus on testing key endpoints and new fields
"""

import requests
import json

BASE_URL = "https://quizcraft-77.preview.emergentagent.com/api"

def test_endpoint(name, url, method="GET", data=None, headers=None):
    """Test a single endpoint"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=10)
        
        print(f"✅ {name}: {response.status_code} - {url}")
        if response.status_code >= 400:
            print(f"   Response: {response.text[:200]}")
        return response.status_code < 400, response
    except Exception as e:
        print(f"❌ {name}: ERROR - {str(e)}")
        return False, None

def main():
    print("🚀 Web App Backend API Verification")
    print("=" * 50)
    
    results = []
    
    # Test 1: Basic connectivity
    success, _ = test_endpoint("Health Check", f"{BASE_URL}/exams")
    results.append(("Health Check", success))
    
    # Test 2: Hierarchy APIs (8 levels)
    hierarchy_endpoints = [
        ("Exams API", f"{BASE_URL}/exams"),
        ("Subjects API", f"{BASE_URL}/subjects"),
        ("Chapters API", f"{BASE_URL}/chapters"),
        ("Topics API", f"{BASE_URL}/topics"),
        ("Sub-Topics API", f"{BASE_URL}/sub-topics"),
        ("Sections API", f"{BASE_URL}/sections"),
        ("Sub-Sections API", f"{BASE_URL}/sub-sections"),
    ]
    
    for name, url in hierarchy_endpoints:
        success, _ = test_endpoint(name, url)
        results.append((name, success))
    
    # Test 3: Questions API (verify new fields)
    success, response = test_endpoint("Questions API", f"{BASE_URL}/questions?limit=5")
    if success and response:
        try:
            data = response.json()
            if isinstance(data, list):
                if len(data) > 0:
                    question = data[0]
                    new_fields = ["hint", "solution", "code_snippet", "image_url", "formula"]
                    missing_fields = [field for field in new_fields if field not in question]
                    
                    if not missing_fields:
                        print(f"✅ New Fields Verification: All new fields present")
                        results.append(("New Fields Verification", True))
                    else:
                        print(f"❌ New Fields Verification: Missing fields: {missing_fields}")
                        results.append(("New Fields Verification", False))
                else:
                    print(f"✅ New Fields Verification: API accessible (no data)")
                    results.append(("New Fields Verification", True))
            else:
                print(f"❌ New Fields Verification: Invalid response format")
                results.append(("New Fields Verification", False))
        except Exception as e:
            print(f"❌ New Fields Verification: Error parsing response: {e}")
            results.append(("New Fields Verification", False))
    else:
        results.append(("New Fields Verification", False))
    
    # Test 4: Enhanced Features (no auth required)
    enhanced_endpoints = [
        ("Leaderboard API", f"{BASE_URL}/leaderboard"),
    ]
    
    for name, url in enhanced_endpoints:
        success, _ = test_endpoint(name, url)
        results.append((name, success))
    
    # Test 5: Authentication endpoints
    auth_endpoints = [
        ("Login Endpoint", f"{BASE_URL}/auth/login", "POST", {"email": "test@test.com", "password": "test"}),
    ]
    
    for name, url, method, data in auth_endpoints:
        success, _ = test_endpoint(name, url, method, data)
        results.append((name, success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nResult: {passed}/{total} tests passed ({(passed/total)*100:.1f}%)")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED - Backend APIs are accessible!")
    else:
        print("⚠️  Some tests failed - Backend may have issues")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)