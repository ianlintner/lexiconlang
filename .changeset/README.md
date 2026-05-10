# Changesets

This directory contains changeset files that describe version changes and release notes for the monorepo.

## Workflow

1. **Create a changeset** when making changes that should be released:
   ```bash
   pnpm changeset:add
   ```
   This opens an interactive prompt to select which packages changed and describe the changes.

2. **Review the changeset** in a pull request. The changeset file will be committed to your branch.

3. **Merge to main** - the GitHub Actions workflow will create a Release PR that:
   - Bumps package versions
   - Updates changelogs
   - Lists all changes since the last release

4. **Review & merge the Release PR** - this triggers publishing to npm and GitHub releases.

## Changeset Versions

- **patch** - Bug fixes and minor improvements
- **minor** - New features, backwards compatible
- **major** - Breaking changes

See the [Changesets documentation](https://github.com/changesets/changesets) for more details.
