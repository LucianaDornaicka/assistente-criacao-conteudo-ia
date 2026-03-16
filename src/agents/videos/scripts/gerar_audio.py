#!/usr/bin/env python3
"""
Geração de áudio via ElevenLabs API para o workflow da Lu Dornaicka.
Uso: python gerar_audio.py <arquivo_script.txt> <idioma> <pasta_saida>

O arquivo de script deve ter blocos marcados com:
  [LUCIANA] texto da Luciana [/LUCIANA]
  [TOM] texto do Tom [/TOM]

Idiomas suportados: pt, es, en
"""

import os
import sys
import re
import json
import requests
from pathlib import Path

from dotenv import load_dotenv

# Carrega .env da raiz do projeto
_dir = Path(__file__).resolve().parent
for _ in range(5):
    if (_dir / ".env").exists():
        load_dotenv(_dir / ".env")
        break
    _dir = _dir.parent


# ── Configuração ──────────────────────────────────────────────────────────────
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

# IDs das vozes — preencher após obter do ElevenLabs
VOICE_IDS = {
    "luciana": os.environ.get("VOICE_ID_LUCIANA", ""),   # voz clonada da Luciana
    "tom":     os.environ.get("VOICE_ID_TOM", ""),        # voz padrão Jamahal/Tom
}

# Modelo multilíngue do ElevenLabs (suporta PT, ES, EN)
MODEL_ID = "eleven_multilingual_v2"

VOICE_SETTINGS = {
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "use_speaker_boost": True
}

# ── Funções ───────────────────────────────────────────────────────────────────

def parse_script(texto: str) -> list[dict]:
    """Extrai blocos de voz do script marcado com [LUCIANA] e [TOM]."""
    blocos = []
    padrao = re.finditer(
        r'\[(LUCIANA|TOM)\](.*?)\[/\1\]',
        texto, re.DOTALL | re.IGNORECASE
    )
    for match in padrao:
        voz = match.group(1).lower()
        conteudo = match.group(2).strip()
        if conteudo:
            blocos.append({"voz": voz, "texto": conteudo})
    return blocos


def gerar_audio_bloco(texto: str, voice_id: str, nome_arquivo: str) -> bool:
    """Chama a API do ElevenLabs e salva o MP3."""
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json"
    }
    payload = {
        "text": texto,
        "model_id": MODEL_ID,
        "voice_settings": VOICE_SETTINGS
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    if resp.status_code == 200:
        Path(nome_arquivo).write_bytes(resp.content)
        print(f"  ✅ Salvo: {nome_arquivo}")
        return True
    else:
        print(f"  ❌ Erro {resp.status_code}: {resp.text}")
        return False


def main():
    if len(sys.argv) < 4:
        print("Uso: python gerar_audio.py <script.txt> <idioma> <pasta_saida>")
        sys.exit(1)

    arquivo_script = sys.argv[1]
    idioma = sys.argv[2].lower()   # pt | es | en
    pasta_saida = Path(sys.argv[3])
    pasta_saida.mkdir(parents=True, exist_ok=True)

    if not ELEVENLABS_API_KEY:
        print("❌ ELEVENLABS_API_KEY não definida. Configure a variável de ambiente.")
        sys.exit(1)

    texto = Path(arquivo_script).read_text(encoding="utf-8")
    blocos = parse_script(texto)

    if not blocos:
        print("⚠️  Nenhum bloco [LUCIANA] ou [TOM] encontrado no script.")
        print("   Certifique-se de marcar o texto com [LUCIANA]...[/LUCIANA] e [TOM]...[/TOM]")
        sys.exit(1)

    print(f"\n🎙️  Gerando {len(blocos)} blocos de áudio em '{idioma}'...")
    arquivos_gerados = []

    for i, bloco in enumerate(blocos, 1):
        voz = bloco["voz"]
        voice_id = VOICE_IDS.get(voz, "")
        if not voice_id:
            print(f"  ⚠️  Voice ID para '{voz}' não configurado. Pulando bloco {i}.")
            continue

        nome = pasta_saida / f"{idioma}_{i:02d}_{voz}.mp3"
        print(f"  [{i}/{len(blocos)}] {voz.upper()} — {bloco['texto'][:60]}...")
        sucesso = gerar_audio_bloco(bloco["texto"], voice_id, str(nome))
        if sucesso:
            arquivos_gerados.append(str(nome))

    # Salva manifesto JSON com a ordem dos arquivos
    manifesto = pasta_saida / f"{idioma}_manifesto.json"
    manifesto.write_text(
        json.dumps({"idioma": idioma, "arquivos": arquivos_gerados}, indent=2, ensure_ascii=False),
        encoding="utf-8"
    )
    print(f"\n✅ {len(arquivos_gerados)} arquivos gerados em: {pasta_saida}")
    print(f"📋 Manifesto salvo em: {manifesto}")


if __name__ == "__main__":
    main()
