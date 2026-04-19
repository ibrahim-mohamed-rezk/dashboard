# Testing Checklist - Cookie Size Fix

## Pre-Testing Setup

- [ ] Backup current code (git commit)
- [ ] Clear browser cache
- [ ] Clear all cookies
- [ ] Clear localStorage: `localStorage.clear()`
- [ ] Open browser DevTools (F12)
- [ ] Go to Application tab → Storage

## 1. Login Flow Testing

### Test Case 1.1: Successful Login
- [ ] Navigate to `/auth/login`
- [ ] Enter valid credentials
- [ ] Click "Sign In"
- [ ] **Expected**: Redirect to `/dashboard`
- [ ] **Expected**: No errors in console
- [ ] **Expected**: No cookie size warnings

### Test Case 1.2: Verify Data Storage
After successful login, check:

**localStorage**:
- [ ] Open DevTools → Application → Local Storage
- [ ] Find key: `user`
- [ ] **Expected**: Contains JSON with user data
- [ ] **Expected**: Has `modules` array
- [ ] **Expected**: Has `teachers` array (if applicable)
- [ ] **Expected**: Has `full_name`, `email`, `role`

**Cookies**:
- [ ] Open DevTools → Application → Cookies
- [ ] Find cookie: `token`
- [ ] **Expected**: Contains JWT token
- [ ] **Expected**: Has `HttpOnly` flag
- [ ] **Expected**: Has `SameSite` flag
- [ ] **Expected**: No `user` cookie (old pattern)

**Console**:
```javascript
// Run in browser console
console.log('User:', JSON.parse(localStorage.getItem('user')));
console.log('Cookies:', document.cookie);
```

## 2. Dashboard Testing

### Test Case 2.1: Dashboard Loads
- [ ] Dashboard page renders
- [ ] No loading spinner stuck
- [ ] No redirect loop
- [ ] User name appears in header
- [ ] Profile picture shows (if available)

### Test Case 2.2: Sidebar Modules
- [ ] Sidebar renders correctly
- [ ] Modules show based on user permissions
- [ ] Click on different sections
- [ ] **Expected**: Correct modules visible
- [ ] **Expected**: No permission errors

### Test Case 2.3: Navigation
- [ ] Click on different menu items
- [ ] Navigate to various pages
- [ ] **Expected**: Pages load correctly
- [ ] **Expected**: No authentication errors

## 3. Session Persistence

### Test Case 3.1: Page Refresh
- [ ] While on dashboard, press F5 (refresh)
- [ ] **Expected**: Stay logged in
- [ ] **Expected**: Dashboard reloads
- [ ] **Expected**: No redirect to login

### Test Case 3.2: New Tab
- [ ] Open new tab
- [ ] Navigate to `/dashboard`
- [ ] **Expected**: Dashboard loads (already logged in)
- [ ] **Expected**: User data available

### Test Case 3.3: Browser Restart
- [ ] Close all browser windows
- [ ] Reopen browser
- [ ] Navigate to `/dashboard`
- [ ] **Expected**: Dashboard loads (session persists)

## 4. Logout Testing

### Test Case 4.1: Logout Flow
- [ ] Click on profile dropdown
- [ ] Click "تسجيل الخروج" (Logout)
- [ ] **Expected**: Redirect to `/auth/login`
- [ ] **Expected**: No errors in console

### Test Case 4.2: Verify Cleanup
After logout, check:

**localStorage**:
- [ ] Open DevTools → Application → Local Storage
- [ ] **Expected**: `user` key removed
- [ ] **Expected**: `authToken` key removed (if exists)

**Cookies**:
- [ ] Open DevTools → Application → Cookies
- [ ] **Expected**: `token` cookie removed

### Test Case 4.3: Access After Logout
- [ ] Try to access `/dashboard`
- [ ] **Expected**: Redirect to `/auth/login`
- [ ] **Expected**: Cannot access protected pages

## 5. Error Handling

### Test Case 5.1: Invalid Login
- [ ] Enter invalid credentials
- [ ] Click "Sign In"
- [ ] **Expected**: Error message shown
- [ ] **Expected**: Stay on login page
- [ ] **Expected**: No data in localStorage

### Test Case 5.2: Expired Token
- [ ] Login successfully
- [ ] Manually delete token cookie
- [ ] Try to access a page
- [ ] **Expected**: Redirect to login (or error message)

### Test Case 5.3: Corrupted localStorage
- [ ] Login successfully
- [ ] Manually corrupt user data:
  ```javascript
  localStorage.setItem('user', 'invalid json');
  ```
- [ ] Refresh page
- [ ] **Expected**: Redirect to login
- [ ] **Expected**: localStorage cleared

