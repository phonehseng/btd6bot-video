# btd6bot-video

The videos about [btd6bot](https://github.com/phonehseng/btd6bot): a long
video ("Pop Theory", a zero-to-hero story of the bot's development) and three
vertical shorts. They are rendered from an HTML animation frame by frame,
with real data made by the bot's own code and footage from its own
recordings. Everything is in `video/` - see `video/README.md`.

The bot is a separate repository. These scripts expect it checked out next
to this one (`../btd6bot`), or at the path in the `BTD6BOT` environment
variable, and read its code and logs from there.

```
python video/prep_assets.py
python video/render.py long short1 short2 short3
```

Needs Python 3.12 with the bot's requirements, Playwright (it drives the
installed Microsoft Edge) and, for the shorts' voice, Piper with the
`en_GB-alan-medium` voice in `~/.btd6bot_cache/tools/piper/`. Videos are
written to `~/Videos/BTD6 Bot/Explainer/`.
