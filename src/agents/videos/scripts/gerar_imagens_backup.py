#!/usr/bin/env python3
"""
Geração de prompts e imagens no estilo whiteboard bíblico via DALL-E 3 API.
Uso: python gerar_imagens.py <script_pt.txt> <pasta_saida> [num_imagens]

Se num_imagens for omitido, o script decide automaticamente com base no conteúdo.
"""

import os
import sys
import json
import requests
from pathlib import Path
import anthropic
from openai import OpenAI
from dotenv import load_dotenv

# Carrega .env da raiz do projeto / agente
_dir = Path(__file__).resolve().parent
for _ in range(5):
    if (_dir / ".env").exists():
        load_dotenv(_dir / ".env")
        break
    _dir = _dir.parent

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.environ.get("OPENAI_API_KEY", "")

# Estilo visual padrão da Lu — whiteboard drawing bíblico
ESTILO_VISUAL = """
Whiteboard drawing illustration style. Clean black outlines, hand-drawn appearance.
Solid black contours, flat soft colors inside (beige, warm yellow, light blue, sand tones).
Simple white/cream background. Educational animated video style, biblical content.
Organized strokes suitable for draw-on animation effect.
Consistent, minimalist and friendly style. No gradients, no shadows, no photorealism.
Characters in biblical clothing (robes, sandals, Middle Eastern setting).
"""

PROMPT_GERAR_PROMPTS = """Você é um especialista em criação de conteúdo visual para vídeos bíblicos educativos.

Com base no script abaixo, gere {num_imagens} prompts em INGLÊS para geração de imagens no DALL-E 3.

ESTILO OBRIGATÓRIO para todas as imagens:
{estilo}

REGRAS:
1. Cada prompt deve descrever UMA cena específica do script
2. Escreva em inglês
3. Inclua o estilo visual em cada prompt
4. Descreva personagens, cenário e ação de forma clara
5. Retorne APENAS um JSON válido com a lista de prompts, sem explicações

SCRIPT:
{script}

FORMATO DE SAÍDA (JSON):
{{
  "prompts": [
    {{"cena": 1, "descricao_pt": "breve descrição em português", "prompt_en": "full prompt in English"}},
    ...
  ]
}}
"""

PROMPT_SUGERIR_QUANTIDADE = """Analise o script abaixo (vídeo bíblico educativo) e decida quantas cenas visuais distintas seriam ideais para ilustrar o conteúdo.

Considere: mudanças de tema, passagens marcantes, comparações (ex.: Moisés no deserto vs. mundo atual), citações bíblicas e momentos emocionais.

Retorne APENAS um JSON válido com um único campo "num_imagens" (número inteiro entre 4 e 14). Sem explicações.

SCRIPT:
{script}

Exemplo de resposta: {{"num_imagens": 8}}
"""


def sugerir_num_imagens(script: str) -> int:
    """Usa Claude para sugerir quantas imagens gerar com base no script."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    mensagem = PROMPT_SUGERIR_QUANTIDADE.format(script=script)
    resp = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=128,
        messages=[{"role": "user", "content": mensagem}]
    )
    texto = resp.content[0].text.strip()
    inicio = texto.find("{")
    fim = texto.rfind("}") + 1
    dados = json.loads(texto[inicio:fim])
    n = int(dados.get("num_imagens", 8))
    return max(4, min(14, n))


def gerar_prompts(script: str, num_imagens: int) -> list[dict]:
    """Usa Claude para gerar prompts de imagem a partir do script."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    mensagem = PROMPT_GERAR_PROMPTS.format(
        num_imagens=num_imagens,
        estilo=ESTILO_VISUAL,
        script=script
    )
    resp = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": mensagem}]
    )
    texto = resp.content[0].text.strip()
    # Extrai JSON da resposta
    inicio = texto.find("{")
    fim = texto.rfind("}") + 1
    dados = json.loads(texto[inicio:fim])
    return dados.get("prompts", [])


def gerar_imagem_dalle(prompt: str, nome_arquivo: str) -> bool:
    """Chama DALL-E 3 e salva a imagem PNG."""
    client = OpenAI(api_key=OPENAI_API_KEY)
    try:
        resp = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1792x1024",   # formato widescreen para vídeo
            quality="standard",
            n=1
        )
        url_imagem = resp.data[0].url
        dados = requests.get(url_imagem, timeout=30).content
        Path(nome_arquivo).write_bytes(dados)
        print(f"  ✅ Salvo: {nome_arquivo}")
        return True
    except Exception as e:
        print(f"  ❌ Erro ao gerar imagem: {e}")
        return False


def main():
    if len(sys.argv) < 3:
        print("Uso: python gerar_imagens.py <script_pt.txt> <pasta_saida> [num_imagens]")
        sys.exit(1)

    arquivo_script = Path(sys.argv[1])
    pasta_saida = Path(sys.argv[2])
    pasta_saida.mkdir(parents=True, exist_ok=True)

    script = arquivo_script.read_text(encoding="utf-8")

    if len(sys.argv) > 3:
        num_imagens = int(sys.argv[3])
    else:
        print("\nAnalisando script para definir quantidade de imagens...")
        num_imagens = sugerir_num_imagens(script)
        print(f"Quantidade sugerida: {num_imagens} cenas.")

    print(f"\nGerando {num_imagens} prompts de imagem...")
    prompts = gerar_prompts(script, num_imagens)

    # Salva os prompts para referência
    arquivo_prompts = pasta_saida / "prompts_gerados.json"
    arquivo_prompts.write_text(
        json.dumps(prompts, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"📋 Prompts salvos em: {arquivo_prompts}")

    print(f"\n🖼️  Gerando {len(prompts)} imagens via DALL-E 3...")
    imagens_geradas = []

    for item in prompts:
        cena = item.get("cena", 0)
        prompt = item.get("prompt_en", "")
        desc = item.get("descricao_pt", "")
        nome = pasta_saida / f"cena_{cena:02d}.png"
        print(f"  [{cena}/{len(prompts)}] {desc[:60]}...")
        if gerar_imagem_dalle(prompt, str(nome)):
            imagens_geradas.append(str(nome))

    print(f"\n✅ {len(imagens_geradas)} imagens geradas em: {pasta_saida}")


if __name__ == "__main__":
    main()
