# Explaining Render behavior when Dockerfile changes

## Render deployment triggers
- Render watches the **`main` (or configured) branch** of your repository.
- Whenever you push a new commit that changes any file that is part of the **build context** (for a web service or worker), Render automatically enqueues a new build.
- If you add/modify the `Dockerfile` itself, that is considered part of the context and will force a rebuild.

## Build cache and Dockerfile edits
- Render keeps an internal build cache keyed by the full contents of the `Dockerfile` and the files it copies.
- If the `Dockerfile` changes but the rest of the context is identical, Render may use the cache for unchanged layers, but it *always* runs the posted `docker build` steps to pick up the new instructions.

## How to trigger a rebuild
1. **Edit & Commit** the `Dockerfile` (or any file in the repo).  Example: `git commit -m "Updated Dockerfile"`.
2. **Push** the commit (`git push origin main`).
   - Render receives the push via webhook and schedules the build.
3. No manual action needed; the build starts automatically.

## Manual rebuild option
- In the Render dashboard, you can also click **"Rebuild"** or **"Clear Cache & Redeploy"** to force a rebuild, even if you didn't change any file.  This is useful when cache corruption or other issues occur.

## Summary
Yes, **pushing a commit that modifies the Dockerfile automatically triggers a rebuild** on Render.  The build will use the new Dockerfile you just pushed, but it still may hit the cache for layers that haven't changed.

If you want to force a full rebuild ignoring cache, you can use the **"Clear Cache & Redeploy"** button on the Render UI distinct from a normal push.

Hope this clarifies the process!
