## Git hooks

The project contains a pre-commit git hook which checks the code with Prettier and a pre-push hook for checking TSLint. That prevents committing if there is a prettier problem in the code. You can disable these hooks by adding `--no-verify` flag to your `git commit` or `git push` command.
