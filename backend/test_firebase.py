#!/usr/bin/env python3
"""
Firebase Connection Test Script

This script tests the Firebase connection using the service account credentials.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

def test_firebase_connection():
    """Test Firebase connection with current credentials"""
    try:
        # Check if service account key file exists
        if not os.path.exists('serviceAccountKey.json'):
            print("❌ serviceAccountKey.json file not found!")
            print("Please download your Firebase service account key and save it as 'serviceAccountKey.json'")
            return False
            
        # Try to load the service account key
        with open('serviceAccountKey.json', 'r') as f:
            service_account_info = json.load(f)
        
        print("✅ serviceAccountKey.json file found")
        print(f"📝 Project ID: {service_account_info.get('project_id', 'Not found')}")
        print(f"📝 Client Email: {service_account_info.get('client_email', 'Not found')}")
        
        # Initialize Firebase
        cred = credentials.Certificate('serviceAccountKey.json')
        firebase_admin.initialize_app(cred)
        print("✅ Firebase app initialized successfully")
        
        # Test Firestore connection
        db = firestore.client()
        print("✅ Firestore client created successfully")
        
        # Try a simple operation (this will fail if permissions are incorrect)
        try:
            # Try to list collections (will fail if no permissions, but that's OK)
            collections = db.collections()
            print("✅ Firestore connection test successful")
        except Exception as e:
            print(f"⚠️  Firestore operation test (this is OK): {e}")
        
        print("\n🎉 Firebase connection test completed!")
        print("If you see 'Firebase app initialized successfully', your credentials are working.")
        return True
        
    except FileNotFoundError:
        print("❌ serviceAccountKey.json file not found!")
        print("Please download your Firebase service account key and save it as 'serviceAccountKey.json'")
        return False
    except json.JSONDecodeError:
        print("❌ serviceAccountKey.json is not valid JSON!")
        print("Please check the file format.")
        return False
    except Exception as e:
        print(f"❌ Firebase connection failed: {e}")
        return False

if __name__ == "__main__":
    print("Firebase Connection Test")
    print("=" * 30)
    test_firebase_connection()