# Release Workflow

This project uses [Changesets](https://github.com/changesets/changesets) for automated versioning and publishing.

## For Contributors

When you make changes that should be released, create a changeset:

```bash
pnpm changeset:add
```

This will:
1. Prompt you to select which packages changed
2. Ask for the type of change (patch/minor/major)
3. Ask for a description of the change
4. Create a markdown file in `.changeset/`

Commit this file with your pull request.

## For Release Managers

### Step 1: Review and Merge Pull Requests

Ensure all feature PRs are merged to `main` with their changeset files.

### Step 2: Create Release PR (automatic)

When changesets are merged to `main`, GitHub Actions automatically:
1. Reads all changeset files
2. Bumps package versions in all `package.json` files
3. Updates `CHANGELOG.md` files
4. Creates a "Release" PR titled "chore: release packages"

Review the Release PR for:
- Version bumps are appropriate
- Changelog entries are clear
- All packages that changed are included

### Step 3: Merge Release PR (automatic publishing)

When the Release PR is merged:
1. GitHub Actions runs `pnpm release` which:
   - Runs `pnpm build` to ensure everything builds
   - Publishes all packages to npm via `changeset publish`
   - Removes changeset files
2. Creates a GitHub Release with auto-generated notes

## Local Commands

### Create a changeset
```bash
pnpm changeset:add
```

### Version all packages (local testing)
```bash
pnpm changeset:version
```

### Publish packages (local testing)
```bash
pnpm changeset:publish
```

### Complete release cycle (local)
```bash
pnpm release
```

## What Changesets Does

- **Deterministic versioning**: Each package versioned independently based on actual changes
- **CHANGELOG.md**: Auto-generated from changeset descriptions
- **Dependency updates**: Internal dependency versions updated automatically
- **Git integration**: Creates release commits and tags

## FAQ

**Q: What if I need to release multiple packages?**
A: Changesets handles this automatically. Each package with changes is versioned and published independently.

**Q: Can I skip creating a changeset?**
A: Only for changes that shouldn't be released (docs, CI, examples). All package changes should have a changeset.

**Q: How do I add a changeset after my PR is already open?**
A: Just run `pnpm changeset:add` again and commit the new file(s).

**Q: What about pre-releases or beta versions?**
A: Edit the changeset markdown files in `.changeset/` before the Release PR is merged, or use changesets' pre-release mode for advanced workflows.

## Environment Variables

The GitHub Actions workflow uses:
- `NPM_TOKEN`: Required for publishing to npm (configured in repository settings)
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

Both tokens need appropriate permissions set up in your repository settings.
