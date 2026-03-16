"""
animar_imagens.py — Automatiza o SpeedPaint.co via Playwright
Uso: python animar_imagens.py <pasta_imagens>
"""
import asyncio, json, sys
from pathlib import Path

COOKIES_FILE = Path(__file__).resolve().parent.parent / "cookies_speedpaint.json"
SPEEDPAINT_URL = "https://speedpaint.co/"
SKETCHING_DURATION = 10
COLOR_FILL_DURATION = 8

async def salvar_cookies(context ):
    cookies = await context.cookies()
    COOKIES_FILE.write_text(json.dumps(cookies, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"  Cookies salvos.")

async def carregar_cookies(context) -> bool:
    if COOKIES_FILE.exists():
        try:
            cookies = json.loads(COOKIES_FILE.read_text(encoding="utf-8"))
            if isinstance(cookies, list):
                await context.add_cookies(cookies)
                return True
        except Exception:
            pass
    return False

async def verificar_logado(page) -> bool:
    try:
        await page.locator('a:has-text("Log In"), button:has-text("Log In")').first.wait_for(state="visible", timeout=3000)
        return False
    except Exception:
        return True

async def set_slider_value(page, nth: int, value: int):
    """Define valor de um input[type=number] via React synthetic events"""
    try:
        locator = page.locator('input[type="number"]').nth(nth)
        await locator.wait_for(state="visible", timeout=5000)
        await page.evaluate(f"""
            (function() {{
                const inputs = document.querySelectorAll('input[type="number"]');
                const el = inputs[{nth}];
                if (!el) return;
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeInputValueSetter.call(el, '{value}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }})();
        """)
        await page.wait_for_timeout(300)
    except Exception as e:
        print(f"  Aviso: nao conseguiu ajustar slider {nth}: {e}")

async def animar_imagem(page, context, imagem_path: Path, output_dir: Path) -> bool:
    output_file = output_dir / (imagem_path.stem + ".mp4")
    if output_file.exists():
        print(f"  Ja existe: {output_file.name} — pulando")
        return True
    try:
        await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(1000)

        # Upload da imagem
        file_input = page.locator('input[type="file"]').first
        await file_input.set_input_files(str(imagem_path))
        print(f"  Upload enviado, aguardando pagina de conversao...")

        # Aguardar redirecionamento para /convert
        await page.wait_for_url("**/convert**", timeout=30000)
        await page.wait_for_timeout(1500)

        # Verificar se precisa de login
        try:
            login_btn = page.locator('button:has-text("Log in to Animate"), a:has-text("Log in to Animate")').first
            await login_btn.wait_for(state="visible", timeout=4000)
            print(f"  Detectado botao de login — clicando...")
            await login_btn.click()
            await page.wait_for_timeout(3000)
            if not await verificar_logado(page):
                print("  Faca login no modal e pressione Enter aqui...")
                input()
                await salvar_cookies(context)
            await page.go_back()
            await page.wait_for_url("**/convert**", timeout=15000)
            await page.wait_for_timeout(1500)
        except Exception:
            pass

        # Aguardar os inputs de slider aparecerem
        try:
            await page.locator('input[type="number"]').first.wait_for(state="visible", timeout=10000)
        except Exception:
            print(f"  Aviso: sliders nao encontrados, continuando mesmo assim...")

        # Configurar Sketching Duration e Color Fill Duration
        await set_slider_value(page, 0, SKETCHING_DURATION)
        await set_slider_value(page, 1, COLOR_FILL_DURATION)
        print(f"  Configurado: Sketching={SKETCHING_DURATION}s, Color={COLOR_FILL_DURATION}s")

        # Clicar em Animate/Generate se existir
        try:
            animate_btn = page.locator('button:has-text("Animate"), button:has-text("Generate"), button:has-text("Create Video")').first
            await animate_btn.wait_for(state="visible", timeout=5000)
            await animate_btn.click()
            print(f"  Geracao iniciada...")
        except Exception:
            print(f"  Geracao automatica em andamento...")

        # Aguardar botao de Download
        print(f"  Aguardando video ficar pronto (ate 3 min)...")
        download_btn = page.locator('a[download], a:has-text("Download"), button:has-text("Download")').first
        await download_btn.wait_for(state="visible", timeout=180000)

        # Baixar o video
        async with page.expect_download(timeout=120000) as dl_info:
            await download_btn.click()
        dl = await dl_info.value
        await dl.save_as(str(output_file))
        print(f"  Salvo: {output_file.name}")
        return True

    except Exception as e:
        print(f"  ERRO em {imagem_path.name}: {e}")
        return False

async def main():
    if len(sys.argv) < 2:
        print("Uso: python animar_imagens.py <pasta_imagens>")
        sys.exit(1)
    pasta = Path(sys.argv[1])
    if not pasta.exists():
        print(f"Pasta nao encontrada: {pasta}")
        sys.exit(1)
    imagens = sorted(list(pasta.glob("*.png")) + list(pasta.glob("*.jpg")) + list(pasta.glob("*.jpeg")))
    if not imagens:
        print(f"Nenhuma imagem encontrada em: {pasta}")
        sys.exit(1)
    output_dir = pasta / "videos_animados"
    output_dir.mkdir(exist_ok=True)
    print(f"\nAnimando {len(imagens)} imagens via SpeedPaint.co")
    print(f"Configuracao: Sketching={SKETCHING_DURATION}s | Color Fill={COLOR_FILL_DURATION}s\n")

    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(accept_downloads=True)
        cookies_carregados = await carregar_cookies(context)
        page = await context.new_page()
        await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        if not cookies_carregados or not await verificar_logado(page):
            print("Faca login no SpeedPaint no navegador que abriu.")
            print("Apos fazer login, volte aqui e pressione Enter...")
            input()
            await salvar_cookies(context)
            await page.goto(SPEEDPAINT_URL, wait_until="domcontentloaded", timeout=30000)

        print("Sessao ativa. Iniciando animacoes...\n")
        sucessos = 0
        for i, imagem in enumerate(imagens, 1):
            print(f"[{i}/{len(imagens)}] {imagem.name}")
            ok = await animar_imagem(page, context, imagem, output_dir)
            if ok:
                sucessos += 1
            await asyncio.sleep(2)

        await browser.close()
    print(f"\nConcluido: {sucessos}/{len(imagens)} videos gerados")
    print(f"Videos em: {output_dir}")

if __name__ == "__main__":
    asyncio.run(main())
