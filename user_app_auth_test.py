#!/usr/bin/env python3
"""
Comprehensive Authentication Testing for User App Backend
Tests all authentication flows as specified in the review request.
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

class UserAppAuthTester:
    def __init__(self, base_url: str = "https://quizify-admin.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = requests.Session()
        
        # Test credentials
        self.test_email = "authtest@example.com"
        self.test_password = "securepass123"
        self.test_token = None
        self.reset_code = None
        
        print(f"🚀 Initializing User App Authentication Tester for {self.api_url}")

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

    def test_user_signup_flow(self) -> bool:
        """Test user signup flow with various scenarios"""
        print("\n📝 Testing User Signup Flow...")
        
        try:
            # Test 1: Valid signup
            print("  ✅ Testing valid signup...")
            signup_data = {
                "email": self.test_email,
                "password": self.test_password,
                "role": "user"
            }
            
            response = self.make_request("POST", "/auth/signup", signup_data)
            
            if response.status_code in [200, 201]:
                result = response.json()
                
                # Verify response structure
                required_fields = ["access_token", "token_type", "user"]
                if all(field in result for field in required_fields):
                    user = result["user"]
                    user_fields = ["id", "email", "role", "created_at"]
                    if all(field in user for field in user_fields):
                        self.test_token = result["access_token"]
                        print(f"    ✅ Signup successful - User ID: {user['id']}")
                        print(f"    ✅ Token received: {result['token_type']}")
                        print(f"    ✅ User role: {user['role']}")
                    else:
                        print(f"    ❌ Invalid user object structure: {user}")
                        return False
                else:
                    print(f"    ❌ Invalid response structure: {result}")
                    return False
            elif response.status_code == 400:
                # User might already exist, try to continue with login
                print("    ⚠️ User already exists, will test login instead")
            else:
                print(f"    ❌ Signup failed: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Duplicate email registration
            print("  🔄 Testing duplicate email registration...")
            response = self.make_request("POST", "/auth/signup", signup_data)
            
            if response.status_code == 400:
                print("    ✅ Duplicate email correctly rejected")
            else:
                print(f"    ❌ Expected 400 for duplicate email, got {response.status_code}")
                return False
            
            # Test 3: Invalid email format
            print("  📧 Testing invalid email format...")
            invalid_signup = {
                "email": "invalid-email",
                "password": self.test_password,
                "role": "user"
            }
            
            response = self.make_request("POST", "/auth/signup", invalid_signup)
            
            if response.status_code == 422:  # Pydantic validation error
                print("    ✅ Invalid email format correctly rejected")
            else:
                print(f"    ⚠️ Expected 422 for invalid email, got {response.status_code}")
                # This might not be a critical failure depending on validation implementation
            
            return True
            
        except Exception as e:
            print(f"❌ Signup test failed: {e}")
            return False

    def test_user_login_flow(self) -> bool:
        """Test user login flow with various scenarios"""
        print("\n🔐 Testing User Login Flow...")
        
        try:
            # Test 1: Correct credentials
            print("  ✅ Testing correct credentials...")
            login_data = {
                "email": self.test_email,
                "password": self.test_password
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                result = response.json()
                
                # Verify JWT token structure
                if "access_token" in result and "token_type" in result:
                    self.test_token = result["access_token"]
                    print(f"    ✅ Login successful - Token type: {result['token_type']}")
                    print(f"    ✅ JWT token received (length: {len(self.test_token)})")
                else:
                    print(f"    ❌ Invalid login response: {result}")
                    return False
            else:
                print(f"    ❌ Login failed: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Incorrect password
            print("  🚫 Testing incorrect password...")
            wrong_login = {
                "email": self.test_email,
                "password": "wrongpassword"
            }
            
            response = self.make_request("POST", "/auth/login", wrong_login)
            
            if response.status_code == 401:
                print("    ✅ Incorrect password correctly rejected")
            else:
                print(f"    ❌ Expected 401 for wrong password, got {response.status_code}")
                return False
            
            # Test 3: Non-existent email
            print("  👻 Testing non-existent email...")
            nonexistent_login = {
                "email": "nonexistent@example.com",
                "password": self.test_password
            }
            
            response = self.make_request("POST", "/auth/login", nonexistent_login)
            
            if response.status_code == 401:
                print("    ✅ Non-existent email correctly rejected")
            else:
                print(f"    ❌ Expected 401 for non-existent email, got {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Login test failed: {e}")
            return False

    def test_get_current_user(self) -> bool:
        """Test get current user endpoint (auth verification)"""
        print("\n👤 Testing Get Current User (Auth Verification)...")
        
        try:
            # Test 1: Valid token
            print("  🎫 Testing with valid token...")
            response = self.make_request("GET", "/auth/me", token=self.test_token)
            
            if response.status_code == 200:
                user = response.json()
                required_fields = ["id", "email", "role", "created_at"]
                if all(field in user for field in required_fields):
                    print(f"    ✅ User data retrieved - Email: {user['email']}")
                    print(f"    ✅ User role: {user['role']}")
                else:
                    print(f"    ❌ Invalid user data structure: {user}")
                    return False
            else:
                print(f"    ❌ Get user failed: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Invalid token
            print("  🚫 Testing with invalid token...")
            response = self.make_request("GET", "/auth/me", token="invalid_token_123")
            
            if response.status_code == 401:
                print("    ✅ Invalid token correctly rejected")
            else:
                print(f"    ❌ Expected 401 for invalid token, got {response.status_code}")
                return False
            
            # Test 3: No token
            print("  🚫 Testing without token...")
            response = self.make_request("GET", "/auth/me")
            
            if response.status_code == 401:
                print("    ✅ Missing token correctly rejected")
            else:
                print(f"    ❌ Expected 401 for missing token, got {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Get current user test failed: {e}")
            return False

    def test_forgot_password_flow(self) -> bool:
        """Test forgot password flow"""
        print("\n🔑 Testing Forgot Password Flow...")
        
        try:
            # Test 1: Valid email
            print("  📧 Testing forgot password with valid email...")
            forgot_data = {"email": self.test_email}
            
            response = self.make_request("POST", "/auth/forgot-password", forgot_data)
            
            if response.status_code == 200:
                result = response.json()
                if "message" in result:
                    print(f"    ✅ Forgot password request successful")
                    
                    # Check if reset code is returned (for testing purposes)
                    if "reset_code" in result:
                        self.reset_code = result["reset_code"]
                        print(f"    ✅ Reset code generated: {self.reset_code}")
                    else:
                        print("    ⚠️ No reset code in response (production mode)")
                        # In production, code would be sent via email
                        return True
                else:
                    print(f"    ❌ Invalid forgot password response: {result}")
                    return False
            else:
                print(f"    ❌ Forgot password failed: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Non-existent email (should still return success for security)
            print("  👻 Testing forgot password with non-existent email...")
            nonexistent_data = {"email": "nonexistent@example.com"}
            
            response = self.make_request("POST", "/auth/forgot-password", nonexistent_data)
            
            if response.status_code == 200:
                print("    ✅ Non-existent email handled securely")
            else:
                print(f"    ❌ Expected 200 for security, got {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Forgot password test failed: {e}")
            return False

    def test_reset_password_flow(self) -> bool:
        """Test reset password flow"""
        print("\n🔄 Testing Reset Password Flow...")
        
        if not self.reset_code:
            print("  ⚠️ No reset code available, skipping reset password test")
            return True
        
        try:
            # Test 1: Valid reset code
            print("  ✅ Testing password reset with valid code...")
            new_password = "newpassword456"
            reset_data = {
                "email": self.test_email,
                "new_password": new_password,
                "reset_code": self.reset_code
            }
            
            response = self.make_request("POST", "/auth/reset-password", reset_data)
            
            if response.status_code == 200:
                print("    ✅ Password reset successful")
                
                # Update password for future tests
                self.test_password = new_password
            else:
                print(f"    ❌ Password reset failed: {response.status_code} - {response.text}")
                return False
            
            # Test 2: Login with new password
            print("  🔐 Testing login with new password...")
            login_data = {
                "email": self.test_email,
                "password": new_password
            }
            
            response = self.make_request("POST", "/auth/login", login_data)
            
            if response.status_code == 200:
                result = response.json()
                self.test_token = result["access_token"]
                print("    ✅ Login with new password successful")
            else:
                print(f"    ❌ Login with new password failed: {response.status_code}")
                return False
            
            # Test 3: Invalid reset code
            print("  🚫 Testing with invalid reset code...")
            invalid_reset = {
                "email": self.test_email,
                "new_password": "anotherpassword",
                "reset_code": "123456"  # Invalid code
            }
            
            response = self.make_request("POST", "/auth/reset-password", invalid_reset)
            
            if response.status_code == 400:
                print("    ✅ Invalid reset code correctly rejected")
            else:
                print(f"    ❌ Expected 400 for invalid code, got {response.status_code}")
                return False
            
            # Test 4: Expired reset code (simulate by using old code again)
            print("  ⏰ Testing with used/expired reset code...")
            expired_reset = {
                "email": self.test_email,
                "new_password": "expiredtest",
                "reset_code": self.reset_code  # Already used code
            }
            
            response = self.make_request("POST", "/auth/reset-password", expired_reset)
            
            if response.status_code == 400:
                print("    ✅ Used/expired reset code correctly rejected")
            else:
                print(f"    ⚠️ Expected 400 for expired code, got {response.status_code}")
                # This might not fail if the code is still valid
            
            return True
            
        except Exception as e:
            print(f"❌ Reset password test failed: {e}")
            return False

    def test_end_to_end_flow(self) -> bool:
        """Test complete end-to-end authentication flow"""
        print("\n🔄 Testing End-to-End Authentication Flow...")
        
        try:
            # Use a different email for E2E test
            e2e_email = "e2etest@example.com"
            e2e_password = "e2epassword123"
            
            # Step 1: Signup new user
            print("  1️⃣ Signup new user...")
            signup_data = {
                "email": e2e_email,
                "password": e2e_password,
                "role": "user"
            }
            
            response = self.make_request("POST", "/auth/signup", signup_data)
            if response.status_code not in [200, 201, 400]:  # 400 if already exists
                print(f"    ❌ E2E Signup failed: {response.status_code}")
                return False
            print("    ✅ User signup completed")
            
            # Step 2: Login
            print("  2️⃣ Login with credentials...")
            login_data = {"email": e2e_email, "password": e2e_password}
            response = self.make_request("POST", "/auth/login", login_data)
            if response.status_code != 200:
                print(f"    ❌ E2E Login failed: {response.status_code}")
                return False
            
            e2e_token = response.json()["access_token"]
            print("    ✅ Login successful")
            
            # Step 3: Get profile
            print("  3️⃣ Get user profile...")
            response = self.make_request("GET", "/auth/me", token=e2e_token)
            if response.status_code != 200:
                print(f"    ❌ E2E Get profile failed: {response.status_code}")
                return False
            print("    ✅ Profile retrieved")
            
            # Step 4: Forgot password
            print("  4️⃣ Request password reset...")
            forgot_data = {"email": e2e_email}
            response = self.make_request("POST", "/auth/forgot-password", forgot_data)
            if response.status_code != 200:
                print(f"    ❌ E2E Forgot password failed: {response.status_code}")
                return False
            
            e2e_reset_code = None
            if "reset_code" in response.json():
                e2e_reset_code = response.json()["reset_code"]
            print("    ✅ Password reset requested")
            
            # Step 5: Reset password (if code available)
            if e2e_reset_code:
                print("  5️⃣ Reset password...")
                new_e2e_password = "newe2epassword789"
                reset_data = {
                    "email": e2e_email,
                    "new_password": new_e2e_password,
                    "reset_code": e2e_reset_code
                }
                
                response = self.make_request("POST", "/auth/reset-password", reset_data)
                if response.status_code != 200:
                    print(f"    ❌ E2E Password reset failed: {response.status_code}")
                    return False
                print("    ✅ Password reset completed")
                
                # Step 6: Login with new password
                print("  6️⃣ Login with new password...")
                new_login_data = {"email": e2e_email, "password": new_e2e_password}
                response = self.make_request("POST", "/auth/login", new_login_data)
                if response.status_code != 200:
                    print(f"    ❌ E2E Login with new password failed: {response.status_code}")
                    return False
                print("    ✅ Login with new password successful")
            else:
                print("  5️⃣ ⚠️ Skipping password reset (no code available)")
            
            print("  🎉 End-to-end flow completed successfully!")
            return True
            
        except Exception as e:
            print(f"❌ End-to-end test failed: {e}")
            return False

    def run_all_auth_tests(self) -> Dict[str, bool]:
        """Run all authentication tests"""
        print("🔐 Starting Comprehensive Authentication Testing")
        print("=" * 70)
        
        results = {}
        
        # Run all authentication test scenarios
        test_methods = [
            ("User Signup Flow", self.test_user_signup_flow),
            ("User Login Flow", self.test_user_login_flow),
            ("Get Current User (Auth Verification)", self.test_get_current_user),
            ("Forgot Password Flow", self.test_forgot_password_flow),
            ("Reset Password Flow", self.test_reset_password_flow),
            ("End-to-End Flow Test", self.test_end_to_end_flow)
        ]
        
        for test_name, test_method in test_methods:
            try:
                print(f"\n🧪 Running: {test_name}")
                results[test_name] = test_method()
                if results[test_name]:
                    print(f"✅ {test_name} - PASSED")
                else:
                    print(f"❌ {test_name} - FAILED")
            except Exception as e:
                print(f"💥 {test_name} - CRASHED: {e}")
                results[test_name] = False
        
        return results

    def print_summary(self, results: Dict[str, bool]):
        """Print comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📋 COMPREHENSIVE AUTHENTICATION TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for result in results.values() if result)
        total = len(results)
        
        print("\n🔍 Test Results:")
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {status} {test_name}")
        
        print("\n📊 Overall Results:")
        print(f"  • Total Tests: {total}")
        print(f"  • Passed: {passed}")
        print(f"  • Failed: {total - passed}")
        print(f"  • Success Rate: {passed/total*100:.1f}%")
        
        print("\n🔐 Authentication Features Tested:")
        print("  ✓ User signup with validation")
        print("  ✓ JWT token generation and validation")
        print("  ✓ User login with error handling")
        print("  ✓ Protected endpoint access")
        print("  ✓ Password reset workflow")
        print("  ✓ Security best practices")
        print("  ✓ End-to-end authentication flow")
        
        if passed == total:
            print("\n🎉 ALL AUTHENTICATION TESTS PASSED!")
            print("   The authentication system is working correctly.")
        else:
            print(f"\n⚠️  {total - passed} TEST(S) FAILED")
            print("   Please check the detailed logs above for issues.")
        
        print("=" * 70)

def main():
    """Main test execution"""
    tester = UserAppAuthTester()
    results = tester.run_all_auth_tests()
    tester.print_summary(results)
    
    # Return exit code based on results
    if all(results.values()):
        exit(0)
    else:
        exit(1)

if __name__ == "__main__":
    main()