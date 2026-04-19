# Quick Start Guide - Cookie Size Fix

## 🚀 What Changed?

User data is now stored in **localStorage** instead of cookies to avoid the 4KB browser cookie size limit.

## ✅ What You Need to Know

### 1. Login Still Works the Same
Users login normally - no changes to the login form UI or flow.

### 2. User Data Location Changed
- **Before**: User data in cookie (broken due to size)
- **After**: User data in localStorage (works perfectly)
- **Token**: Still in httpOnly cookie (secure)

### 3. No Backend Changes Required
Your Laravel API doesn't need any modifications.

## 📝 For Developers

### If You're Writing New Code

Use the `useAuth` hook:

```typescript
import { useAuth } from "@/hooks/use-auth";

const MyComponent = () => {
  const { token, user, loading, error } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Welcome {user?.full_name}</h1>
      {/* Use token for API calls */}
    </div>
  );
};
```

### If You're Updating Existing Code

Find this pattern:
```typescript
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);
const userData = JSON.parse(response.data.user); // ❌ This won't work anymore
```

Replace with:
```typescript
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);

// Get user from localStorage instead
const userDataString = localStorage.getItem("user");
if (userDataString) {
  const userData = JSON.parse(userDataString);
  setUser(userData);
}
```

## 🧪 Testing

1. **Clear everything first**:
   ```javascript
   // In browser console
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

2. **Login**: Should work without errors

3. **Check localStorage**:
   ```javascript
   // In browser console
   JSON.parse(localStorage.getItem("user"))
   ```
   Should show your user object with all data

4. **Refresh page**: Should stay logged in

5. **Logout**: Should clear everything and redirect to login

## 🔍 Debugging

### Check if user data is stored:
```javascript
// Browser console
localStorage.getItem("user")
```

### Check if token cookie is set:
```javascript
// Browser console
document.cookie
```

### Common Issues:

**"User not found" after login**
- Clear localStorage and try again
- Check browser console for errors

**Infinite redirect loop**
- Token cookie might not be set
- Check `/api/auth/setToken` response

**Sidebar not showing**
- Check user data has `modules` array
- Verify `localStorage.getItem("user")` in console

## 📚 More Information

- **Full documentation**: See `COOKIE_SIZE_FIX_README.md`
- **Migration guide**: See `MIGRATION_GUIDE.md`
- **Flow diagrams**: See `docs/auth-flow-diagram.md`

## 🆘 Need Help?

1. Check browser console for errors
2. Verify localStorage has user data
3. Verify cookies have token
4. Review the troubleshooting section in `COOKIE_SIZE_FIX_README.md`
