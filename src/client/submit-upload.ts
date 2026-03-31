import { unzipSync, strFromU8 } from 'fflate';
import { parseFrontmatter } from '@/lib/frontmatter';
import { normalizeSlugInput, slugToDisplayName, isValidSubmitSlug } from '@/lib/slug';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB per file
const MAX_TOTAL_CHARS = 5 * 1024 * 1024; // 5 MB total text

/** @type {{ path: string; content: string }[]} */
let parsedFiles: { path: string; content: string }[] = [];

function setParseLoading(on: boolean) {
  document.getElementById('parseLoading')?.classList.toggle('hidden', !on);
  const dz = document.getElementById('dropZone');
  if (dz) dz.classList.toggle('pointer-events-none', !!on);
}

function showParseError(msg: string) {
  const el = document.getElementById('parseError');
  if (!el) return;
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}

/** One level: if every path shares the same first segment, strip it (file paths only in our pipeline). */
function stripCommonTopDir(paths: string[]): string[] {
  const files = paths.filter((p) => !p.endsWith('/'));
  if (files.length === 0 || files.length !== paths.length) return paths.slice();
  const first = files[0];
  const slash = first.indexOf('/');
  if (slash < 0) return paths.slice();
  const root = first.slice(0, slash);
  if (!files.every((p) => p.startsWith(root + '/'))) return paths.slice();
  return files.map((p) => p.slice(root.length + 1));
}

/** Strip nested shared top folders until stable (e.g. a/b/SKILL.md → SKILL.md). */
function stripAllSharedTopSegments(files: { path: string; content: string }[]) {
  let cur = files.map((f) => ({ path: f.path.replace(/\\/g, '/'), content: f.content }));
  for (let n = 0; n < 32; n++) {
    const paths = cur.map((f) => f.path);
    const nextPaths = stripCommonTopDir(paths);
    const unchanged = nextPaths.length === paths.length && nextPaths.every((p, i) => p === paths[i]);
    if (unchanged) break;
    cur = cur.map((f, i) => ({ path: nextPaths[i] ?? f.path, content: f.content }));
  }
  return cur;
}

function normPath(p: string) {
  return p.replace(/\\/g, '/');
}

/** SKILL.md / skill.md anywhere in tree (after normalization). */
function findSkillMd(files: { path: string; content: string }[]) {
  return files.find((f) => {
    const p = normPath(f.path).toLowerCase();
    return p === 'skill.md' || p.endsWith('/skill.md');
  });
}

function applyParsed(files: { path: string; content: string }[]) {
  const normalized = stripAllSharedTopSegments(files);
  parsedFiles = normalized;

  const skill = findSkillMd(normalized);
  if (!skill) {
    const sample = normalized
      .slice(0, 12)
      .map((f) => f.path)
      .join('、');
    showParseError(
      sample
        ? `未找到 SKILL.md。当前解析到的路径示例：${sample}${normalized.length > 12 ? '…' : ''}。请确认包内包含 SKILL.md。`
        : '未找到 SKILL.md。请确认压缩包或文件夹内包含 SKILL.md。',
    );
    document.getElementById('skillForm')?.classList.add('hidden');
    return;
  }

  const skillPath = normPath(skill.path);
  const atPackageRoot = skillPath.split('/').length === 1 && skillPath.toLowerCase() === 'skill.md';
  if (!atPackageRoot) {
    showParseError(
      `技能包根目录下必须有 SKILL.md（与同级文件同一层）。当前检测到：${skillPath}。请调整目录结构后重新上传。`,
    );
    document.getElementById('skillForm')?.classList.add('hidden');
    return;
  }

  showParseError('');
  const fm = parseFrontmatter(skill.content);
  let slug = normalizeSlugInput(fm.name || '');
  if (!slug || slug.length < 2) {
    const parent = skillPath.includes('/')
      ? skillPath.split('/')[0]
      : skillPath.replace(/\.md$/i, '');
    slug = normalizeSlugInput(parent || 'community-skill');
  }
  if (slug.length < 2) slug = 'community-skill';
  const fSlug = document.getElementById('fSlug');
  const fDisplay = document.getElementById('fDisplay');
  const fDesc = document.getElementById('fDesc');
  if (fSlug instanceof HTMLInputElement) fSlug.value = slug;
  if (fDisplay instanceof HTMLInputElement) fDisplay.value = slugToDisplayName(slug);
  if (fDesc instanceof HTMLTextAreaElement) fDesc.value = (fm.description || '').trim() || '由社区提交的技能';
  const ul = document.getElementById('fileList');
  if (ul) {
    ul.innerHTML = '';
    for (const f of normalized) {
      const li = document.createElement('li');
      li.textContent = f.path;
      ul.appendChild(li);
    }
  }
  const form = document.getElementById('skillForm');
  form?.classList.remove('hidden');
  requestAnimationFrame(() => {
    form?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  });
}

