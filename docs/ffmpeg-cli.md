# FFmpeg CLI Reference

## Synopsis
```
ffmpeg [global_options] {[input_file_options] -i input_url} ... {[output_file_options] output_url} ...
```

## Description
FFmpeg is a universal media converter that can read a wide variety of inputs—and transcode, filter, or stream outputs.
Options apply to the next specified file, and stream specifiers allow selection of specific streams (e.g., `-map 0:1`).

## Examples
```bash
# Convert .avi to .mp4
ffmpeg -i input.avi output.mp4

# Force output framerate
ffmpeg -i input.avi -r 24 output.mp4

# Streamcopy specific stream
ffmpeg -i in.mkv -map 0:1 -c copy out.mp4
```
