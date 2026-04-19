# Automated Migration Script for Auth Pages

This document provides search-and-replace patterns to migrate all pages from the old auth pattern to the new one.

## Pattern 1: Replace the getToken API call

### Find:
```typescript
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);
const userData = JSON.parse(response.data.user);
```

### Replace with:
```typescript
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);

// Get user from localStorage
const userDataString = localStorage.getItem("user");
if (userDataString) {
  const userData = JSON.parse(userDataString);
```

## Pattern 2: For pages that only need token (not user)

### Find:
```typescript
const response = await axios.get("/api/auth/getToken");
setToken(response.data.token);
```

### Keep as is - these pages are already compatible!

## Alternative: Use the useAuth Hook

For pages that need both token and user, consider replacing the entire useEffect with:

### Before:
```typescript
const [token, setToken] = useState("");
const [user, setUser] = useState<User | null>(null);

useEffect(() => {
  const fetchToken = async () => {
    try {
      const response = await axios.get("/api/auth/getToken");
      setToken(response.data.token);
      const userData = JSON.parse(response.data.user);
      setUser(userData);
    } catch (error) {
      console.error("Error fetching token:", error);
    }
  };
  fetchToken();
}, []);
```

### After:
```typescript
import { useAuth } from "@/hooks/use-auth";

const { token, user, loading, error } = useAuth();

// Remove the useState and useEffect for token/user
```

## Manual Steps

Since this is a TypeScript/React project with varying patterns, here's the recommended approach:

1. **Test the core changes first**: Login and verify the dashboard loads correctly
2. **Migrate pages one by one**: Start with critical pages
3. **Use the useAuth hook** for new pages or major refactors
4. **Use the manual pattern** for quick fixes to existing pages

## Example Migration

See `app/[lang]/(dashboard)/settings/page.tsx` for a reference implementation (if updated).
