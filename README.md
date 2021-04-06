# ssiptv.js

Nginx script for creating m3u playlist from video directory.

Supported videos by extension: `avi`, `mkv`, `mp4`, `ts`.

Also supports `m3u` and source [LiveProxy](https://liveproxy.github.io/url.html#liveproxy-command) playlists.

## Usage

Script requires Nginx variable `$video_dir`. Sample `nginx.conf`:

```nginx
load_module /usr/lib/nginx/modules/ngx_http_js_module.so;
http {
    include       mime.types;
    default_type  application/octet-stream;
    js_import     /path/to/ssiptv.js;

    sendfile        on;

    keepalive_timeout  65;

    server {
        listen <port>;

        # Path for static files
        set $video_dir /path/to/video/directory;
        root $video_dir;
        autoindex on;

        location ~ \.m3u$ {
            js_content ssiptv.m3u;
        }

        # playlists with commands for LiveProxy
        location ~ \.liveproxy$ {
            js_content ssiptv.liveproxy;
        }
    }
}
```

In SS IPTV add external playlist with url `http://ip:port/.m3u`.

Where `ip` is Nginx's IP, port is from `listen <port>;` directive.

If there is a picture (jpg or png) with the same basename as video or directory it will be used as logo.

### LiveProxy

Script converts commands from `playlist.liveproxy` files to LiveProxy's base64 urls. Sample file (from LiveProxy docs):

```m3u
#EXTM3U
#EXTINF:-1,Arte FR
streamlink https://www.arte.tv/fr/direct/ 720p,720p_alt,best
#EXTINF:-1,France24
streamlink https://www.youtube.com/user/france24 best
#EXTINF:-1 tvg-id="EuroNews" tvg-name="EuroNews",Euronews
streamlink https://www.euronews.com/live best
#EXTINF:-1,France24
youtube-dl https://www.youtube.com/user/france24/live
```
