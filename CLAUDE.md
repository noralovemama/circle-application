# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Circle-client (圈子) is a cross-platform social networking app built with **uni-app** and **Vue 3** (with Vue 2 conditional compatibility). The primary deployment target is **WeChat Mini Program** (appid: `wx547471e427601166`), but the codebase also supports H5/web, native iOS/Android, and other mini-program platforms.

## Development Environment

This project uses **HBuilderX** (DCloud's IDE) for building and running. There are no npm build/dev scripts — all compilation, preview, and deployment is done through HBuilderX's GUI:

- **Run**: HBuilderX menu → Run → Run to [platform]
- **Build**: HBuilderX menu → Release → Build for [platform]
- **Tests**: `npx jest` (test files located at `pages/**/*test.[jt]s?(x)`)

Dependencies are managed by the uni-app framework itself; `package.json` dependencies are empty.

## Architecture

### Conditional Compilation

uni-app uses special comments for platform-specific code:
```js
// #ifdef MP-WEIXIN   — only compiled for WeChat
// #ifdef H5          — only compiled for web
// #ifndef VUE3       — excluded from Vue 3 builds
// #endif
```
These are used in `main.js` and throughout the codebase. Respect this pattern when adding platform-specific logic.

### State Management

Dual state management setup in `main.js`:
- **Pinia** (primary, Vue 3): `store/user.js`, `store/circle.js`
- **Vuex** (legacy, Vue 2 compat): `store/index.js`

New features should use Pinia stores.

### API / Request Layer

- `request/config.js` — base URL (`https://wxinlu.com/`) and timeout settings
- `request/request.js` — HTTP client wrapping `uni.request()` with token injection (`User-Token` header) and auth redirect on status `10002`
- `request/api/circle.js`, `request/api/user.js` — endpoint definitions
- `request/mock/` — mock data modules, toggled per-request via `mock: true` flag

### Authentication Flow

1. Phone + verification code login → receives `openId` + `expireAt`
2. Token stored in `uni.setStorageSync('token')` and Pinia user store
3. Requests attach token as `User-Token` header (JSON with openId and expireAt)
4. Status code `10002` from API → auto-redirect to login page

### Page Routing

Defined in `pages.json`. All pages use custom navigation bars (`navigationStyle: custom`):
- `pages/circle/circle` — home page (circle listing), tab bar item
- `pages/circle/detail` — circle detail with comments
- `pages/circle/create` — create new circle
- `pages/user/user` — user profile, tab bar item
- `pages/profile/profileNew` — edit profile
- `pages/profile/profileDetail` — view profile
- `pages/login/login` — login page

### Key Directories

- `pages/` — Vue page components
- `components/` — reusable Vue components (`page-head`, `page-foot`, `u-link`)
- `store/` — Pinia and Vuex stores
- `request/` — API layer, HTTP client, mock data
- `common/` — shared utilities and CSS
- `wxcomponents/vant/` — Vant UI components (WeChat native)
- `uni_modules/` — uni-app plugin modules (uni-ui library)
- `static/` — images and assets
- `config/` — global app configuration

## Code Conventions

- The codebase is in JavaScript (TypeScript config exists but is not enforced)
- Vue single-file components (`.vue`) with `<script>`, `<template>`, `<style>` sections
- API success status code is `10000`; error is `10001`; token expired is `10002`
- Chinese comments throughout the codebase — maintain this convention
- No linter or formatter is configured
