#!/usr/bin/env python3
"""
Test for old user without created_at field - KeyError fix verification
"""

import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from core.security import get_password_hash
from datetime import datetime

BASE_URL = "http://localhost:8001/api"

async def create_old_user_without_created_at():
    """Create a user in database without created_at field"""
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client.quiz_app_db
    
    # Hash password properly
    hashed_password = get_password_hash("OldUserPass123!")
    
    old_user = {
        'email': 'olduser@test.com',
        'password': hashed_password,
        'role': 'user'
        # Intentionally no created_at field
    }
    
    # Remove any existing user first
    await db.users.delete_one({'email': 'olduser@test.com'})
    
    # Insert user without created_at
    result = await db.users.insert_one(old_user)
    print(f"✅ Created old user without created_at field: {result.inserted_id}")
    
    # Verify user doesn't have created_at
    user = await db.users.find_one({'email': 'olduser@test.com'})
    has_created_at = 'created_at' in user
    print(f"User has created_at field: {has_created_at}")
    
    client.close()
    return not has_created_at

def test_old_user_login():
    """Test login with old user that doesn't have created_at field"""
    print("\n🧪 Testing login with old user (no created_at field)...")
    
    login_data = {
        "email": "olduser@test.com",
        "password": "OldUserPass123!"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            
            if "user" in data and "created_at" in data["user"]:
                print("✅ Login successful - created_at field present in response")
                print(f"   Default created_at value: {data['user']['created_at']}")
                return True, data.get("access_token")
            else:
                print("❌ Login response missing created_at field")
                return False, None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Login test error: {e}")
        return False, None

def test_old_user_get_me(access_token):
    """Test /me endpoint with old user token"""
    print("\n🧪 Testing /me endpoint with old user token...")
    
    if not access_token:
        print("❌ No access token available")
        return False
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        
        if response.status_code == 200:
            user_data = response.json()
            
            if "created_at" in user_data:
                print("✅ Get Me successful - created_at field present in response")
                print(f"   Default created_at value: {user_data['created_at']}")
                return True
            else:
                print("❌ Get Me response missing created_at field")
                return False
        else:
            print(f"❌ Get Me failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Get Me test error: {e}")
        return False

async def main():
    print("🔍 Testing KeyError: 'created_at' fix with old user data")
    print("=" * 60)
    
    # Step 1: Create old user without created_at field
    success = await create_old_user_without_created_at()
    if not success:
        print("❌ Failed to create old user without created_at field")
        return False
    
    # Step 2: Test login with old user
    login_success, token = test_old_user_login()
    
    # Step 3: Test /me endpoint with old user
    me_success = test_old_user_get_me(token) if token else False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    print(f"Old user creation: {'✅ PASSED' if success else '❌ FAILED'}")
    print(f"Login endpoint: {'✅ PASSED' if login_success else '❌ FAILED'}")
    print(f"Get Me endpoint: {'✅ PASSED' if me_success else '❌ FAILED'}")
    
    overall_success = success and login_success and me_success
    print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    if overall_success:
        print("🎉 KeyError: 'created_at' fix is working perfectly!")
        print("   ✅ Old users without created_at field can login successfully")
        print("   ✅ Default datetime.utcnow() is applied when field is missing")
        print("   ✅ No KeyError exceptions are thrown")
    
    return overall_success

if __name__ == "__main__":
    import sys
    sys.path.append('/app/backend')
    
    result = asyncio.run(main())
    sys.exit(0 if result else 1)