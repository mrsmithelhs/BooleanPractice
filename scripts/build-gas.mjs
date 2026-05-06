import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');
const distDir = join(repoRoot, 'dist');
const gasSourceDir = join(repoRoot, 'gas');
const gasDistDir = join(repoRoot, 'gas-dist');

async function main() {
  await rm(gasDistDir, { recursive: true, force: true });
  await mkdir(gasDistDir, { recursive: true });
  await copyGasSourceFiles();
  await writeGasIndexHtml();
  await writeBuildMetadata();
}

async function copyGasSourceFiles() {
  const entries = await readdir(gasSourceDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const sourcePath = join(gasSourceDir, entry.name);
    const destinationPath = join(gasDistDir, entry.name);
    await cp(sourcePath, destinationPath);
  }
}

async function writeGasIndexHtml() {
  const indexHtmlPath = join(distDir, 'index.html');
  const indexHtml = await readFile(indexHtmlPath, 'utf8');
  const scriptMatch = indexHtml.match(
    /<script type="module" crossorigin src="(\.\/assets\/[^"]+\.js)"><\/script>/,
  );
  const styleMatch = indexHtml.match(
    /<link rel="stylesheet" crossorigin href="(\.\/assets\/[^"]+\.css)">/,
  );

  if (!scriptMatch || !styleMatch) {
    throw new Error('Unable to locate the Vite asset tags in dist/index.html.');
  }

  const scriptSource = await readFile(join(distDir, scriptMatch[1]), 'utf8');
  const styleSource = await readFile(join(distDir, styleMatch[1]), 'utf8');

  const gasHtml = indexHtml
    .replace(styleMatch[0], `<style>\n${styleSource}\n</style>`)
    .replace(
      scriptMatch[0],
      `<script>\nwindow.__BOOLEAN_PRACTICE_BUILD_TARGET__ = 'gas';\n</script>\n    <?!= assignmentBootstrap ?>\n    <script type="module">\n${scriptSource}\n</script>`,
    );

  await writeFile(join(gasDistDir, 'Index.html'), gasHtml, 'utf8');
}

async function writeBuildMetadata() {
  const metadata = {
    source: 'Boolean Practice',
    buildTarget: 'gas',
    generatedAt: new Date().toISOString(),
  };

  await writeFile(join(gasDistDir, 'build-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
