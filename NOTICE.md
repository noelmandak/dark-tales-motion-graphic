# Third-party notices

This project's own code and documentation are released under the [MIT License](LICENSE).
It builds on the following third-party software and services, which have their own terms.
Nothing from them is copied into this repository; they are installed or called separately.

## Remotion (not MIT)

- Package: `remotion`, `@remotion/cli` and related packages, installed from npm (version pinned in `package.json`).
- License: the Remotion License. Free for individuals, for-profit organizations with up to 3 employees,
  non-profit organizations, and evaluation. A Company License is required for other for-profit organizations.
  Copying or modifying Remotion's code to sell, rent, license, relicense or sublicense a derivative of Remotion is not allowed.
- Full text: <https://github.com/remotion-dev/remotion/blob/main/LICENSE.md> (also in `node_modules/remotion/LICENSE.md` after `npm install`).
- This repository is an application that *uses* Remotion; it is not a fork or a derivative of Remotion's source.

## npm dependencies

React and React DOM (MIT), TypeScript (Apache-2.0), ESLint (MIT), Prettier (MIT), and their transitive dependencies,
each under its own license. Run `npm ls` or consult `package-lock.json` for the full list.

## ElevenLabs (service)

Voice-overs and sound effects are generated through the ElevenLabs API with the user's own API key and plan.
Generated audio is governed by ElevenLabs' terms and by the license of the voice used. It is **not** distributed
with this repository (`public/audio/` and `public/episodes/*/vo-*` are git-ignored). See `docs/audio-and-assets.md`.

## Images (collage look)

`public/collage/` contains a few archival images (paintings, engravings and prints by Laurens, Holbein, Piranesi and
Morin, scanned by the Metropolitan Museum of Art, the Rijksmuseum, the Library of Congress and others). Each was
verified through the Wikimedia Commons API as public domain or CC0 when it was added, and its title, creator,
licence, source URL and credit line are recorded in `public/collage/manifest.json`. Public-domain status can vary by
country; check the recorded source page before relying on an image in a way where that matters. Images added later with
`--allow-attribution` (CC BY / CC BY-SA) carry their own attribution requirements.

## Fonts

The renderer refers to system fonts by name (Georgia, Impact, Segoe UI, Courier New, Segoe Script) and falls back to
generic families. No font files are bundled or redistributed.

## Content

The example episodes are original retellings of historical events. Facts are credited per claim in each episode's
`meta.sources`. No third-party text, audio or video is included, and the only third-party images are the public-domain ones described above. Other visual elements (silhouettes, maps,
posters, cards) are original vector drawings made in code.

## Trademarks

Remotion, ElevenLabs and any other names mentioned belong to their owners. This project is not affiliated with or
endorsed by them.
