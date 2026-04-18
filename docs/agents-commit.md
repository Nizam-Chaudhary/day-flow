## Commit Messages

- Follow Conventional Commits (enforced by commitlint)
- Format: `type(scope): short description`
- Keep messages clear and concise
- Use types like: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`

Example:

- `feat(auth): add login endpoint`
- `fix(api): handle null response`

---

## Pre-commit (Husky + lint-staged)

- Pre-commit hooks are already configured
- `lint-staged` runs linting and formatting on staged files
- Do not bypass hooks

---

## Linting & Formatting

- Follow existing lint and format rules
- Fix issues before committing
- Avoid changing unrelated files

---

## Workflow

1. Make changes
2. Stage only required files
3. Commit (hooks will run automatically)
4. Fix any lint/format errors if they fail
