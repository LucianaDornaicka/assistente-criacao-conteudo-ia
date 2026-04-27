# -*- coding: utf-8 -*-
import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

"""
Animacao automatica de imagens via SpeedPaint.co usando Playwright.

Uso:
    python animar_imagens.py <pasta_imagens>          # anima todas as imagens
    python animar_imagens.py <pasta_imagens> --debug  # salva screenshots em cada passo

Exemplos:
    python animar_imagens.py videos/2026-03-15_genesis/imagens
    python animar_imagens.py videos/2026-03-15_genesis/imagens --debug
"""

import asyncio
import json
import sys
import time
from pathlib import Path

COOKIES_FILE  = Path(__file__).resolve().parent.parent / "cookies_speedpaint.json"
SPEEDPAINT_URL = "https://speedpaint.co/"
SKETCHING_DURATION  = 12   # segundos para desenho das linhas
COLOR_FILL_DURATION = 8    # segundos para preenchimento de cor
DEBUG = "--debug" in sys.argv


# ── Utilidades ────────────────────────────────────────────────────────────────

async def salvar_screenshot(page, nome: str, pasta_debug: Path):
    if not DEBUG:
        return
    pasta_debug.mkdir(parents=True, exist_ok=True)
    caminho = pasta_debug / f"{int(time.time())}_{nome}.png"
    await page.screenshot(path=str(caminho))
    print(f"  [screenshot] Screenshot: {caminho.name}")


