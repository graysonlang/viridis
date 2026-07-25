#!/usr/bin/env node
try {
  const { runPrepareSteps } = await import('@graysonlang/esp/prepare');
  runPrepareSteps([
    {
      label: 'sync launch.json',
      args: ['./scripts/build.mjs', '--sync-launch'],
    },
  ]);
} catch (error) {
  console.warn(`prepare: skipped (${error.message})`);
}
