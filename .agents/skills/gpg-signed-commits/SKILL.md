---
name: gpg-signed-commits
description: >-
  Creates cryptographically GPG-signed git commits with strict line-length
  formatting: max 64-character title, detailed body with max 80 characters per
  line, and sign-off / co-author trailers. Use when committing code changes,
  rebasing, or crafting standardized git commits.
---

# GPG-Signed Commits & Formatting Standard

This skill defines the mandatory protocol for authoring Git commits in this
codebase. Every commit must be logically partitioned, thoroughly documented,
cryptographically signed via GPG, and attributed with standard trailers.

---

## 1. Commit Message Structure & Constraints

Every commit message must follow this exact anatomy:

```text
<type>(<scope>): <concise subject header - max 64 characters>

<Detailed description explaining what was changed and why. Provide bullet
points or structured paragraphs detailing all functional modifications,
architectural decisions, and affected files. Ensure each line is strictly
wrapped to a maximum width of 80 characters.>

Signed-off-by: AgilePlaya <60707646+AgilePlaya@users.noreply.github.com>
Co-authored-by: Gemini <gemini@google.com>
```

### Formatting Rules:

1. **Header Line (Subject)**:
   - **Maximum 64 characters** (hard ceiling).
   - Use conventional commit types: `feat`, `fix`, `docs`, `style`, `refactor`,
     `perf`, `test`, `build`, `ci`, `chore`.
   - Imperative, present tense, lowercase summary without trailing period.
2. **Blank Separation Line**:
   - Exactly one blank line between header and body.
3. **Commit Body**:
   - Provide comprehensive context on the change, background, and mechanics.
   - **Maximum 80 characters per line** (hard ceiling). Break long sentences
     and lists across lines manually.
4. **Blank Separation Line**:
   - Exactly one blank line between body and trailers.
5. **Git Trailers**:
   - `Signed-off-by: AgilePlaya <60707646+AgilePlaya@users.noreply.github.com>`
   - `Co-authored-by: Gemini <gemini@google.com>`

---

## 2. GPG Signing Configuration & Execution

All commits must be cryptographically verified.

### Prerequisite Checks:

1. **Verify GPG Binary**:
   Ensure `git config --global gpg.program` points to the executable:
   ```powershell
   git config --global gpg.program "F:/Programs/Git/usr/bin/gpg.exe"
   ```
2. **Keybox Daemon Fix on Windows (Git for Windows)**:
   GnuPG 2.4.x bundled with Git for Windows can fail with `keyboxd not installed`.
   Ensure `C:\Users\<user>\.gnupg\common.conf` has `# use-keyboxd` disabled so
   it defaults to `pubring.kbx`.
3. **Configure Signing Key**:
   ```powershell
   git config --global user.signingkey 155D18DE49EBA3D1
   git config --global commit.gpgsign true
   ```

### Executing a Signed Commit:

To prevent shell escaping and line-break mangling, write the formatted commit
message to a temporary text file, then invoke Git with `-F`:

```powershell
git commit -S -F "path/to/commit-message.txt"
```

---

## 3. Verification Protocol

Always verify the commit signature immediately after committing:

```powershell
git log -1 --show-signature
```

Confirm the output displays:
`gpg: Good signature from "AgilePlaya <60707646+AgilePlaya@users.noreply.github.com>"`
