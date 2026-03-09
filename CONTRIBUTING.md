# FinanceME — GitHub Collaboration Guide

This guide explains how to use Git and GitHub to work on this project as a team. Follow these steps carefully so we don't overwrite each other's work!

---

## 📋 Table of Contents

1. [First-Time Setup](#1-first-time-setup)
2. [Cloning the Repo](#2-cloning-the-repo)
3. [Daily Workflow (The Golden Rule)](#3-daily-workflow-the-golden-rule)
4. [Branching Strategy](#4-branching-strategy)
5. [Making Changes & Committing](#5-making-changes--committing)
6. [Pushing & Pull Requests](#6-pushing--pull-requests)
7. [Reviewing Pull Requests](#7-reviewing-pull-requests)
8. [Handling Merge Conflicts](#8-handling-merge-conflicts)
9. [File Ownership — Who Works on What](#9-file-ownership--who-works-on-what)
10. [Common Git Commands Cheat Sheet](#10-common-git-commands-cheat-sheet)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. First-Time Setup

Before anything else, install Git and set your identity.

### Install Git
- **Windows:** Download from [git-scm.com](https://git-scm.com/download/win) and install
- **macOS:** Run `xcode-select --install` in Terminal
- **Linux:** Run `sudo apt install git`

### Set Your Name & Email
Open a terminal and run these (use your **real name** and **GitHub email**):

```bash
git config --global user.name "Your Full Name"
git config --global user.email "your-email@example.com"
```

### (Optional) Set VS Code as Your Default Editor
```bash
git config --global core.editor "code --wait"
```

---

## 2. Cloning the Repo

Once someone creates the repository on GitHub:

```bash
# Clone the repo to your computer
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Move into the project folder
cd YOUR-REPO-NAME
```

> **Replace** `YOUR-USERNAME/YOUR-REPO-NAME` with the actual GitHub repo URL.  
> You only do this once. After cloning, the folder is linked to GitHub.

---

## 3. Daily Workflow (The Golden Rule)

**⚠️ ALWAYS pull before you start working!** This gets everyone else's latest changes.

```bash
# Step 1: Go to the main branch
git checkout main

# Step 2: Pull the latest changes from GitHub
git pull origin main

# Step 3: Create your own branch (see section 4)
git checkout -b your-branch-name

# Step 4: Do your work, save files

# Step 5: Stage, commit, push (see section 5 & 6)
```

> **Never work directly on `main`!** Always create a branch first.

---

## 4. Branching Strategy

Each person works on their own **branch**. We use this naming pattern:

```
feature/page-name
```

### Examples:
| Team Member | Working On | Branch Name |
|-------------|-----------|-------------|
| Raoof | Dashboard page | `feature/dashboard` |
| Mohab | Transactions page | `feature/transactions` |
| Yassa | Budgets page | `feature/budgets` |
| Mohamed | Goals page | `feature/goals` |
| Team | Shared bug fix | `fix/sidebar-bug` |

### Creating a Branch:
```bash
# Make sure you're on main and up to date first!
git checkout main
git pull origin main

# Create and switch to your new branch
git checkout -b feature/your-page-name
```

### Switching Between Branches:
```bash
# See all branches
git branch

# Switch to a different branch
git checkout feature/dashboard

# Switch back to main
git checkout main
```

---

## 5. Making Changes & Committing

After you've made changes to your files:

### Check What Changed:
```bash
# See which files were modified
git status

# See the actual line-by-line changes
git diff
```

### Stage Your Changes:
```bash
# Stage a specific file
git add pages/budgets.html

# Stage all changed files at once
git add .
```

### Commit with a Clear Message:
```bash
git commit -m "Add budget progress cards to budgets page"
```

### Commit Message Rules:
Write messages that tell your team **what you did**, not what files you touched.

```bash
# ✅ Good commit messages
git commit -m "Add transaction filter bar with date and category dropdowns"
git commit -m "Fix sidebar not highlighting active page on mobile"
git commit -m "Style budget cards with progress bars matching design doc"

# ❌ Bad commit messages
git commit -m "update"
git commit -m "fixed stuff"
git commit -m "changes"
git commit -m "asdfjkl"
```

### Tips:
- **Commit often** — small commits are easier to review and fix
- **One feature per commit** — don't bundle unrelated changes
- Don't commit half-broken code to `main` (that's what branches are for!)

---

## 6. Pushing & Pull Requests

### Push Your Branch to GitHub:
```bash
git push origin feature/your-page-name
```

The first time you push a new branch, Git might suggest a longer command:
```bash
git push --set-upstream origin feature/your-page-name
```

### Create a Pull Request (PR):
1. Go to the repo on **GitHub.com**
2. You'll see a yellow banner saying your branch was just pushed — click **"Compare & pull request"**
3. Fill in:
   - **Title:** Short description (e.g., "Add Budgets page with progress bars")
   - **Description:** What you built, any notes for reviewers
4. Set a **reviewer** (another team member)
5. Click **"Create pull request"**

### After the PR is Approved:
1. Click **"Merge pull request"** on GitHub
2. Click **"Delete branch"** (keeps things clean)
3. On your computer, switch back to main and pull:
   ```bash
   git checkout main
   git pull origin main
   ```

---

## 7. Reviewing Pull Requests

When a teammate asks you to review their PR:

1. Go to the repo on GitHub → **Pull Requests** tab
2. Click on the PR to open it
3. Go to the **"Files changed"** tab to see what they modified
4. Look for:
   - Are they using `var(--color-name)` instead of hard-coded colors?
   - Are money amounts using monospace classes?
   - Does the layout use the grid system?
   - Does it look right on mobile? (resize your browser to check)
5. Leave comments or click **"Approve"**

---

## 8. Handling Merge Conflicts

**What's a merge conflict?** It happens when two people edited the **same lines** in the **same file**. Git doesn't know whose version to keep, so it asks you to decide.

### When It Happens:
You'll see this when trying to merge or pull:
```
CONFLICT (content): Merge conflict in css/components.css
Automatic merge failed; fix conflicts and then commit.
```

### How to Fix It:
1. Open the file with the conflict. You'll see markers like this:
   ```
   <<<<<<< HEAD
   Your version of the code
   =======
   Their version of the code
   >>>>>>> feature/other-branch
   ```

2. **Decide** which version to keep (or combine both). Delete the markers:
   ```
   The final version you want to keep
   ```

3. Save the file, then:
   ```bash
   git add .
   git commit -m "Resolve merge conflict in components.css"
   ```

### How to AVOID Conflicts:
- **Don't edit shared files** (`variables.css`, `sidebar.html`, etc.) without telling the team
- **Pull often** — the longer you wait, the more conflicts you'll have
- **Each person works on their own page file** — this is the #1 way to avoid conflicts

---

## 9. File Ownership — Who Works on What

To avoid conflicts, follow these rules:

### 🔒 Shared Files (Don't Edit Alone!)
These files affect everyone. If you need to change them, **tell the team first** and make a separate PR:

| File | What It Controls |
|------|-----------------|
| `css/variables.css` | Design tokens — colors, fonts, spacing |
| `css/base.css` | Typography, reset, global defaults |
| `css/components.css` | Button styles, card styles, etc. |
| `css/layout.css` | Sidebar, grid, responsive breakpoints |
| `components/sidebar.html` | The shared navigation sidebar |
| `components/header.html` | The shared top bar |
| `components/footer.html` | The shared footer |
| `js/utils.js` | Shared helper functions |
| `js/sidebar.js` | Sidebar behavior |
| `js/header.js` | Header/footer behavior |

### ✅ Your Own Files (Edit Freely!)
Each team member should **only edit their own page files**:

```
pages/
├── dashboard.html       ← Person A
├── transactions.html    ← Person B
├── budgets.html         ← Person C
├── goals.html           ← Person D
├── accounts.html        ← Person E
├── reports.html         ← Person F
└── ...
```

If you need a **page-specific CSS file**, create it as:
```
css/pages/your-page-name.css
```

---

## 10. Common Git Commands Cheat Sheet

| What You Want | Command |
|---------------|---------|
| Check current branch | `git branch` |
| See what's changed | `git status` |
| Pull latest from GitHub | `git pull origin main` |
| Create a new branch | `git checkout -b feature/name` |
| Switch to a branch | `git checkout branch-name` |
| Stage all changes | `git add .` |
| Commit with message | `git commit -m "your message"` |
| Push to GitHub | `git push origin branch-name` |
| See commit history | `git log --oneline -10` |
| Undo last commit (keep files) | `git reset --soft HEAD~1` |
| Discard all local changes | `git checkout -- .` |
| Delete a local branch | `git branch -d branch-name` |

---

## 11. Troubleshooting

### "I committed to `main` by accident!"
```bash
# Undo the last commit but keep your changes
git reset --soft HEAD~1

# Create a branch and move your changes there
git checkout -b feature/your-page-name

# Now commit on the new branch instead
git add .
git commit -m "Your message"
git push origin feature/your-page-name
```

### "I pulled and got a ton of conflicts!"
Don't panic. Open each conflicted file, look for the `<<<<<<< HEAD` markers, pick the right version, delete the markers, save, and then `git add . && git commit`.

### "My branch is behind main and I need the latest changes"
```bash
# On your feature branch, pull main into it
git checkout feature/your-page-name
git merge main
# Fix any conflicts if they appear
```

### "I want to throw away ALL my local changes and start fresh"
```bash
git checkout main
git pull origin main
git checkout -b feature/fresh-start
```

### "I accidentally deleted a file!"
```bash
# Restore a specific file from the last commit
git checkout HEAD -- path/to/deleted-file.html
```

---

## ⚡ Quick Start Summary

```bash
# 1. Clone (first time only)
git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
cd YOUR-REPO-NAME

# 2. Always start fresh from main
git checkout main
git pull origin main

# 3. Make your branch
git checkout -b feature/your-page-name

# 4. Do your work... edit files... save...

# 5. Commit your work
git add .
git commit -m "Describe what you did"

# 6. Push to GitHub
git push origin feature/your-page-name

# 7. Go to GitHub.com → Create Pull Request → Get reviewed → Merge!
```

**That's it! Happy coding, team! 🚀**
