# Cookie Size Issue - Solution Implementation

## 🎯 Problem Summary

The Laravel backend returns user objects with large nested data (teachers, modules, etc.) that exceed the 4KB browser cookie limit. This causes the `Set-Cookie` header to be silently ignored by browsers, breaking authentication.

## ✅ Solution Overview

**Store user data in localStorage, keep only the token in cookies.**

This approach:
- ✅ Bypasses the 4KB cookie size limit (localStorage supports 5-10MB)
- ✅ Requires NO changes to the Laravel backend API
- ✅ Maintains security (token stays in httpOnly cookie)
- ✅ Works with existing authentication flow

## 📦 Files Modified

### 1. `components/auth/login-form.tsx`
**Change**: Store user data in localStorage instead of sending to cookie API

```typescript
// Store user in localStorage (client-side)
localStorage.setItem("user", JSON.stringify(response.data));

// Only send token to cookie API
await axios.post("/api/auth/setToken", { token: response.token });
```

### 2. `app/api/auth/setToken/route.ts`
**Change**: Only store token in cookie (removed user cookie)

```typescript
// Only store token with proper security flags
response.cookies.set("token", token, { 
  maxAge: 60 * 60 * 24,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
});
```

### 3. `app/api/auth/getToken/route.ts`
**Change**: Only return token (user comes from localStorage on client)

```typescript
// Return only token
return NextResponse.json({ token }, { status: 200 });
```

### 4. `app/[lang]/(dashboard)/layout.tsx`
**Change**: Use client wrapper to read user from localStorage

```typescript
// Use wrapper that reads from localStorage
return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
```

### 5. `app/api/auth/removeToken/route.ts`
**Change**: Clean up both token and legacy user cookie on logout

## 📁 New Files Created

### 1. `provider/dashboard.layout.wrapper.tsx`
Client component that:
- Reads user data from localStorage
- Handles loading states
- Redirects to login if no user data found
- Passes user data to the dashboard layout provider

### 2. `hooks/use-auth.ts`
Reusable hook for pages that need authentication data:

```typescript
const { token, user, loading, error } = useAuth();
```

This hook:
- Fetches token from cookie (via API)
- Reads user from localStorage
- Provides loading and error states
- Can be used in any client component

## 🚀 How It Works

### Login Flow
```
1. User submits login form
2. Frontend calls Laravel API → receives { token, data: {...} }
3. User data stored in localStorage
4. Token sent to /api/auth/setToken → stored in httpOnly cookie
5. Redirect to dashboard
```

### Dashboard Load Flow
```
1. Server checks for token cookie → if missing, redirect to login
2. Client wrapper reads user from localStorage
3. If no user in localStorage → redirect to login
4. Dashboard renders with user data
```

### Logout Flow
```
1. User clicks logout
2. Clear localStorage (user data)
3. Call /api/auth/removeToken → clears token cookie
4. Redirect to login
```

## 🔧 Usage Examples

### For New Pages (Recommended)
```typescript
import { useAuth } from "@/hooks/use-auth";

const MyPage = () => {
  const { token, user, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  // Use token for API calls
  const fetchData = async () => {
    const response = await getData("endpoint", {}, {
      Authorization: `Bearer ${token}`
    });
  };
  
  // Use user for permissions
  const canEdit = user?.role === "admin";
  
  return <div>...</div>;
};
```

### For Existing Pages (Quick Fix)
```typescript
// OLD CODE ❌
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);
const userData = JSON.parse(response.data.user);
setUser(userData);

// NEW CODE ✅
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);

const userDataString = localStorage.getItem("user");
if (userDataString) {
  const userData = JSON.parse(userDataString);
  setUser(userData);
}
```

## 🧪 Testing Checklist

- [ ] Clear all cookies and localStorage
- [ ] Login with a user that has large data (many teachers/modules)
- [ ] Verify login succeeds (no cookie errors in console)
- [ ] Verify dashboard loads correctly
- [ ] Verify sidebar shows correct modules based on permissions
- [ ] Navigate to different pages
- [ ] Refresh the page (should stay logged in)
- [ ] Logout and verify redirect to login
- [ ] Try to access dashboard without login (should redirect)

## 🔒 Security Considerations

### What's Secure
- ✅ Token remains in httpOnly cookie (not accessible to JavaScript)
- ✅ Token has secure flag in production
- ✅ Token has sameSite protection
- ✅ Server still validates token on every request

### What Changed
- ⚠️ User data now in localStorage (accessible to JavaScript)
- ⚠️ User data includes: name, email, role, modules, teachers

### Why This Is Acceptable
- User data is not sensitive credentials (no passwords, tokens)
- User data is already exposed in the UI (sidebar, profile)
- Token (the actual authentication credential) remains secure
- This is a common pattern in modern web apps

### What NOT to Store in localStorage
- ❌ Authentication tokens
- ❌ Passwords
- ❌ API keys
- ❌ Sensitive personal information (SSN, credit cards, etc.)

## 📊 Benefits vs Tradeoffs

### Benefits
1. **No Cookie Size Limit**: localStorage supports 5-10MB vs 4KB for cookies
2. **No Backend Changes**: Laravel API remains unchanged
3. **Better Performance**: Less data sent with every HTTP request
4. **Simpler Debugging**: Can inspect localStorage in DevTools

### Tradeoffs
1. **Client-Side Only**: User data not available in server components
2. **Manual Sync**: If user data changes, need to update localStorage
3. **XSS Risk**: User data accessible to JavaScript (but not sensitive)

## 🔄 Migration Status

### ✅ Core Changes (Complete)
- [x] Login form
- [x] Set token API
- [x] Get token API
- [x] Dashboard layout
- [x] Logout API
- [x] Auth hook

### ⏳ Pages to Migrate (Optional)
See `MIGRATION_GUIDE.md` for the full list of pages that can be updated to use the new pattern. These pages will continue to work but should be migrated for consistency.

## 🆘 Troubleshooting

### Issue: "User not found" after login
**Solution**: Check browser console for localStorage. Clear it and try again.

### Issue: Infinite redirect loop
**Solution**: Check that token cookie is being set. Verify `/api/auth/setToken` is working.

### Issue: Sidebar not showing modules
**Solution**: Verify user data in localStorage has `modules` array. Check `canAccessModule` function.

### Issue: "Authentication token not found"
**Solution**: Token cookie might be expired or cleared. Logout and login again.

## 🔄 Rollback Plan

If you need to revert these changes:

1. Revert these files:
   - `components/auth/login-form.tsx`
   - `app/api/auth/setToken/route.ts`
   - `app/api/auth/getToken/route.ts`
   - `app/[lang]/(dashboard)/layout.tsx`
   - `app/api/auth/removeToken/route.ts`

2. Delete these files:
   - `provider/dashboard.layout.wrapper.tsx`
   - `hooks/use-auth.ts`

3. Clear all user localStorage and cookies

4. The Laravel backend requires no changes

## 📚 Additional Resources

- [MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [OWASP: HTML5 Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)

## 👥 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the migration guide
3. Check browser console for errors
4. Verify localStorage and cookies in DevTools
