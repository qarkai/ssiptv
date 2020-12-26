# ssiptv.js

Nginx script for creating m3u playlist from video directory.

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
    }
}
```

In SS IPTV add external playlist with url `http://ip:port/.m3u`.

Where `ip` is Nginx's IP, port is from `listen <port>;` directive.
