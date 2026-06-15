# Interface Smoke Test Checklist

This checklist tracks the product-critical Mini Program flows and the API calls each page must complete.

## Login

- Page: `pages/login/login`
- Actions:
  - Enter a valid phone number.
  - Tap `获取验证码`.
  - Enter the received code.
  - Tap `登录`.
- APIs:
  - `POST code/send` with `{ phoneNumber }`
  - `POST token/login` with `{ phoneNumber, validateCode, code }`
  - `GET user/detail` after login, best effort for existing profile.
- Expected:
  - Token, openId, userId, and expireAt are normalized from the full login response and written to storage.
  - Authenticated requests send `User-Token` with `openId` and `expireAt`.
  - App switches to `pages/circle/circle`.
  - No extra login probe request fires on page load.

## Circle List

- Page: `pages/circle/circle`
- APIs:
  - `GET circle/page` with `longitude`, `latitude`, `flag`, and logged-in `userId`.
- Expected:
  - In devtools, default coordinates are used.
  - If location fails on device, default coordinates are used.
  - `我的圈子` uses a tab-safe stored filter and requests `flag: 1`.
  - Pagination keeps requesting when `total` is absent and the previous page returned a full page.
  - Empty, loading, error, and list states render without blocking navigation.

## Circle Detail

- Page: `pages/circle/detail`
- APIs:
  - `GET circle/detail` with `circleId`, `userId`, `longitude`, `latitude`.
  - `POST circle/bind` when joining/leaving.
  - `POST circle/message` when creating, editing, or deleting messages.
- Expected:
  - Detail loads even if location permission fails, using default coordinates.
  - Owner sees edit action; non-owner sees join/leave action.
  - `joinStatus`, `ownerFlag`, and user IDs can be numbers or strings without breaking button/comment state.
  - Joined users can leave even when the circle is full.
  - Join/leave failures roll back the local `joinStatus`.
  - Budget displays `money` or `budget`; zero renders as free.
  - Comments require a complete user profile and refresh detail after mutation.

## Create/Edit Circle

- Page: `pages/circle/create`
- APIs:
  - `GET user/detail` before entering create/edit.
  - `GET circle/detail` when editing.
  - `POST circle/update` when creating or editing.
- Expected:
  - Requires complete profile with `userName` and `image`.
  - Edit detail loading falls back to default coordinates if location permission fails.
  - Activity time accepts either seconds or milliseconds timestamps from the API.
  - Date/time cannot be in the past.
  - Location selection failure in development fills mock location.
  - After create, home list refreshes.
  - After edit, detail page can be revisited with the edited `circleId`.

## User Center

- Page: `pages/user/user`
- APIs:
  - `GET user/detail` on show.
- Expected:
  - Displays latest avatar and nickname after returning from profile edit.
  - Avatar/nickname card opens profile edit.
  - `我的信息` opens profile detail.

## Profile Edit

- Page: `pages/profile/profileNew`
- APIs:
  - `GET user/detail` on load.
  - `POST user/update` on save.
- Expected:
  - Text inputs update local state while typing.
  - WeChat avatar is converted to base64 and sent directly in `image` without a `data:image/...` prefix.
  - Pure base64 avatars returned by the backend still render in `<image>` after display normalization.
  - Existing remote image URLs are not re-submitted as avatars; choose a new avatar if the backend requires base64.
  - Circle owner/comment avatar payloads also submit pure base64 only; remote URLs and static image paths are not sent to the backend.
  - Store user profile is updated after successful save.
  - Redirects to profile detail after save.

## Profile Detail

- Page: `pages/profile/profileDetail`
- APIs:
  - `GET user/detail` with current userId or target `userId`.
- Expected:
  - Own profile shows edit button.
  - Other user's profile hides edit button.
  - Missing optional fields render as `未填写`.

## Local Verification Run

- `rg` compatibility scan: no runtime optional chaining/nullish coalescing, no disabled nickname input, no old `$store.dispatch`.
- `rg` WXSS wildcard scan: no page-level wildcard selectors in source or generated page WXSS.
- Vue SFC tag-count check passed for all files under `pages/`.
- `node -c` passed for request/api/store JavaScript files.
- `git diff --check` passed.
- WeChat DevTools CLI `preview` passed for `unpackage/dist/dev/mp-weixin`; package size: `805.0 KB` (`824357` bytes).
- Generated preview package contains `utils/image.js` plus the updated profile/circle avatar normalization code.
- Open the WeChat DevTools project from `unpackage/dist/dev/mp-weixin`; source-level untracked `pages/**/*.js`/`*.wxml` placeholders are not the uni-app preview output.