async function readDirectoryInput(fileList: FileList) {
  setParseLoading(true);
  showParseError('');
  try {
    // Reject entire folder if total size exceeds 5 MB
    let totalBytes = 0;
    for (let i = 0; i < fileList.length; i++) totalBytes += fileList[i].size;
    if (totalBytes > MAX_FILE_BYTES) {
      showParseError(`文件夹总大小 ${(totalBytes / 1024 / 1024).toFixed(1)} MB 超过 5 MB 上限，请精简后重试`);
      return;
    }

    const out: { path: string; content: string }[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      const rel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
      const parts = rel.split('/');
      const path = parts.slice(1).join('/') || f.name;
      if (!path || f.size > MAX_FILE_BYTES) continue;
      const text = await f.text();
      out.push({ path, content: text });
    }
    if (out.length === 0) {
      showParseError('没有读到有效文件，请重试或换一个文件夹');
      return;
    }
    applyParsed(out);
  } catch (err) {
    console.error(err);
    showParseError('解析失败，请换浏览器重试或打成 zip 上传');
  } finally {
    setParseLoading(false);
  }
}

async function readZipFile(file: File) {
  setParseLoading(true);
  showParseError('');
  try {
    if (file.size > MAX_FILE_BYTES) {
      showParseError(`zip 文件大小 ${(file.size / 1024 / 1024).toFixed(1)} MB 超过 5 MB 上限，请精简后重试`);
      return;
    }

    const buf = await file.arrayBuffer();
    let u: Record<string, Uint8Array>;
    try {
      u = unzipSync(new Uint8Array(buf)) as Record<string, Uint8Array>;
    } catch (e) {
      console.error(e);
      showParseError('无法解压该 zip，请确认文件完整且未加密');
      return;
    }
    const list: { path: string; content: string }[] = [];
    let totalChars = 0;
    for (const [k, v] of Object.entries(u)) {
      if (k.endsWith('/') || !(v instanceof Uint8Array) || v.length === 0) continue;
      const path = k.replace(/\\/g, '/');
      if (path.includes('__MACOSX/') || path.split('/').pop()?.startsWith('._')) continue;
      let text: string;
      try {
        text = strFromU8(v, false);
      } catch {
        text = new TextDecoder('utf-8', { fatal: false }).decode(v);
      }
      if (text.length > MAX_TOTAL_CHARS) continue; // skip single oversized file
      totalChars += text.length;
      if (totalChars > MAX_TOTAL_CHARS) break;
      list.push({ path, content: text });
    }
    if (list.length === 0) {
      showParseError('压缩包内没有可读文件，或格式不支持');
      return;
    }
    applyParsed(list);
  } catch (err) {
    console.error(err);
    showParseError('解析失败，请确认是有效的 zip 文件');
  } finally {
    setParseLoading(false);
  }
}

function wireDropAndInputs() {
  const dropZone = document.getElementById('dropZone');
  const zipInput = document.getElementById('zipInput');
  const dirInput = document.getElementById('dirInput');

  dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-primary/60');
  });
  dropZone?.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-primary/60');
  });
  dropZone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropZone?.classList.remove('border-primary/60');
    const fl = e.dataTransfer?.files;
    if (!fl?.length) return;
    const f = fl[0];
    if (f.name.toLowerCase().endsWith('.zip')) await readZipFile(f);
    else showParseError('请拖入 .zip 文件；上传文件夹请使用下方「选择文件夹」');
  });

  zipInput?.addEventListener('change', async () => {
    const f = (zipInput as HTMLInputElement).files?.[0];
    if (f) {
      await readZipFile(f);
      (zipInput as HTMLInputElement).value = '';
    }
  });
  dirInput?.addEventListener('change', async () => {
    const fl = (dirInput as HTMLInputElement).files;
    if (fl?.length) {
      await readDirectoryInput(fl);
      (dirInput as HTMLInputElement).value = '';
    }
  });
}

