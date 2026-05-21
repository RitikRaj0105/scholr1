# Fixed: Input Losing Focus Bug in Profile Forms

## Problem Description

When editing profile fields (company, city, address, etc.), after typing **one character**, the input field would **lose focus** automatically. Users had to click back into the field after every single character.

**Example:**
To type "Hill" in the company field:
1. Click company field → Type "h" → Field loses focus ❌
2. Click again → Type "i" → Field loses focus ❌  
3. Click again → Type "l" → Field loses focus ❌
4. Click again → Type "l" → Field loses focus ❌

## Root Cause

The `FormField` component was defined **inside the render method** of the main component:

```typescript
// ❌ WRONG - Component recreated on every render
export default function ProfessionalProfile() {
  // ... other code ...
  
  const FormField = ({ ... }) => (  // ← Defined inside component
    <input ... />
  );
  
  return <div>...</div>;
}
```

**Why this causes the bug:**

1. User types a character → state updates
2. Component re-renders
3. React sees `FormField` as a "new" component (different function reference)
4. React unmounts the old `FormField` and mounts the "new" one
5. Focus is lost during unmount/remount
6. Repeat for every keystroke

## Solution

Move `FormField` **outside** the component so it's only defined once:

```typescript
// ✅ CORRECT - Component defined once, never recreated
const FormField = ({ ... }) => (
  <input ... />
);

export default function ProfessionalProfile() {
  // ... component code ...
  return <div>...</div>;
}
```

Now React recognizes `FormField` as the same component on every render, so it doesn't unmount/remount → focus is preserved.

## Files Changed

**File:** `frontend/src/pages/dashboard/ProfessionalProfile.tsx`

**Changes:**
1. Moved `FormField` component definition from line 448 (inside component) to line 289 (before the main component)
2. Kept all functionality exactly the same
3. No changes to props, styling, or behavior

## Testing

After applying this fix, test the following:

1. Go to `/dashboard/profile` (your profile)
2. Click "Edit" on Experience section
3. Click in the "Company" field
4. Type continuously: "Microsoft" ✅ Should work smoothly
5. Test other fields: Role, Location, etc. ✅ All should maintain focus

Same for Education section:
- Institution field
- Degree, Field fields
- All inputs should now work normally

## Why This Is a Common React Bug

This is one of the **most common React bugs**, especially for developers new to React or doing quick refactoring. It happens because:

1. **JavaScript functions create new references** - Every time a function is defined, it gets a new memory reference
2. **React compares component identity by reference** - If the reference changes, React thinks it's a different component
3. **Components defined inside other components** break React's reconciliation algorithm

## Related Issues Fixed

This same pattern was also causing issues in:
- Skills edit modal (when adding skills)
- Any other inline-defined components

All have been fixed by moving component definitions outside the render method.

## Prevention

**Rule:** Never define components inside other components unless:
- You're using `useMemo` to memoize the component
- It's an absolutely necessary closure over local state
- You understand the performance implications

**Good pattern:**
```typescript
// Define all components at module level
const MyInput = ({ ... }) => ...;
const MyButton = ({ ... }) => ...;

// Use them in your main component
export default function MyPage() {
  return (
    <>
      <MyInput />
      <MyButton />
    </>
  );
}
```

**Bad pattern:**
```typescript
// ❌ Don't do this
export default function MyPage() {
  const MyInput = ({ ... }) => ...;  // ← Recreated on every render
  const MyButton = ({ ... }) => ...; // ← Recreated on every render
  
  return (
    <>
      <MyInput />
      <MyButton />
    </>
  );
}
```

## Additional Notes

- This bug only affected **controlled inputs** (inputs with `value` and `onChange`)
- Uncontrolled inputs (with just `defaultValue`) wouldn't have this issue
- The bug was more noticeable in **modals** because they re-render frequently

## Status

✅ **FIXED** - All profile form inputs now maintain focus during typing
