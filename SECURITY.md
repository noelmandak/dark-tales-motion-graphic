# Security policy

## Secrets

This project calls the ElevenLabs API with a key you provide.

- Keep the key in `.env` (git-ignored) or in your environment. **Never commit it.**
- The CLI never prints the key or voice ids. If you ever paste a key into an issue, a log or a commit, **revoke it immediately** in your ElevenLabs dashboard and create a new one.
- If a secret was committed by mistake, rotating the key is mandatory: deleting the commit does not make it private again.

## Generated and downloaded files

Generated audio and rendered videos are git-ignored. Treat any file you download for use in an episode as untrusted
until you know where it came from.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Report it privately through the repository's
**Security > Report a vulnerability** feature (GitHub private vulnerability reporting), or contact the maintainer directly.
Include what you found, how to reproduce it, and the impact. You will get a response as soon as practical.

## Scope

The engine renders local files and calls a third-party API with your key. Realistic issues include: leaking the key,
writing outside the project folder, or running unexpected code from episode data. The CLI only reads and writes
inside `public/episodes/`, `public/audio/`, `out/` and `src/episodes.ts`.
