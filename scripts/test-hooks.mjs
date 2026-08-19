import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const CANDIDATE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

function resolveWithExtension(absPath) {
  if (fs.existsSync(absPath)) {
    return absPath;
  }

  for (const ext of CANDIDATE_EXTENSIONS) {
    if (fs.existsSync(absPath + ext)) {
      return absPath + ext;
    }
  }

  for (const ext of CANDIDATE_EXTENSIONS) {
    const indexed = path.join(absPath, 'index' + ext);
    if (fs.existsSync(indexed)) {
      return indexed;
    }
  }

  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let absPath = null;

  if (specifier.startsWith('@/')) {
    absPath = path.join(ROOT, specifier.slice(2));
  } else if (
    (specifier.startsWith('./') || specifier.startsWith('../')) &&
    context.parentURL &&
    context.parentURL.startsWith('file:') &&
    !path.extname(specifier)
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    absPath = path.resolve(path.dirname(parentPath), specifier);
  }

  if (absPath) {
    const resolved = resolveWithExtension(absPath);
    if (resolved) {
      return nextResolve(pathToFileURL(resolved).href, context);
    }
  }

  return nextResolve(specifier, context);
}
