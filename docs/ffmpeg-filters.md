# FFmpeg Filters Reference

## Filtergraph Syntax
- Simple filtergraphs via `-vf`
- Complex filtergraphs via `-filter_complex`

## Sample Filters
- `yadif` (deinterlace)
- `scale=1280:720`
- `overlay`

### Example
```bash
ffmpeg -i input.mp4 -vf "yadif,scale=1280:720" output.mp4
```
