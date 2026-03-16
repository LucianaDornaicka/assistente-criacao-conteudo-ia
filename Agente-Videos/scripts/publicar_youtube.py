#!/usr/bin/env python3
"""
Publicação automática de vídeos no YouTube via Data API v3.
Uso: python publicar_youtube.py <config.json>

O config.json deve conter:
{
  "video_path": "caminho/para/video.mp4",
  "thumbnail_path": "caminho/para/thumbnail.png",
  "idioma": "pt",  // pt | es | en
  "titulo": "Título do vídeo",
  "descricao": "Descrição completa",
  "tags": ["tag1", "tag2"],
  "playlist_id": "PLxxxxxxx",
  "agendar_para": "2026-03-20T18:00:00Z"  // opcional, ISO 8601 UTC
}
"""

import os
import sys
import json
from pathlib import Path
from datetime import datetime

# Canais da Lu por idioma — preencher com os Channel IDs reais
CANAIS_YOUTUBE = {
    "pt": os.environ.get("YOUTUBE_CHANNEL_PT", "UCaVxP3Jj67Ko-f4stRabrkA"),
    "es": os.environ.get("YOUTUBE_CHANNEL_ES", "UC7DwigoUdNYXAkv0d-KehVQ"),
    "en": os.environ.get("YOUTUBE_CHANNEL_EN", "UC1TB05Es-2GHi8RLuYienkQ"),
}

def publicar_video(config: dict) -> str | None:
    """
    Publica o vídeo no canal correto via YouTube Data API v3.
    Requer autenticação OAuth2 configurada.
    Retorna o video_id se bem-sucedido.
    """
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from google.oauth2.credentials import Credentials
    except ImportError:
        print("❌ Instale: pip install google-api-python-client google-auth")
        return None

    idioma = config.get("idioma", "pt")
    credentials_path = os.environ.get(
        f"YOUTUBE_CREDENTIALS_{idioma.upper()}",
        f"youtube_credentials_{idioma}.json"
    )

    if not Path(credentials_path).exists():
        print(f"❌ Credenciais OAuth não encontradas: {credentials_path}")
        print("   Execute o fluxo de autenticação OAuth primeiro.")
        return None

    creds = Credentials.from_authorized_user_file(credentials_path)
    youtube = build("youtube", "v3", credentials=creds)

    # Metadados do vídeo
    body = {
        "snippet": {
            "title": config["titulo"],
            "description": config["descricao"],
            "tags": config.get("tags", []),
            "categoryId": "27",  # Educação
            "defaultLanguage": idioma,
        },
        "status": {
            "privacyStatus": "private",  # começa privado
            "selfDeclaredMadeForKids": False,
        }
    }

    # Agendamento (opcional)
    if config.get("agendar_para"):
        body["status"]["privacyStatus"] = "private"
        body["status"]["publishAt"] = config["agendar_para"]

    # Upload do vídeo
    media = MediaFileUpload(
        config["video_path"],
        mimetype="video/mp4",
        resumable=True,
        chunksize=1024 * 1024 * 10  # 10 MB por chunk
    )

    print(f"📤 Enviando vídeo para YouTube ({idioma.upper()})...")
    request = youtube.videos().insert(
        part="snippet,status",
        body=body,
        media_body=media
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            progresso = int(status.progress() * 100)
            print(f"   Progresso: {progresso}%", end="\r")

    video_id = response["id"]
    print(f"\n  ✅ Vídeo publicado! ID: {video_id}")
    print(f"  🔗 https://www.youtube.com/watch?v={video_id}")

    # Adiciona à playlist se especificado
    if config.get("playlist_id"):
        youtube.playlistItems().insert(
            part="snippet",
            body={
                "snippet": {
                    "playlistId": config["playlist_id"],
                    "resourceId": {"kind": "youtube#video", "videoId": video_id}
                }
            }
        ).execute()
        print(f"  📋 Adicionado à playlist: {config['playlist_id']}")

    # Upload da thumbnail
    if config.get("thumbnail_path") and Path(config["thumbnail_path"]).exists():
        youtube.thumbnails().set(
            videoId=video_id,
            media_body=MediaFileUpload(config["thumbnail_path"])
        ).execute()
        print(f"  🖼️  Thumbnail definida")

    return video_id


def main():
    if len(sys.argv) < 2:
        print("Uso: python publicar_youtube.py <config.json>")
        sys.exit(1)

    config = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    video_id = publicar_video(config)

    if video_id:
        print(f"\n✅ Publicação concluída! Video ID: {video_id}")
    else:
        print("\n❌ Falha na publicação.")
        sys.exit(1)


if __name__ == "__main__":
    main()
