var fs = require('fs');

function compareNames(a, b) {
    if (a < b) {
        return -1;
    }

    if (a > b) {
        return 1;
    }

    return 0;
}

function compareFiles(a, b) {
    if ((a.isDirectory() && b.isDirectory()) || (a.isFile() && b.isFile())) {
        // TODO a.name.localeCompare(b.name);
        return compareNames(a.name, b.name);
    }

    if (a.isDirectory()) {
        return -1;
    }

    return 1;
}

function isVideo(name) {
    return name.endsWith('.avi')
        || name.endsWith('.mkv')
        || name.endsWith('.mp4')
        || name.endsWith('.ts');
}

function filesToM3U(dirContent, host, dir) {
    var extension = /\.[^/.]+$/;
    var s = '#EXTM3U\n';

    if (dir) {
        dir += '/';
    }

    dirContent.forEach(item => {
        var logo;
        var type;
        var url = encodeURI(`${dir}${item.name}`);

        if (item.isDirectory()) {
            logo = 'video-dir.png';
            type = 'playlist';
            url += '.m3u';
        } else if (item.isFile()) {
            if (isVideo(item.name)) {
                logo = 'video-file.png';
                type = 'video';
            } else if (item.name.endsWith('.m3u')) {
                logo = 'video-dir.png';
                type = 'playlist';
            }
        }

        if (!type) {
            return;
        }

        s += `#EXTINF:0 tvg-logo="http://${host}/${logo}" type="${type}", ${item.name.replace(extension, '')}\n`;
        s += `http://${host}/${url}\n`;
    }, s);

    return s;
}

function m3u(r) {
    var dir = decodeURI(r.uri.slice(1, -4)); // cut / and .m3u
    var localDir = `${r.variables.video_dir}/${dir}`;

    try {
        // check if m3u file exists and return it's contents
        var m3uFile = `${localDir}.m3u`;
        fs.accessSync(m3uFile, fs.constants.R_OK);
        r.return(200, fs.readFileSync(m3uFile), 'utf8');
        return;
    } catch (e) {}

    var files = fs.readdirSync(localDir, {withFileTypes: true});
    files.sort(compareFiles);

    var s = filesToM3U(files, r.headersIn.Host, dir);
    r.return(200, s);
}

export default {m3u};
