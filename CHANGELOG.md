# Changelog

All notable changes to this project are documented in this file.

## [0.2.0-alpha] - 2026-02-19

### Added
- Cast spell workflow for abilities, including:
  - Cast chat card with unified visual style.
  - Action buttons for attack, secondary tests, and damage.
  - Secondary test processing for all selected/targeted tokens.
- Ability item `Additional Settings` tab with cast overrides:
  - Attack attribute/manual bonus/custom bonuses.
  - Secondary attribute and manual CDE.
  - Damage formula/type/custom damage parts.
- Automatic tag sync for ability characteristics:
  - `destruicao` implies `ataque`.
  - `area` and `condicao` tags are auto-maintained.
- Automatic Reiki checks when casting abilities based on `castingCost` and relevant enhancements.
- Default icon for newly created ability items:
  - `systems/remasters-rpg/assets/icons/spiky-explosion.png`

### Changed
- Roll/check/damage/reiki chat cards were unified and polished for consistent layout and behavior.
- Damage flow was expanded with dialog-driven composition, apply/half/double/soak controls, and chat-driven interactions.
- Ability/inventory/action UI interactions were refined for faster workflows and clearer item handling.
- i18n sources were modularized and expanded in EN/PT-BR for the new systems and UI labels.

### Fixed
- Item sheet scroll position now persists after updates.
- Cast secondary button source resolution now supports ID/UUID fallback to avoid silent no-op clicks.
- Chat card styling fixes for cast description and button layout.
- Check outcome rendering and GM target-info secrecy behavior were corrected and improved.

## [0.1.0-alpha.1] - 2026-02-18

### Added
- Initial alpha release package and manifest for Foundry VTT v13.
- Ability sheet characteristic progression overhaul and rank-aware controls.