async def salvar_cookies(context):
    cookies = await context.cookies()
    COOKIES_FILE.write_text(
        json.dumps(cookies, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    print("  [OK] Cookies salvos.")


async def carregar_cookies(context) -> bool:
    if COOKIES_FILE.exists():
        try:
            cookies = json.loads(COOKIES_FILE.read_text(encoding="utf-8"))
            if isinstance(cookies, list) and len(cookies) > 0:
                await context.add_cookies(cookies)
                return True
        except Exception:
            pass
    return False


async def esta_logado(page) -> bool:
    """Verifica se o usuário está autenticado."""
    try:
        # Estratégia 1: botão/link de logout
        logout = page.locator(
            'a:has-text("Log Out"), button:has-text("Log Out"), '
            'a:has-text("Logout"), a:has-text("logout"), '
            'a[href*="logout"], a[href*="signout"]'
        )
        await logout.first.wait_for(state="visible", timeout=4000)
        return True
    except Exception:
        pass
    try:
        # Estratégia 2: avatar ou menu de usuário
        avatar = page.locator(
            '.user-avatar, .avatar, [data-testid="user-menu"], '
            'img[alt*="avatar"], img[alt*="profile"]'
        )
        await avatar.first.wait_for(state="visible", timeout=2000)
        return True
    except Exception:
        pass
    # Estratégia 3: ausência de botão de login
    try:
        login_btn = page.locator(
            'a:has-text("Log In"), button:has-text("Log In"), '
            'a:has-text("Sign In"), a[href*="login"]'
        )
        await login_btn.first.wait_for(state="visible", timeout=2000)
        return False  # Tem botão de login → não está logado
    except Exception:
        pass
    return False


async def fazer_login(page, context):
    print("\n[login] Faça login no SpeedPaint no navegador que abriu.")
    print("   Após fazer login, volte aqui e pressione Enter...")
    input()
    await salvar_cookies(context)


# ── Configuração dos sliders ──────────────────────────────────────────────────

async def set_valor(page, seletor: str, valor: int, descricao: str):
    """Define o valor de um input (text ou range) disparando os eventos corretos."""
    try:
        el = page.locator(seletor).first
        await el.wait_for(state="visible", timeout=8000)
        # Tenta fill direto primeiro
        await el.fill(str(valor))
        await page.wait_for_timeout(300)
        # Força disparo de eventos React/Vue
        await page.evaluate(f"""
            (function() {{
                const els = document.querySelectorAll('{seletor}');
                els.forEach(el => {{
                    const setter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value'
                    ).set;
                    setter.call(el, '{valor}');
                    el.dispatchEvent(new Event('input',  {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                }});
            }})();
        """)
        await page.wait_for_timeout(400)
        val = await el.input_value()
        print(f"  [OK] {descricao} = {val}s")
        return True
    except Exception as e:
        print(f"  [aviso]  {descricao}: {e}")
        return False


async def configurar_duracoes(page, pasta_debug: Path):
    """
    Tenta configurar sketching e color fill com múltiplas estratégias de seletores.
    Salva screenshot para diagnóstico se não conseguir.
    """
    await salvar_screenshot(page, "02_pagina_convert", pasta_debug)

    # — Sketching duration —
    # Tenta IDs conhecidos, depois por label, depois por posição
    seletores_sketch = [
        '#input1', '#sketchingDuration', 'input[name="sketchingDuration"]',
        'input[placeholder*="sketch" i]', 'input[type="number"]:nth-of-type(1)',
        'input[type="range"]:nth-of-type(1)',
    ]
    configurou_sketch = False
    for s in seletores_sketch:
        if await set_valor(page, s, SKETCHING_DURATION, "Sketching"):
            configurou_sketch = True
            break

    # — Color fill duration —
    seletores_color = [
        '#input2', '#colorFillDuration', 'input[name="colorFillDuration"]',
        'input[placeholder*="color" i]', 'input[type="number"]:nth-of-type(2)',
        'input[type="range"]:nth-of-type(2)',
    ]
    configurou_color = False
    for s in seletores_color:
        if await set_valor(page, s, COLOR_FILL_DURATION, "Color fill"):
            configurou_color = True
            break

    if not configurou_sketch or not configurou_color:
        await salvar_screenshot(page, "03_sliders_nao_encontrados", pasta_debug)
        print("  [aviso]  Não foi possível configurar os sliders automaticamente.")
        print("      Configure manualmente no navegador e pressione Enter para continuar...")
        input()

    return True


# ── Upload ────────────────────────────────────────────────────────────────────

async def fazer_upload(page, imagem_path: Path, pasta_debug: Path) -> bool:
    """Faz o upload da imagem e aguarda a navegação para a página de configuração."""
    await salvar_screenshot(page, "01_home_antes_upload", pasta_debug)

    # Estratégia 1: input[type="file"] direto
    try:
        file_input = page.locator('input[type="file"]').first
        await file_input.wait_for(state="attached", timeout=5000)
        await file_input.set_input_files(str(imagem_path))
        print(f"  [upload] Upload via input[type=file]")
        return True
    except Exception:
        pass

    # Estratégia 2: clicar no botão de upload e depois usar o file chooser
    try:
        upload_btn = page.locator(
            'button:has-text("Upload"), a:has-text("Upload"), '
            'label[for*="file"], label:has-text("Upload"), '
            '.upload-btn, .upload-area, [data-testid*="upload"]'
        ).first
        async with page.expect_file_chooser(timeout=5000) as fc_info:
            await upload_btn.click()
        fc = await fc_info.value
        await fc.set_files(str(imagem_path))
        print(f"  [upload] Upload via botão + file chooser")
        return True
    except Exception:
        pass

    # Estratégia 3: arrastar para a área de drop (dispara o input oculto)
    try:
        drop_zone = page.locator(
            '.drop-zone, .dropzone, [class*="drop"], [class*="upload"]'
        ).first
        async with page.expect_file_chooser(timeout=5000) as fc_info:
            await drop_zone.click()
        fc = await fc_info.value
        await fc.set_files(str(imagem_path))
        print(f"  [upload] Upload via drop zone")
        return True
    except Exception:
        pass

    await salvar_screenshot(page, "01b_upload_falhou", pasta_debug)
    print("  [ERRO] Não foi possível fazer o upload automaticamente.")
    print(f"     Faça o upload manualmente de: {imagem_path.name}")
    print("     Após o upload, pressione Enter para continuar...")
    input()
    return True  # Usuário fez manualmente


# ── Aguardar página de conversão ──────────────────────────────────────────────

async def aguardar_pagina_convert(page, pasta_debug: Path) -> bool:
    """Aguarda a navegação para a página de edição/conversão."""
    # Tenta aguardar por URL
    for padrao in ["**/convert**", "**/edit**", "**/animate**", "**/create**"]:
        try:
            await page.wait_for_url(padrao, timeout=15000)
            print(f"  [OK] Página de edição carregada ({padrao})")
            await page.wait_for_timeout(2000)
            return True
        except Exception:
            pass

    # Fallback: aguarda algum slider ou botão de geração aparecer
    try:
        await page.locator(
            '#input1, #sketchingDuration, input[type="range"], #convertButton, '
            'button:has-text("Animate"), button:has-text("Generate")'
        ).first.wait_for(state="visible", timeout=20000)
        print("  [OK] Página de edição detectada (por elemento)")
        await page.wait_for_timeout(1500)
        return True
    except Exception:
        pass

    await salvar_screenshot(page, "02b_aguardando_convert", pasta_debug)
    print("  [aviso]  Página de edição não detectada automaticamente.")
    print("     Navegue manualmente até a tela de configuração e pressione Enter...")
    input()
    return True


# ── Gerar vídeo ───────────────────────────────────────────────────────────────

async def clicar_gerar(page, pasta_debug: Path) -> bool:
    await salvar_screenshot(page, "04_antes_gerar", pasta_debug)

    seletores_gerar = [
        '#convertButton', 'button:has-text("Animate")', 'button:has-text("Generate")',
        'button:has-text("Create")', 'button:has-text("Convert")',
        'button:has-text("Start")', '[data-testid*="generate"]',
        'input[type="submit"]', 'button[type="submit"]',
    ]
    for s in seletores_gerar:
        try:
            btn = page.locator(s).first
            await btn.wait_for(state="visible", timeout=3000)
            await btn.click()
            print(f"  [gerando] Gerando vídeo ({s})...")
            return True
        except Exception:
            pass

    await salvar_screenshot(page, "04b_botao_gerar_nao_encontrado", pasta_debug)
    print("  [aviso]  Botão de geração não encontrado. Clique manualmente e pressione Enter...")
    input()
    return True


# ── Download ──────────────────────────────────────────────────────────────────

async def fazer_download(page, output_file: Path, pasta_debug: Path) -> bool:
    """
    Aguarda e clica no botão de download da animação.
    O botão aparece no canto superior direito após a geração estar pronta.
    Tenta múltiplos seletores em ordem de prioridade.
    Só navega para a próxima imagem APÓS o download ser concluído.
    """
    print(f"  [aguardando] Aguardando botão de download (canto superior direito)...")

    # Seletores em ordem de prioridade — topo direito primeiro
    seletores_download = [
        # Botão de download típico no topo direito do SpeedPaint
        'a[download]',
        'button:has-text("Download")',
        'a:has-text("Download")',
        '[class*="download"]',
        '[id*="download"]',
        'a:has-text("download")',
        'button:has-text("Save")',
        'a:has-text("Save video")',
        'button:has-text("Save video")',
        '[data-testid*="download"]',
        # Fallback: qualquer link para arquivo de vídeo
        'a[href$=".mp4"]',
        'a[href*="download"]',
        'a[href*="video"]',
    ]

    download_locator = None

    # Tenta cada seletor com timeout menor (10s), exceto os primeiros (mais prováveis)
    for i, s in enumerate(seletores_download):
        timeout = 180000 if i == 0 else 5000  # aguarda 3 min só no primeiro seletor mais provável
        try:
            loc = page.locator(s).first
            await loc.wait_for(state="visible", timeout=timeout)
            download_locator = loc
            print(f"  [OK] Botão de download encontrado: {s}")
            break
        except Exception:
            pass

    await salvar_screenshot(page, "05_pronto_para_download", pasta_debug)

    if download_locator is None:
        print("  [aviso] Botão de download nao encontrado automaticamente.")
        print("  --> Clique no botao de download no canto superior direito")
        print("  --> Salve o arquivo como:", output_file.name)
        print("  --> Pressione Enter apos o download terminar...")
        input()
        return True  # usuario baixou manualmente — continua para proxima imagem

    # Tenta disparar o download via evento
    try:
        async with page.expect_download(timeout=120000) as dl_info:
            await download_locator.click()
        dl = await dl_info.value
        await dl.save_as(str(output_file))
        print(f"  [OK] Salvo: {output_file.name}")
        # Pausa para garantir que o arquivo foi gravado antes de seguir
        await page.wait_for_timeout(1500)
        return True
    except Exception as e:
        pass

    # Fallback: tenta baixar via href direto
    try:
        href = await download_locator.get_attribute("href")
        if href:
            if not href.startswith("http"):
                href = f"https://speedpaint.co{href}"
            resp = await page.request.get(href)
            output_file.write_bytes(await resp.body())
            print(f"  [OK] Salvo via href: {output_file.name}")
            await page.wait_for_timeout(1500)
            return True
    except Exception:
        pass

    # Ultimo recurso: pede ao usuario
    print(f"  [aviso] Nao consegui baixar automaticamente.")
    print(f"  --> Clique no botao de download no canto superior direito")
    print(f"  --> Salve o arquivo como: {output_file.name}")
    print(f"  --> Pressione Enter apos o download terminar...")
    input()
    return True


# ── Animar uma imagem (fluxo completo) ───────────────────────────────────────

async def animar_imagem(page, context, imagem_path: Path, output_dir: Path,
                        pasta_debug: Path) -> bool:
    output_file = output_dir / (imagem_path.stem + ".mp4")
    if output_file.exists():
        print(f"  [skip]  Já existe — pulando")
        return True

    try:
        # 1. Ir para home
        await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        # 2. Verificar login
        if not await esta_logado(page):
            print("  [login] Sessão expirada. Faça login e pressione Enter...")
            input()
            await salvar_cookies(context)
            await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)

        # 3. Upload
        ok = await fazer_upload(page, imagem_path, pasta_debug)
        if not ok:
            return False

        # 4. Aguardar página de edição
        await aguardar_pagina_convert(page, pasta_debug)

        # 5. Configurar durações
        await configurar_duracoes(page, pasta_debug)

        # 6. Gerar
        await clicar_gerar(page, pasta_debug)

        # 7. Download — DEVE ocorrer antes de qualquer navegação para a próxima imagem
        ok = await fazer_download(page, output_file, pasta_debug)
        if ok:
            print(f"  [OK] Download concluido. Aguardando 2s antes da proxima imagem...")
            await page.wait_for_timeout(2000)
        return ok

    except Exception as e:
        print(f"  [ERRO] Erro inesperado: {e}")
        if DEBUG:
            await salvar_screenshot(page, "erro_inesperado", pasta_debug)
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

async def main():
    raw_args = sys.argv[1:]

    # Extrai --start nome_da_imagem.png
    start_from = None
    if '--start' in raw_args:
        idx = raw_args.index('--start')
        if idx + 1 < len(raw_args):
            start_from = raw_args[idx + 1]
            raw_args = raw_args[:idx] + raw_args[idx + 2:]

    args = [a for a in raw_args if not a.startswith("--")]
    if not args:
        print(__doc__)
        sys.exit(1)

    pasta = Path(args[0])
    if not pasta.exists():
        print(f"[ERRO] Pasta nao encontrada: {pasta}")
        sys.exit(1)

    # Aceita tanto:
    # - caminho direto para a pasta de imagens (…/imagens)
    # - caminho para a pasta do episódio (…/videos/EPISODIO), desde que exista EPISODIO/imagens
    if pasta.is_dir() and (pasta / "imagens").exists():
        pasta = pasta / "imagens"

    imagens = sorted(
        list(pasta.glob("*.png")) +
        list(pasta.glob("*.jpg")) +
        list(pasta.glob("*.jpeg"))
    )
    if not imagens:
        print(f"[ERRO] Nenhuma imagem encontrada em: {pasta}")
        sys.exit(1)

    # Aplica --start: pula imagens anteriores ao arquivo indicado
    if start_from:
        nomes = [img.name for img in imagens]
        if start_from in nomes:
            idx = nomes.index(start_from)
            puladas = imagens[:idx]
            imagens = imagens[idx:]
            print(f"[aviso] --start: pulando {len(puladas)} imagem(ns), iniciando em '{start_from}'")
        else:
            print(f"[aviso] --start: '{start_from}' nao encontrado — processando todas as imagens")
            print(f"   Imagens disponiveis: {', '.join(nomes)}")

    # Deriva o nome base da pasta do projeto (remove data do inicio)
    # Ex: "2026-03-16_antigo_testamento" -> "antigo_testamento"
    # A pasta `imagens` está dentro do projeto, então sobe dois níveis
    projeto_dir = pasta.parent  # pasta do episódio
    nome_projeto = projeto_dir.name.replace("-", "_")
    # Remove prefixo de data YYYY_MM_DD_
    import re as _re
    nome_base = _re.sub(r'^\d{4}_\d{2}_\d{2}_', '', nome_projeto)

    # Subpasta de saída: imagens/{nome_base}_anima/
    output_dir = pasta / f"{nome_base}_anima"
    output_dir.mkdir(exist_ok=True)

    pasta_debug = pasta / "debug_screenshots"

    modo = "DEBUG [screenshot]" if DEBUG else "normal"
    print(f"\n[SpeedPaint] SpeedPaint Automation — modo {modo}")
    print(f"   {len(imagens)} imagens | Sketching={SKETCHING_DURATION}s | Color={COLOR_FILL_DURATION}s")
    print(f"   Saida: {output_dir}\n")

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=200)
        context = await browser.new_context(accept_downloads=True)

        await carregar_cookies(context)
        page = await context.new_page()

        # Login inicial
        await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2500)

        await salvar_screenshot(page, "00_pagina_inicial", pasta_debug)

        if not await esta_logado(page):
            await fazer_login(page, context)
            await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
            await page.wait_for_timeout(2000)
        else:
            print("[OK] Sessão ativa — entrando direto!\n")

        await salvar_screenshot(page, "00b_apos_login", pasta_debug)

        # Processa cada imagem
        sucessos = 0
        for i, imagem in enumerate(imagens, 1):
            print(f"\n[{i}/{len(imagens)}] {imagem.name}")
            ok = await animar_imagem(page, context, imagem, output_dir, pasta_debug)
            if ok:
                sucessos += 1
            await asyncio.sleep(3)

        await browser.close()

    print(f"\n{'='*50}")
    print(f"[OK] Concluído: {sucessos}/{len(imagens)} vídeos gerados")
    print(f"[pasta] Vídeos em: {output_dir}")
    if DEBUG and pasta_debug.exists():
        print(f"[screenshot] Screenshots em: {pasta_debug}")


if __name__ == "__main__":
    asyncio.run(main())
