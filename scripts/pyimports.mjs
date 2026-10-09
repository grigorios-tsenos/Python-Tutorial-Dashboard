// Which top-level modules a Python script imports, and which of them are not in the standard library.
// Shared by the curriculum sync (decides what runs in Pyodide) and the local runner (decides what uv installs).

// Python 3.12 sys.stdlib_module_names minus what cannot work inside Pyodide (threads, processes, sockets, GUIs).
export const PYODIDE_STDLIB = new Set(`__future__ abc argparse array ast atexit base64 bisect builtins bz2 calendar cmath cmd code codecs collections colorsys
compileall configparser contextlib contextvars copy copyreg csv dataclasses datetime decimal difflib dis doctest email
encodings enum errno fractions functools gc getopt gettext glob graphlib gzip hashlib heapq hmac html importlib inspect io
ipaddress itertools json keyword linecache locale logging lzma marshal math mimetypes numbers opcode operator optparse os
pathlib pickle pickletools pkgutil platform pprint profile pstats pyclbr queue random re reprlib runpy sched secrets shelve
shlex shutil sqlite3 stat statistics string struct sys sysconfig tabnanny tarfile tempfile textwrap time timeit token
tokenize tomllib trace traceback types typing unicodedata unittest uuid warnings wave weakref xml zipfile zlib zoneinfo`.split(/\s+/))

// ...plus the modules a real CPython on the learner's machine has.
export const STDLIB = new Set([...PYODIDE_STDLIB, ...`asyncio concurrent ctypes curses dbm faulthandler fcntl ftplib grp http imaplib mailbox mmap multiprocessing netrc
nntplib ntpath pdb poplib posix posixpath pty pwd readline resource select selectors signal smtplib socket socketserver ssl
subprocess symtable syslog telnetlib termios threading tkinter tracemalloc tty turtle urllib venv webbrowser winreg xmlrpc`.split(/\s+/)])

/** pip names for imports that differ from the distribution name */
export const PIP_NAME = { sklearn: 'scikit-learn', PIL: 'pillow', cv2: 'opencv-python', yaml: 'pyyaml', umap: 'umap-learn', huggingface_hub: 'huggingface-hub', langchain_anthropic: 'langchain-anthropic', langchain_core: 'langchain-core', langchain_openai: 'langchain-openai', dotenv: 'python-dotenv', attr: 'attrs', skimage: 'scikit-image', bs4: 'beautifulsoup4', jose: 'python-jose', google: 'google-generativeai', faiss: 'faiss-cpu', fitz: 'pymupdf' }

/** top-level module names a script imports, in source order */
export function imports(py) {
  const mods = new Set()
  for (const m of py.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+(?:\s*,\s*[\w.]+)*))/gm)) {
    for (const name of (m[1] ?? m[2]).split(',')) mods.add(name.trim().split('.')[0])
  }
  return [...mods].filter(Boolean)
}

/** the PyPI packages a script needs on a real machine (stdlib and local sibling modules excluded) */
export function pipPackages(py, siblings = []) {
  return [...new Set(imports(py).filter((m) => !STDLIB.has(m) && !siblings.includes(m)).map((m) => PIP_NAME[m] ?? m))]
}