## 6. Large User Data Testing

### Test Case 6.1: User with Many Modules
- [ ] Login with user that has many modules
- [ ] **Expected**: Login succeeds
- [ ] **Expected**: No cookie size errors
- [ ] **Expected**: All modules show in sidebar

### Test Case 6.2: User with Many Teachers
- [ ] Login with user that has many teachers
- [ ] **Expected**: Login succeeds
- [ ] **Expected**: No cookie size errors
- [ ] **Expected**: Teacher data available

### Test Case 6.3: Verify Data Size
```javascript
// Run in browser console after login
const userData = localStorage.getItem('user');
console.log('User data size:', new Blob([userData]).size, 'bytes');
console.log('Cookie size limit:', 4096, 'bytes');
console.log('Is over limit?', new Blob([userData]).size > 4096);
```

## 7. Security Testing

### Test Case 7.1: Token Security
- [ ] Open DevTools → Application → Cookies
- [ ] Find `token` cookie
- [ ] **Expected**: `HttpOnly` flag is set
- [ ] **Expected**: `Secure` flag is set (production)
- [ ] **Expected**: `SameSite` is set to `Lax`

### Test Case 7.2: Token Not Accessible
```javascript
// Run in browser console
console.log('Can access token?', document.cookie.includes('token'));
// Expected: false (because it's httpOnly)
```

### Test Case 7.3: User Data Accessible
```javascript
// Run in browser console
console.log('Can access user?', localStorage.getItem('user') !== null);
// Expected: true (this is intentional)
```

## 8. Cross-Browser Testing

Test on multiple browsers:

### Chrome/Edge
- [ ] Login works
- [ ] Dashboard loads
- [ ] Logout works

### Firefox
- [ ] Login works
- [ ] Dashboard loads
- [ ] Logout works

### Safari (if available)
- [ ] Login works
- [ ] Dashboard loads
- [ ] Logout works

## 9. Performance Testing

### Test Case 9.1: Login Speed
- [ ] Time the login process
- [ ] **Expected**: Similar or faster than before
- [ ] **Expected**: No noticeable delay

### Test Case 9.2: Page Load Speed
- [ ] Time dashboard load
- [ ] **Expected**: Similar or faster than before
- [ ] **Expected**: No additional loading time

## 10. Console Checks

Throughout all tests, monitor browser console for:

### Should NOT See:
- ❌ Cookie size warnings
- ❌ "Set-Cookie header ignored" errors
- ❌ Authentication errors (except when testing error cases)
- ❌ JSON parse errors
- ❌ Undefined user errors

### Should See:
- ✅ Successful API calls
- ✅ Clean console (no errors)
- ✅ Proper redirects

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
User Type: ___________ (admin/teacher/etc.)

Test Results:
- Login Flow: ☐ Pass ☐ Fail
- Dashboard Load: ☐ Pass ☐ Fail
- Sidebar Modules: ☐ Pass ☐ Fail
- Session Persistence: ☐ Pass ☐ Fail
- Logout: ☐ Pass ☐ Fail
- Large Data: ☐ Pass ☐ Fail
- Security: ☐ Pass ☐ Fail

Issues Found:
1. ___________
2. ___________
3. ___________

Notes:
___________
___________
```

## Quick Verification Script

Run this in browser console after login:

```javascript
// Quick verification script
const verify = () => {
  const user = localStorage.getItem('user');
  const hasToken = document.cookie.includes('token');
  const userSize = user ? new Blob([user]).size : 0;
  
  console.log('=== Cookie Size Fix Verification ===');
  console.log('✓ User in localStorage:', !!user);
  console.log('✓ Token in cookie:', hasToken);
  console.log('✓ User data size:', userSize, 'bytes');
  console.log('✓ Over cookie limit?', userSize > 4096);
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log('✓ User data valid JSON:', true);
      console.log('✓ Has modules:', !!userData.modules);
      console.log('✓ Module count:', userData.modules?.length || 0);
    } catch (e) {
      console.error('✗ User data invalid JSON:', e);
    }
  }
  
  console.log('=== End Verification ===');
};

verify();
```

## Success Criteria

All tests pass if:
- ✅ Login works with large user data
- ✅ No cookie size errors
- ✅ Dashboard loads correctly
- ✅ Sidebar shows correct modules
- ✅ Session persists on refresh
- ✅ Logout clears all data
- ✅ No console errors
- ✅ Security flags are set correctly

## If Tests Fail

1. Check browser console for errors
2. Verify localStorage has user data
3. Verify cookie has token
4. Review `COOKIE_SIZE_FIX_README.md` troubleshooting section
5. Check `IMPLEMENTATION_SUMMARY.md` for rollback plan
