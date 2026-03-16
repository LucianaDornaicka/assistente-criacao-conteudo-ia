#!/usr/bin/env python3
"""
Geração de prompts e imagens no estilo whiteboard bíblico via DALL-E 3.
Uso: python gerar_imagens.py <script_pt.txt> <pasta_saida> [num_imagens]

Variáveis de ambiente necessárias (.env na raiz do projeto):
  ANTHROPIC_API_KEY  — para gerar os prompts via Claude
  OPENAI_API_KEY     — para gerar as imagens via DALL-E 3
"""

import os
import sys
import json
import requests
from pathlib import Path
import anthropic
from openai import OpenAI
from dotenv import load_dotenv
import dotenv as _dotenv_module

# Carrega .env da pasta Agente-Videos (caminho relativo ao script)
_env_path = Path(__file__).resolve().parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path, override=True)
else:
    # fallback: sobe até 5 níveis
    _dir = Path(__file__).resolve().parent
    for _ in range(5):
        if (_dir / ".env").exists():
            load_dotenv(_dir / ".env", override=True)
            break
        _dir = _dir.parent

# Lê diretamente do .env da pasta Agente-Videos, com fallback para variáveis de ambiente
_env_values = _dotenv_module.dotenv_values(Path(__file__).resolve().parent.parent / ".env")
ANTHROPIC_API_KEY = _env_values.get("ANTHROPIC_API_KEY", "") or os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = _env_values.get("OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")

ESTILO_VISUAL = """
Whiteboard drawing illustration style. Clean solid black outlines, hand-drawn appearance.
Flat soft colors inside the outlines (beige, warm yellow, light blue, sand tones).
Simple white/cream background. Educational animated video style, biblical content.
Organized strokes suitable for draw-on animation effect.
Minimalist and friendly style. No gradients, no shadows, no photorealism.
Characters in biblical clothing (robes, sandals, Middle Eastern setting).
IMPORTANT: Characters MUST have expressive eyes with clearly visible iris, pupils,
eyelashes and expressive eyebrows — NOT simple dots or circles. Eyes show emotion.
"""

PROMPT_GERAR_PROMPTS = """Você é especialista em conteúdo visual para vídeos bíblicos educativos.

Analise o script abaixo e identifique as {num} cenas mais importantes e visualmente distintas.
Para cada cena, gere um prompt detalhado em inglês para DALL-E 3 no estilo whiteboard bíblico.

ESTILO OBRIGATÓRIO para todos os prompts:
{estilo}

REGRAS:
1. Cada prompt descreve UMA cena específica e importante do script
2. Escreva os prompts em inglês
3. Inclua o estilo visual em cada prompt
4. Descreva personagens, cenário e ação de forma clara e detalhada
5. Retorne APENAS um JSON válido, sem explicações

SCRIPT:
{script}

FORMATO DE SAÍDA (JSON):
[
  {{"cena": 1, "descricao_pt": "breve descrição em português", "prompt_en": "full detailed prompt in English"}},
  ...
]
"""


def gerar_prompts(script: str, num_imagens: int) -> list:
    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY não definida no .env")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    mensagem = PROMPT_GERAR_PROMPTS.format(
        num=num_imagens,
        estilo=ESTILO_VISUAL,
        script=script[:8000]
    )

    resp = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": mensagem}]
    )

    texto = resp.content[0].text.strip()

    if "```json" in texto:
        texto = texto.split("```json")[1].split("```")[0].strip()
    elif "```" in texto:
        texto = texto.split("```")[1].split("```")[0].strip()

    inicio = texto.find("[")
    fim = texto.rfind("]") + 1
    return json.loads(texto[inicio:fim])


def gerar_imagem_dalle(prompt: str, caminho_saida: str) -> bool:
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY não definida no .env")
        return False

    client = OpenAI(api_key=OPENAI_API_KEY)

    try:
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",
            quality="standard",
            n=1
        )

        url = response.data[0].url
        img_data = requests.get(url, timeout=60).content

        with open(caminho_saida, "wb") as f:
            f.write(img_data)

        print(f"    ✅ Salva: {caminho_saida}")
        return True

    except Exception as e:
        print(f"    ❌ Erro ao gerar imagem: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("Uso: python gerar_imagens.py <script_pt.txt> <pasta_saida> [num_imagens]")
        sys.exit(1)

    arquivo_script = Path(sys.argv[1])
    pasta_saida    = Path(sys.argv[2])
    num_imagens    = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    pasta_saida.mkdir(parents=True, exist_ok=True)

    if not arquivo_script.exists():
        print(f"❌ Arquivo não encontrado: {arquivo_script}")
        sys.exit(1)

    script = arquivo_script.read_text(encoding="utf-8")

    print(f"\n🎨 Gerando {num_imagens} prompts via Claude...")
    prompts = gerar_prompts(script, num_imagens)

    arquivo_prompts = pasta_saida / "prompts_gerados.json"
    arquivo_prompts.write_text(
        json.dumps(prompts, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"📋 {len(prompts)} prompts salvos em: {arquivo_prompts}")

    print(f"\n🖼️  Gerando {len(prompts)} imagens via DALL-E 3...")
    imagens_geradas = []

    for item in prompts:
        cena   = item.get("cena", 0)
        prompt = item.get("prompt_en", "")
        desc   = item.get("descricao_pt", "")
        nome   = pasta_saida / f"cena_{cena:02d}.png"
        print(f"  [{cena}/{len(prompts)}] {desc[:60]}...")
        if gerar_imagem_dalle(prompt, str(nome)):
            imagens_geradas.append(str(nome))

    print(f"\n✅ {len(imagens_geradas)} imagens geradas em: {pasta_saida}")
    print("\n" + "=" * 60)
    print(f"💰 Custo estimado: ~${len(imagens_geradas) * 0.04:.2f} (DALL-E 3 standard)")
    print("=" * 60)


if __name__ == "__main__":
    main()
