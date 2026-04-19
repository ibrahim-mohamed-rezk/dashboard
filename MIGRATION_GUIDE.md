# Cookie Size Issue - Migration Guide

## Problem
The Laravel backend returns user data that is too large (>4KB) to store in browser cookies, causing the Set-Cookie header to be ignored.

## Solution
Store user data in **localStorage** instead of cookies, keeping only the authentication token in cookies.

## Changes Made

### 1. Login Flow (`components/auth/login-form.tsx`)
- **Before**: Sent both token and user data to `/api/auth/setToken`
- **After**: Store user data in localStorage, only send token to API

```typescript
// Store user in localStorage
localStorage.setItem("user", JSON.stringify(response.data));

// Only send token to cookie API
await axios.post("/api/auth/setToken", { token: response.token });
```

### 2. Set Token API (`app/api/auth/setToken/route.ts`)
- **Before**: Stored both token and user in cookies
- **After**: Only stores token in cookie with proper security flags

```typescript
response.cookies.set("token", token, { 
  maxAge: 60 * 60 * 24,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
});
```

### 3. Get Token API (`app/api/auth/getToken/route.ts`)
- **Before**: Returned both token and user from cookies
- **After**: Only returns token from cookie (user comes from localStorage on client)

```typescript
return NextResponse.json({ token }, { status: 200 });
```

### 4. Dashboard Layout (`app/[lang]/(dashboard)/layout.tsx`)
- **Before**: Read user from cookie in server component
- **After**: Use client wrapper to read user from localStorage

```typescript
// Now uses DashboardLayoutWrapper which reads from localStorage
return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
```

### 5. New Files Created

#### `provider/dashboard.layout.wrapper.tsx`
Client component that reads user data from localStorage and passes it to the layout provider.

#### `hooks/use-auth.ts`
Reusable hook for pages that need both token and user data:

```typescript
const { token, user, loading, error } = useAuth();
```

### 6. Logout (`app/api/auth/removeToken/route.ts`)
Updated to clean up both token and legacy user cookie.

## Migration Steps for Existing Pages

Many pages currently fetch user data like this:

```typescript
// OLD PATTERN ❌
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);
const userData = JSON.parse(response.data.user);
setUser(userData);
```

### Option 1: Use the `useAuth` Hook (Recommended)
```typescript
import { useAuth } from "@/hooks/use-auth";

const MyPage = () => {
  const { token, user, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Use token and user directly
};
```

### Option 2: Manual Implementation
```typescript
// NEW PATTERN ✅
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);

// Get user from localStorage
const userDataString = localStorage.getItem("user");
if (userDataString) {
  const userData = JSON.parse(userDataString);
  setUser(userData);
}
```

## Pages That Need Migration

The following pages still use the old pattern and should be updated:

- `app/[lang]/(dashboard)/codes/page.tsx`
- `app/[lang]/(dashboard)/students/page.tsx`
- `app/[lang]/(dashboard)/places/page.tsx`
- `app/[lang]/(dashboard)/purchases/page.tsx`
- `app/[lang]/(dashboard)/settings/page.tsx`
- `app/[lang]/(dashboard)/levels/page.tsx`
- `app/[lang]/(dashboard)/subjects/page.tsx`
- `app/[lang]/(dashboard)/jobs/page.tsx`
- `app/[lang]/(dashboard)/courses/page.tsx`
- `app/[lang]/(dashboard)/coupons/page.tsx`
- `app/[lang]/(dashboard)/exams/exams-statistics/page.tsx`
- `app/[lang]/(dashboard)/teachers/page.tsx`
- `app/[lang]/(dashboard)/exams/page.tsx`
- `app/[lang]/(dashboard)/exams/questions-statistics/page.tsx`
- `app/[lang]/(dashboard)/books/page.tsx`
- `app/[lang]/(dashboard)/blogs/page.tsx`
- `app/[lang]/(dashboard)/teachers/teacher-groups/[teacherId]/page.tsx`
- `app/[lang]/(dashboard)/teachers/teacher-groups/[teacherId]/[groupId]/page.tsx`
- `app/[lang]/(dashboard)/books/[id]/page.tsx`
- `app/[lang]/(dashboard)/banks/page.tsx`
- `app/[lang]/(dashboard)/admins/page.tsx`
- `app/[lang]/(dashboard)/exams/questions-statistics-teacher/page.tsx`
- `app/[lang]/(dashboard)/banners/page.tsx`

## Benefits

1. **No Cookie Size Limit**: localStorage can store much larger data (typically 5-10MB)
2. **Better Security**: Token remains httpOnly in cookie, user data accessible only to client
3. **Simpler API**: Backend doesn't need to worry about cookie size limits
4. **No Backend Changes**: Laravel API remains unchanged

## Testing

1. Clear all cookies and localStorage
2. Login with a user that has large data (many teachers/modules)
3. Verify login succeeds and dashboard loads
4. Verify sidebar shows correct modules based on user permissions
5. Verify logout clears both cookie and localStorage

## Rollback Plan

If issues arise, you can revert by:
1. Reverting the 4 modified files
2. Deleting the 2 new files
3. The Laravel backend requires no changes
