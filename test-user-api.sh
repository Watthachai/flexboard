#!/bin/bash

echo "=== Testing User Management API ==="
echo "ก่อนที่จะโชวได้คุณทำ payload ในการเพิ่มไปก่อนได้ไหมครับ ว่าคุณเพิ่มยังไง"
echo ""

API_BASE="http://localhost:3000/api"

echo "1. Health Check - GET $API_BASE/users"
curl -X GET "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response not JSON"

echo ""
echo "=================================="
echo ""

echo "2. Payload Structure for Creating User:"
echo "นี่คือ payload ที่ใช้สำหรับสร้าง user ใหม่:"

PAYLOAD='{
  "email": "test@example.com",
  "name": "Test User",
  "password": "testpassword123",
  "role": "viewer",
  "tenantId": "optional-tenant-id"
}'

echo "$PAYLOAD" | jq '.'

echo ""
echo "=================================="
echo ""

echo "3. Creating User - POST $API_BASE/users"
echo "กำลังทดสอบสร้าง user ด้วย payload ข้างบน..."

curl -X POST "$API_BASE/users" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response not JSON"

echo ""
echo "=================================="
echo ""

echo "4. Payload Fields Explanation:"
echo "- email: ที่อยู่อีเมลของ user (จำเป็น)"
echo "- name: ชื่อเต็มของ user (จำเป็น)"
echo "- password: รหัสผ่าน ต้องยาวอย่างน้อย 8 ตัวอักษร (จำเป็น)"
echo "- role: บทบาท admin/editor/viewer (จำเป็น, default: viewer)"
echo "- tenantId: ID ของบริษัท/tenant ที่ user สังกัด (ไม่จำเป็น)"

echo ""
echo "=== Testing Complete ==="
