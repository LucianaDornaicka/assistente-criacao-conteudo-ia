# Agente de Produção de Vídeos — Lu Dornaicka

## O que este projeto faz

Este agente automatiza a produção de vídeos bíblicos educativos em 3 idiomas (PT, ES, EN):
1. Traduz o script de Português para Espanhol e Inglês
2. Gera os áudios via ElevenLabs (vozes Luciana e Tom)
3. Gera imagens no estilo whiteboard bíblico via DALL-E 3
4. Publica nos 3 canais do YouTube

---

## Configuração inicial (fazer UMA VEZ)

### 1. Instalar dependências
```bash
pip install anthropic openai requests python-dotenv
```

### 2. Configurar as chaves de API
```bash
cp .env.example .env
# Abra o arquivo .env e preencha com suas chaves reais
```

### 3. Obter os Voice IDs do ElevenLabs
- Acesse: https://elevenlabs.io/app/voice-lab
- Clique em **My Voices**
- Clique na voz **Luciana** → copie o **Voice ID**
- Clique na voz **Tom/Jamahal** → copie o **Voice ID**
- Cole os IDs no arquivo `.env`

---

## Como usar para cada novo vídeo

### Passo 1 — Preparar o script
Crie o arquivo do script em: `videos/YYYY-MM-DD_titulo/script_pt.txt`

Use os marcadores de voz:
- `[LUCIANA]...[/LUCIANA]` → voz da Luciana (início e fim do vídeo)
- `[TOM]...[/TOM]` → voz do Tom/Jamahal (narração principal)

### Passo 2 — Traduzir (automático)
```bash
python scripts/traduzir_script.py videos/PASTA-DO-VIDEO/script_pt.txt videos/PASTA-DO-VIDEO/
```
Gera: `script_es.txt` e `script_en.txt`

### Passo 3 — Gerar áudios (automático)
```bash
python scripts/gerar_audio.py videos/PASTA-DO-VIDEO/script_pt.txt pt videos/PASTA-DO-VIDEO/audios/
python scripts/gerar_audio.py videos/PASTA-DO-VIDEO/script_es.txt es videos/PASTA-DO-VIDEO/audios/
python scripts/gerar_audio.py videos/PASTA-DO-VIDEO/script_en.txt en videos/PASTA-DO-VIDEO/audios/
```
Gera: arquivos MP3 separados por voz + manifesto JSON com a ordem

### Passo 4 — Gerar imagens (automático)
```bash
python scripts/gerar_imagens.py videos/PASTA-DO-VIDEO/script_pt.txt videos/PASTA-DO-VIDEO/imagens/ 8
```
O número `8` é a quantidade de imagens. Ajuste conforme necessário.

### Passo 5 — Animação e edição (manual)
- Importe as imagens no **SpeedPaint** para criar o efeito "mãozinha desenhando"
- Edite no **CapCut**: vídeo animado + áudios MP3 + legendas
- Exporte: `video_pt.mp4`, `video_es.mp4`, `video_en.mp4`

### Passo 6 — Publicar no YouTube (automático, com confirmação)
```bash
python scripts/publicar_youtube.py videos/PASTA-DO-VIDEO/config_pt.json
```

### Passo 7 — Publicar no Spotify (manual)
- PT: https://creators.spotify.com/pod/show/6eksxTNuLAKqkEFf5FCsRR/home
- ES: https://creators.spotify.com/pod/show/0aqwiMj5HYw3APjH4q8ban/home
- EN: https://creators.spotify.com/pod/show/3KnWI3krZLKt8iJThUd6DA/home

---

## Estrutura de pastas

```
agente-videos-lu/
├── CLAUDE.md              ← este arquivo (instruções para o agente)
├── .env.example           ← modelo das variáveis de ambiente
├── .env                   ← suas chaves reais (NÃO commitar no git!)
├── scripts/
│   ├── traduzir_script.py
│   ├── gerar_audio.py
│   ├── gerar_imagens.py
│   └── publicar_youtube.py
└── videos/
    └── 2026-03-14_antigo-testamento-ep01/
        ├── script_pt.txt  ← script formatado com marcadores
        ├── script_es.txt  ← gerado automaticamente
        ├── script_en.txt  ← gerado automaticamente
        ├── audios/        ← MP3s gerados
        └── imagens/       ← PNGs gerados
```

---

## Marcadores de voz — referência rápida

```
[LUCIANA]
Texto narrado pela Luciana (abertura e fechamento do vídeo).
[/LUCIANA]

[TOM]
Texto narrado pelo Tom/Jamahal (corpo principal do vídeo).
Pode ter múltiplos blocos [TOM]...[/TOM].
[/TOM]
```

---

## Estilo visual padrão das imagens

Sempre usar este estilo no DALL-E 3:
> Whiteboard drawing illustration style. Clean black outlines, hand-drawn appearance.
> Solid black contours, flat soft colors inside (beige, warm yellow, light blue, sand tones).
> Simple white/cream background. Educational animated video style, biblical content.
> Organized strokes suitable for draw-on animation effect.
> Consistent, minimalist and friendly style. No gradients, no shadows, no photorealism.
> Characters in biblical clothing (robes, sandals, Middle Eastern setting).

---

## Prompt para o agente no Claude Code

Quando quiser produzir um novo vídeo, use este prompt:

```
Preciso produzir um novo vídeo bíblico. O script está em:
videos/[PASTA]/script_pt.txt

Por favor:
1. Traduza para Espanhol e Inglês
2. Mostre as traduções para eu revisar
3. Após minha aprovação, gere os 6 áudios (Luciana + Tom × 3 idiomas)
4. Gere 8 imagens no estilo whiteboard bíblico
5. Mostre as imagens para eu aprovar
```