async function loadTags() {
  const wrap = document.getElementById('tagsWrap');
  if (!wrap) return;
  try {
    const res = await fetch('/api/tags');
    const data = (await res.json()) as { tags?: unknown[] };
    const tags = data.tags || [];
    for (const t of tags) {
      const id = typeof t === 'object' && t !== null && 'id' in t ? String((t as { id: string }).id) : String(t);
      const name =
        typeof t === 'object' && t !== null && 'name' in t ? String((t as { name: string }).name) : id;
      const label = document.createElement('label');
      label.className = 'inline-flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = id;
      cb.className = 'rounded border-border';
      label.appendChild(cb);
      label.appendChild(document.createTextNode(name));
      wrap.appendChild(label);
    }
  } catch {
    /* ignore */
  }
}

function showSlugHint(ok: boolean, msg: string) {
  let hint = document.getElementById('fSlugHint');
  if (!hint) return;
  hint.textContent = msg;
  hint.className = ok
    ? 'text-xs mt-1 text-gray-500'
    : 'text-xs mt-1 text-red-400';
}

function wireFormHandlers() {
  document.getElementById('fSlug')?.addEventListener('input', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const v = t.value;
    if (!v) { showSlugHint(true, ''); return; }
    if (isValidSubmitSlug(v)) {
      showSlugHint(true, '');
    } else {
      showSlugHint(false, '仅小写字母、数字和连字符，2–64 位，不能以连字符开头或结尾');
    }
  });

  document.getElementById('fSlug')?.addEventListener('blur', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;
    const n = normalizeSlugInput(t.value);
    if (n !== t.value) t.value = n;
    if (n) showSlugHint(isValidSubmitSlug(n), isValidSubmitSlug(n) ? '' : '仅小写字母、数字和连字符，2–64 位，不能以连字符开头或结尾');
  });

  document.getElementById('skillForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fSlug = document.getElementById('fSlug');
    const fDisplay = document.getElementById('fDisplay');
    const fDesc = document.getElementById('fDesc');
    const btn = document.getElementById('submitBtn');
    const msg = document.getElementById('submitMsg');
    if (!(fSlug instanceof HTMLInputElement) || !(fDisplay instanceof HTMLInputElement) || !(fDesc instanceof HTMLTextAreaElement))
      return;

    const name = fSlug.value.trim();
    if (!isValidSubmitSlug(name)) {
      msg?.classList.remove('hidden');
      if (msg) {
        msg.textContent =
          '唯一标识格式无效：2–64 位，仅小写字母、数字和连字符，且不能以连字符开头或结尾';
        msg.className = 'text-sm text-center text-red-400';
      }
      return;
    }

    const tags = Array.from(document.querySelectorAll('#tagsWrap input:checked')).map((el) =>
      el instanceof HTMLInputElement ? el.value : '',
    );

    const origLabel = btn?.textContent;
    if (btn) btn.disabled = true;
    if (btn) btn.textContent = '提交中…';
    msg?.classList.add('hidden');

    try {
      const res = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          display_name: fDisplay.value.trim(),
          description: fDesc.value.trim(),
          summary: fDesc.value.trim(),
          tags,
          files: parsedFiles,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        msg?.classList.remove('hidden');
        if (msg) {
          msg.textContent = data.error || '提交失败';
          msg.className = 'text-sm text-center text-red-400';
        }
        if (btn) btn.disabled = false;
        if (btn && origLabel) btn.textContent = origLabel;
        return;
      }
      msg?.classList.add('hidden');
      document.getElementById('skillForm')?.classList.add('hidden');
      parsedFiles = [];
      showSuccessModal();
    } catch {
      msg?.classList.remove('hidden');
      if (msg) {
        msg.textContent = '网络错误';
        msg.className = 'text-sm text-center text-red-400';
      }
      if (btn) btn.disabled = false;
      if (btn && origLabel) btn.textContent = origLabel;
    }
  });
}

function showSuccessModal() {
  const modal = document.getElementById('successModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.getElementById('successModalClose')?.addEventListener('click', () => {
    modal.classList.add('hidden');
  }, { once: true });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.add('hidden');
  }, { once: true });
}

function boot() {
  if (!document.getElementById('dropZone')) return;
  wireDropAndInputs();
  wireFormHandlers();
  void loadTags();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
