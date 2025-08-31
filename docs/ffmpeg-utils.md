# FFmpeg Utilities Reference

## Quoting & Escaping
- Use backslash (`\`) to escape special characters.
- To include literal spaces or quotes:
```bash
'Crime d'\''Amour'
```

## Time Duration Formats
- `HH:MM:SS[.m...]`
- `S[.m...][s|ms|us]`

## Video Size Abbreviations
| Abbreviation | Resolution     |
|--------------|----------------|
| hd720        | 1280x720       |
| hd1080       | 1920x1080      |
| 4k           | 4096x2160      |

## Channel Layouts
- `stereo` → `FL+FR`
- `5.1` → `FL+FR+FC+LFE+BL+BR`
