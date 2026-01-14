# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [1.0.1] - 2026-01-13
### Added
- Upload success indicator for Google Drive integration.
  - The "Upload to Drive" button now turns green and shows "Uploaded" upon success.
  - The button is disabled after a successful upload to prevent duplicate submissions.
- Optimized Google Drive authentication.
  - Implemented token caching using `sessionStorage`.
  - Authentication now persists across page reloads ("Start New Process") within the same browser session.

## [1.0.0] - 2026-01-09
### Added
- Initial project migration to new repository `PixelWebWorks/docusplit-v3`.
- Configuration of deployment pipeline via Coolify.
- Package dependencies installation and environment setup (Node.js, Homebrew).
