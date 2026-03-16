#!/usr/bin/env python3
"""
Tradução automática do script para Espanhol e Inglês via Claude API.
Preserva os marcadores de voz [LUCIANA] e [TOM].

Uso: python traduzir_script.py <script_pt.txt> <pasta_saida>
Saída: script_es.txt e script_en.txt na pasta_saida
"""

import os
import sys
import anthropic
from pathlib import Path

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

PROMPT_TRADUCAO = """Você é um tradutor especializado em conteúdo bíblico e educacional.

Traduza o script abaixo do Português para {idioma_nome}.

REGRAS OBRIGATÓRIAS:
1. Mantenha EXATAMENTE os marcadores [LUCIANA], [/LUCIANA], [TOM], [/TOM] sem alteração
2. Traduza apenas o texto dentro dos marcadores
3. Preserve o tom devocional, caloroso e educativo do original
4. Para Espanhol: use Espanhol neutro (adequado para toda a América Latina)
5. Para Inglês: use Inglês americano claro e acessível
6. NÃO adicione explicações, apenas retorne o script traduzido

SCRIPT ORIGINAL (Português):
{script}

SCRIPT TRADUZIDO ({idioma_codigo}):\n"""


def traduzir(texto: str, idioma_codigo: str, idioma_nome: str) -> str:
    """Chama a API do Claude para traduzir o script."""
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    prompt = PROMPT_TRADUCAO.format(
        idioma_nome=idioma_nome,
        idioma_codigo=idioma_codigo,
        script=texto
    )
    message = client.messages.create(
        model="claude-opus-4-5",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text.strip()


def main():
    if len(sys.argv) < 3:
        print("Uso: python traduzir_script.py <script_pt.txt> <pasta_saida>")
        sys.exit(1)

    arquivo_pt = Path(sys.argv[1])
    pasta_saida = Path(sys.argv[2])
    pasta_saida.mkdir(parents=True, exist_ok=True)

    if not ANTHROPIC_API_KEY:
        print("❌ ANTHROPIC_API_KEY não definida.")
        sys.exit(1)

    texto_pt = arquivo_pt.read_text(encoding="utf-8")
    nome_base = arquivo_pt.stem.replace("_pt", "")

    idiomas = [
        ("es", "Espanhol neutro (América Latina)"),
        ("en", "English (American)"),
    ]

    for codigo, nome in idiomas:
        print(f"\n🌐 Traduzindo para {nome}...")
        traducao = traduzir(texto_pt, codigo, nome)
        saida = pasta_saida / f"{nome_base}_{codigo}.txt"
        saida.write_text(traducao, encoding="utf-8")
        print(f"  ✅ Salvo: {saida}")

    print("\n✅ Traduções concluídas!")


if __name__ == "__main__":
    main()
