#!/usr/bin/env sh
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then echo 'Install Node.js 22 LTS or newer from https://nodejs.org/'; exit 1; fi
if [ ! -d node_modules/next ]; then npm install; fi
printf '\nOpen http://localhost:3000 in your browser\n'
npm run dev
