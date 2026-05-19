# tsconfig hotfix — remove deprecated baseUrl

TypeScript 7.0 will drop `baseUrl`. The warning was harmless but noisy.

## What changed

Removed `"baseUrl": "."` from `frontend/tsconfig.json`. The `paths` mapping still works because:
- Modern TypeScript (4.1+) resolves `paths` relative to the tsconfig.json directory
- Your vite.config.ts has its own alias `'@': path.resolve(__dirname, './src')` which handles runtime imports
- So `@/store/authStore` etc. continue to work in both type-checking and at runtime

## Install

```powershell
Expand-Archive C:\Users\rraj8\Downloads\scholr-tsconfig-fix.zip -DestinationPath C:\Users\rraj8\scholr -Force
```

That's it. Reload your editor / TypeScript server — warning gone.

If you don't see the warning go away immediately in VS Code:
- Press `Ctrl+Shift+P`
- Type "TypeScript: Restart TS Server"
- Press Enter
