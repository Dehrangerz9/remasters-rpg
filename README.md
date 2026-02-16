# remasters-rpg

Starter scaffold for a Foundry VTT v13 system.

## Included

- `system.json` manifest targeting v13
- `template.json` with Actor and Item data templates
- TypeScript source in `src/`
- SCSS source in `scss/`
- Runtime build output in `dist/` (loaded by Foundry)
- Sheet templates and localization

## Quick start

1. Install dependencies: `npm install`
2. Build assets: `npm run build`
3. In Foundry, choose **Game Systems**.
4. Install from this local folder or package URL.
5. Create a world using **Remasters RPG**.
6. Create Actors (`player`, `npc`, `summon`) and Items (`weapon`, `ability`) to test the scaffold.

## Development

- TypeScript watch mode: `npm run watch:ts`
- SCSS watch mode: `npm run watch:scss`

## Customize first

- `system.json`: author, title, package metadata URLs
- `template.json`: your real game data model
- `src/documents/actor.ts`: roll rules and derived logic
- `templates/actors/actor-sheet.hbs`: actor UI layout
