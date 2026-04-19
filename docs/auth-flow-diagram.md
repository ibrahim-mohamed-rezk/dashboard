# Authentication Flow Diagrams

## Before (Cookie-Based - BROKEN ❌)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────┘

User                Frontend              Next.js API         Laravel API
  │                    │                      │                    │
  │  Submit Login      │                      │                    │
  ├───────────────────>│                      │                    │
  │                    │  POST /login         │                    │
  │                    ├─────────────────────────────────────────>│
  │                    │                      │                    │
  │                    │  { token, data: {...large user object...} }
  │                    │<──────────────────────────────────────────┤
  │                    │                      │                    │
  │                    │  POST /api/auth/setToken                 │
  │                    │  { token, user }     │                    │
  │                    ├─────────────────────>│                    │
  │                    │                      │                    │
  │                    │  Set-Cookie: token   │                    │
  │                    │  Set-Cookie: user    │ ❌ FAILS (>4KB)   │
  │                    │<─────────────────────┤                    │
  │                    │                      │                    │
  │  Redirect          │                      │                    │
  │<───────────────────┤                      │                    │
  │                    │                      │                    │
  │  Access Dashboard  │                      │                    │
  ├───────────────────>│                      │                    │
  │                    │  Read cookies        │                    │
  │                    │  ❌ No user cookie!  │                    │
  │  Redirect to Login │                      │                    │
  │<───────────────────┤                      │                    │
```

## After (localStorage + Cookie - WORKING ✅)

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────┘

User                Frontend              Next.js API         Laravel API
  │                    │                      │                    │
  │  Submit Login      │                      │                    │
  ├───────────────────>│                      │                    │
  │                    │  POST /login         │                    │
  │                    ├─────────────────────────────────────────>│
  │                    │                      │                    │
  │                    │  { token, data: {...large user object...} }
  │                    │<──────────────────────────────────────────┤
  │                    │                      │                    │
  │                    │  localStorage.setItem("user", data) ✅    │
  │                    │                      │                    │
  │                    │  POST /api/auth/setToken                 │
  │                    │  { token }           │                    │
  │                    ├─────────────────────>│                    │
  │                    │                      │                    │
  │                    │  Set-Cookie: token ✅│                    │
  │                    │<─────────────────────┤                    │
  │                    │                      │                    │
  │  Redirect          │                      │                    │
  │<───────────────────┤                      │                    │


┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD LOAD FLOW                         │
└─────────────────────────────────────────────────────────────────┘

User                Frontend              Next.js API         
  │                    │                      │                    
  │  Access Dashboard  │                      │                    
  ├───────────────────>│                      │                    
  │                    │  Server: Check token cookie ✅            
  │                    │                      │                    
  │                    │  Client: Read localStorage("user") ✅     
  │                    │                      │                    
  │  Dashboard Loaded  │                      │                    
  │<───────────────────┤                      │                    


┌─────────────────────────────────────────────────────────────────┐
│                         LOGOUT FLOW                              │
└─────────────────────────────────────────────────────────────────┘

User                Frontend              Next.js API         
  │                    │                      │                    
  │  Click Logout      │                      │                    
  ├───────────────────>│                      │                    
  │                    │  localStorage.removeItem("user") ✅       
  │                    │                      │                    
  │                    │  POST /api/auth/removeToken              
  │                    ├─────────────────────>│                    
  │                    │                      │                    
  │                    │  Delete token cookie ✅                   
  │                    │<─────────────────────┤                    
  │                    │                      │                    
  │  Redirect to Login │                      │                    
  │<───────────────────┤                      │                    
```

## Data Storage Comparison

### Before ❌
```
┌─────────────────────────────────────────────────────────────┐
│                         COOKIES                              │
├─────────────────────────────────────────────────────────────┤
│ token: "eyJhbGc..." (200 bytes) ✅                          │
│ user: "{...large JSON...}" (>4KB) ❌ REJECTED BY BROWSER   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOCAL STORAGE                           │
├─────────────────────────────────────────────────────────────┤
│ (empty)                                                      │
└─────────────────────────────────────────────────────────────┘
```

### After ✅
```
┌─────────────────────────────────────────────────────────────┐
│                         COOKIES                              │
├─────────────────────────────────────────────────────────────┤
│ token: "eyJhbGc..." (200 bytes) ✅                          │
│   - httpOnly: true                                           │
│   - secure: true (production)                                │
│   - sameSite: lax                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOCAL STORAGE                           │
├─────────────────────────────────────────────────────────────┤
│ user: {                                                      │
│   id: 1,                                                     │
│   full_name: "John Doe",                                     │
│   email: "john@example.com",                                 │
│   role: "admin",                                             │
│   modules: [...],                                            │
│   teachers: [...],                                           │
│   ...                                                        │
│ } ✅ (Can be >4KB, no problem!)                             │
└─────────────────────────────────────────────────────────────┘
```

## Security Model

### Token (Cookie) 🔒
```
┌─────────────────────────────────────────────────────────────┐
│ AUTHENTICATION TOKEN                                         │
├─────────────────────────────────────────────────────────────┤
│ Storage: httpOnly Cookie                                     │
│ Access: Server-side only                                     │
│ Security: High                                               │
│ Purpose: Authenticate API requests                           │
│ Sent with: Every HTTP request (automatic)                    │
└─────────────────────────────────────────────────────────────┘
```

### User Data (localStorage) 📋
```
┌─────────────────────────────────────────────────────────────┐
│ USER PROFILE DATA                                            │
├─────────────────────────────────────────────────────────────┤
│ Storage: localStorage                                        │
│ Access: Client-side JavaScript                               │
│ Security: Medium (not sensitive credentials)                 │
│ Purpose: UI rendering, permissions, profile display          │
│ Sent with: Nothing (stays on client)                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    app/[lang]/(dashboard)/layout.tsx             │
│                         (Server Component)                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Check token cookie                                           │
│  2. If no token → redirect to /auth/login                        │
│  3. If token exists → render DashboardLayoutWrapper              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              provider/dashboard.layout.wrapper.tsx               │
│                       (Client Component)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Read user from localStorage                                  │
│  2. If no user → redirect to /auth/login                         │
│  3. If user exists → render DashBoardLayoutProvider              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│            provider/dashboard.layout.provider.tsx                │
│                       (Client Component)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. Receive user as prop                                         │
│  2. Pass user to Header and Sidebar                              │
│  3. Render children (page content)                               │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### POST /api/auth/setToken
```
Request:  { token: string }
Response: { message: "Logged in" }
Side Effect: Set httpOnly cookie with token
```

### GET /api/auth/getToken
```
Request:  (reads token from cookie)
Response: { token: string }
Note: User data comes from localStorage on client
```

### POST /api/auth/removeToken
```
Request:  (empty)
Response: { message: "Logged out" }
Side Effect: Delete token cookie
```
