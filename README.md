# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Development

```sh
bun install
bun run dev
bun run build
bun run preview
```

## Poetry

Poetry lines come from [PoetryDB](https://poetrydb.org/). If the request fails or
times out, the bundled collection in `src/data/poetryLines.ts` is used instead.

## Birthday Mode

Birthday Mode flashes the purple party hat pom-pom yellow-white on the three
countdown beats before launching confetti.

## Choo-Choo Mode

Choo-Choo Mode has absolutely nothing to do with trains. It gives Peanut a
small, frosty-white handlebar mustache and pointy goatee with chunky cartoon
yeti fuzz. Both wiggle while idle and flail during bounces and jumps.

## Cowboy boots (temporarily disabled)

Cowboy Mode includes procedural boots with tapered ankles, lined scalloped collars,
rounded western toes, and underslung heels (`src/utils/cowboyBoots.ts`). They are
currently disabled while their geometry and fit are refined.

## Audio

`public/audio/cowboy-yodel.mp3` is an edited excerpt of
[“Yodel” by Astounded](https://freesound.org/people/Astounded/sounds/484841/),
a human vocal performance released under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

Entering Cowboy Mode starts the yodel directly from the activating click or
keyboard event so playback remains permitted by mobile browser audio policies.
GitHub Pages supplies the repository base path during the build; Vite normalizes
it with a trailing slash so runtime-loaded audio resolves under that path.

While the yodel plays, musical notes rise around Peanut's mouth and cowboy hat.
Reduced-motion preferences keep the notes visible without the floating animation.
