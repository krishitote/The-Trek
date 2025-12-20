# Admin API Testing Guide

## Setup: Make Yourself Admin

Run this command with your email:
```bash
cd backend
node scripts/make-admin.mjs your-email@example.com
```

## Authentication

All admin routes require:
1. Valid access token (login first)
2. User must have `is_admin = TRUE`

Include in headers:
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

---

## COMMUNITY MANAGEMENT

### Get All Communities (including unapproved)
```bash
GET http://localhost:5000/api/admin/communities
```

### Create New Community
```bash
POST http://localhost:5000/api/admin/communities
Content-Type: application/json

{
  "name": "Nairobi Hiking Club",
  "description": "Premium hiking group for Nairobi residents",
  "is_private": true,
  "registration_fee": 5000
}
```

### Approve Community
```bash
PATCH http://localhost:5000/api/admin/communities/:id/approve
```

### Delete Community
```bash
DELETE http://localhost:5000/api/admin/communities/:id
```

### Get Community Members
```bash
GET http://localhost:5000/api/admin/communities/:id/members
```

---

## CHAMPIONSHIP MANAGEMENT

### Get All Championships
```bash
GET http://localhost:5000/api/admin/championships
```

### Create Championship
```bash
POST http://localhost:5000/api/admin/championships
Content-Type: application/json

{
  "year": 2025,
  "event_date": "2025-12-15",
  "registration_fee": 500,
  "spectator_price": 5000,
  "participant_price": 10000,
  "registration_opens_at": "2025-09-15T00:00:00Z",
  "qualifications_close_at": "2025-11-15T00:00:00Z"
}
```

### Toggle Registration Open/Closed
```bash
PATCH http://localhost:5000/api/admin/championships/:id/toggle-registration
```

### Get Championship Tickets
```bash
GET http://localhost:5000/api/admin/championships/:id/tickets
```

### Generate Codes for Top 10 Qualifiers
```bash
POST http://localhost:5000/api/admin/championships/:id/generate-qualifier-codes
```
Response:
```json
{
  "message": "Generated codes for 20 qualifiers",
  "codes": [
    { "user_id": 5, "code": "GF-2025-A3B2C1" },
    { "user_id": 8, "code": "GF-2025-D4E5F6" }
  ]
}
```

---

## USER MANAGEMENT

### Get All Users
```bash
GET http://localhost:5000/api/admin/users
```

### Make User Admin
```bash
PATCH http://localhost:5000/api/admin/users/:id/make-admin
```

---

## Example Workflow

1. **Make yourself admin:**
   ```bash
   node scripts/make-admin.mjs krish@example.com
   ```

2. **Login to get token:**
   ```bash
   POST http://localhost:5000/api/auth/login
   { "email": "krish@example.com", "password": "yourpassword" }
   ```

3. **Create championship for 2025:**
   ```bash
   POST http://localhost:5000/api/admin/championships
   {
     "year": 2025,
     "event_date": "2025-12-20",
     "registration_opens_at": "2025-09-20T00:00:00Z"
   }
   ```

4. **Create a community:**
   ```bash
   POST http://localhost:5000/api/admin/communities
   {
     "name": "Mt. Kenya Trekkers",
     "description": "Elite mountain hiking group",
     "registration_fee": 3000
   }
   ```

5. **Open championship registration:**
   ```bash
   PATCH http://localhost:5000/api/admin/championships/1/toggle-registration
   ```

6. **Generate qualifier codes:**
   ```bash
   POST http://localhost:5000/api/admin/championships/1/generate-qualifier-codes
   ```

---

## Testing with cURL

```bash
# Login
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"krish@example.com","password":"yourpass"}' \
  | jq -r '.accessToken')

# Create community
curl -X POST http://localhost:5000/api/admin/communities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group","description":"Testing"}'

# Get all communities
curl http://localhost:5000/api/admin/communities \
  -H "Authorization: Bearer $TOKEN"
```

---

## Error Responses

- `401 Unauthorized` - Not logged in
- `403 Forbidden` - Not an admin
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server issue

---

## Next Steps (Optional)

If you want a web UI for admin panel, I can create:
- Admin dashboard page at `/admin`
- Tables with edit/delete buttons
- Forms for creating communities/championships
- User management interface

For now, use Postman, cURL, or browser REST client extensions to manage via API.
