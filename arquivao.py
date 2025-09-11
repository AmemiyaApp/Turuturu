import os

IGNORED_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    ".turbo",
    "__pycache__",
}
IGNORED_FILES = {
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    ".DS_Store",
}

OUTPUT_FILE = "PROJETO_ARQUIVAO.txt"


def should_ignore(path: str, is_dir: bool) -> bool:
    """Retorna True se o arquivo/pasta deve ser ignorado."""
    name = os.path.basename(path)
    if is_dir and name in IGNORED_DIRS:
        return True
    if not is_dir and name in IGNORED_FILES:
        return True
    return False


def collect_files(root_dir: str):
    """Percorre diretórios e retorna lista de arquivos válidos."""
    collected = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if not should_ignore(os.path.join(dirpath, d), True)]
        for f in filenames:
            file_path = os.path.join(dirpath, f)
            if should_ignore(file_path, False):
                continue
            collected.append(file_path)
    return collected


def write_archivao(files, output_file):
    """Escreve todos os arquivos no arquivão TXT, com índice no topo."""
    index_entries = []
    line_count = 0

    # usamos um temporário para depois injetar o índice no topo
    temp_file = output_file + ".tmp"

    with open(temp_file, "w", encoding="utf-8") as out:
        for file_path in files:
            rel_path = os.path.relpath(file_path, ".")
            start_line = line_count + 1
            out.write(f"<DOCUMENT filename=\"{rel_path}\">\n")
            line_count += 1

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    for line in f:
                        out.write(line)
                        line_count += 1
            except Exception as e:
                err_msg = f"### ERRO AO LER ARQUIVO: {e}\n"
                out.write(err_msg)
                line_count += 1

            out.write("\n</DOCUMENT>\n\n")
            line_count += 2  # duas que adicionamos
            end_line = line_count

            index_entries.append((rel_path, start_line, end_line))

    # agora escreve o índice + conteúdo real no arquivo final
    with open(output_file, "w", encoding="utf-8") as final:
        final.write("Índice:\n")
        for (path, start, end) in index_entries:
            final.write(f"- {path} (linhas {start}-{end})\n")
        final.write("\n\n")
        with open(temp_file, "r", encoding="utf-8") as tmp:
            final.write(tmp.read())

    os.remove(temp_file)
    print(f"✅ Arquivão gerado com índice: {output_file}")


if __name__ == "__main__":
    root_dir = "."
    files = collect_files(root_dir)
    files.sort()
    write_archivao(files, OUTPUT_FILE)
