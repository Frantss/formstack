import { defineConfig } from 'bumpp';

export default defineConfig({
  recursive: true,
  commit: 'release: %s',
  preid: 'alpha',
  push: false,
  tag: false,
});
