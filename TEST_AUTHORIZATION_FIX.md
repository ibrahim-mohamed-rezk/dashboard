# Test Authorization Fix

## Quick Test Steps

### 1. Clear Everything
```javascript
// Run in browser console
localStorage.clear();
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUCString() + ";path=/");
});
```

### 2. Login
- Go to `/auth/login`
- Enter credentials
- Click "Sign In"
- **Expected**: Redirect to dashboard (no errors)

### 3. Verify Data Storage
```javascript
// Run in browser console
console.log('=== Authorization Fix Verification ===');
console.log('1. User in localStorage:', !!localStorage.getItem('user'));
console.log('2. Token in cookie:', document.cookie.includes('token'));

const user = JSON.parse(localStorage.getItem('user'));
console.log('3. User data:', user);
console.log('4. User modules:', user?.modules);
console.log('5. User role:', user?.role);
console.log('=== End Verification ===');
```

### 4. Test Pages
Visit these pages and verify they load without "ليس لديك صلاحية" error:

#### Admin Pages (if you're admin)
- [ ] `/dashboard` - Dashboard
- [ ] `/settings` - Settings
- [ ] `/admins` - Admins
- [ ] `/teachers` - Teachers
- [ ] `/students` - Students
- [ ] `/banners` - Banners
- [ ] `/blogs` - Blogs
- [ ] `/books` - Books

#### Academic Setup
- [ ] `/subjects` - Subjects
- [ ] `/levels` - Levels
- [ ] `/places` - Places
- [ ] `/jobs` - Jobs

#### Operations
- [ ] `/courses` - Courses
- [ ] `/codes` - Codes
- [ ] `/coupons` - Coupons
- [ ] `/purchases` - Purchases

#### Exams
- [ ] `/exams` - Exams
- [ ] `/exams/exams-statistics` - Exam Statistics
- [ ] `/exams/questions-statistics` - Question Statistics
- [ ] `/banks` - Question Banks

### 5. Test Authorization
Try to access a page you DON'T have permission for:
- **Expected**: See "ليس لديك صلاحية لعرض هذه الصفحة"
- This confirms authorization is working correctly

### 6. Test Sidebar
- [ ] Sidebar shows correct modules
- [ ] Only authorized sections visible
- [ ] Click different sections
- [ ] Pages load correctly

### 7. Test Refresh
- [ ] Refresh the page (F5)
- [ ] **Expected**: Stay logged in
- [ ] **Expected**: Page reloads correctly
- [ ] **Expected**: No authorization errors

### 8. Test Logout
- [ ] Click profile dropdown
- [ ] Click "تسجيل الخروج"
- [ ] **Expected**: Redirect to login
- [ ] **Expected**: localStorage cleared
- [ ] **Expected**: Cannot access dashboard

## Common Issues & Solutions

### Issue: "ليس لديك صلاحية" on all pages
**Cause**: User data not in localStorage
**Solution**: 
```javascript
// Check if user data exists
console.log(localStorage.getItem('user'));
// If null, logout and login again
```

### Issue: Sidebar empty
**Cause**: User modules not loaded
**Solution**:
```javascript
// Check modules
const user = JSON.parse(localStorage.getItem('user'));
console.log(user?.modules);
// Should show array of modules
```

### Issue: Some pages work, others don't
**Cause**: Specific page authorization check
**Solution**: Check which module the page requires and verify user has it

### Issue: Admin features not showing
**Cause**: Role not set correctly
**Solution**:
```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('Role:', user?.role);
// Should be 'admin' for admin users
```

## Success Criteria

✅ Login works without errors
✅ User data in localStorage
✅ Token in cookie
✅ Dashboard loads
✅ Sidebar shows correct modules
✅ Authorized pages load
✅ Unauthorized pages show permission error
✅ Refresh keeps session
✅ Logout clears data

## If All Tests Pass

The authorization fix is working correctly! The cookie size issue is resolved and all pages can access user data from localStorage.

## If Tests Fail

1. Check browser console for errors
2. Verify localStorage has user data
3. Verify user has required modules
4. Check `PAGES_MIGRATION_COMPLETE.md` for details
5. Review `COOKIE_SIZE_FIX_README.md` for troubleshooting
