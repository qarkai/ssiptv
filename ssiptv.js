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

function isPlaylist(name) {
    return name.endsWith('.liveproxy')
        || name.endsWith('.m3u');
}

function getBasename(name) {
    return name.split('.').slice(0, -1).join('.');
}

function getLogoExtension(path) {
    var logoExtensions = ['jpeg', 'jpg', 'png'];
    return logoExtensions.find(ext => {
        try {
            fs.accessSync(`${path}.${ext}`, fs.constants.R_OK);
            return true;
        } catch (e) {
            return false;
        }
    });
}

function getLogo(name, dir, localDir, defaultLogo) {
    var ext = getLogoExtension(`${localDir}/${name}`);
    return ext ? `${dir}${name}.${ext}` : defaultLogo;
}

function getPlaylistLogo(name, dir, localDir) {
    return getLogo(name, dir, localDir, 'video-dir.png');
}

function getVideoLogo(name, dir, localDir) {
    return getLogo(name, dir, localDir, 'video-file.png');
}

function filesToM3U(dirContent, host, dir, localDir) {
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
            logo = getPlaylistLogo(item.name, dir, localDir);
            type = 'playlist';
            url += '.m3u';
        } else if (item.isFile()) {
            if (isPlaylist(item.name)) {
                logo = getPlaylistLogo(getBasename(item.name), dir, localDir);
                type = 'playlist';
            } else if (isVideo(item.name)) {
                logo = getVideoLogo(getBasename(item.name), dir, localDir);
                type = 'video';
            }
        }

        if (!type) {
            return;
        }

        logo = encodeURI(logo);

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
        r.return(200, fs.readFileSync(m3uFile));
        return;
    } catch (e) {}

    var files = fs.readdirSync(localDir, {withFileTypes: true});
    files.sort(compareFiles);

    var s = filesToM3U(files, r.headersIn.Host, dir, localDir);
    r.return(200, s);
}

function liveproxyToM3U(content, host) {
    var s = '';
    var lines = content.split(/\r?\n/);

    lines.forEach(line => {
        if (line === '' || line.startsWith('#')) {
            s += `${line}\n`;
        } else {
            var base64 = line.toString('base64');
            s += `http://${host}:53422/base64/${base64}/\n`;
        }
    }, s);

    return s;
}

function liveproxy(r) {
    var path = decodeURI(r.uri.slice(1)); // cut /
    var localPath = `${r.variables.video_dir}/${path}`;

    try {
        // check if file exists and convert content to liveproxy links
        fs.accessSync(localPath, fs.constants.R_OK);

        var content = fs.readFileSync(localPath, 'utf8');
        var host = r.headersIn.Host.split(':')[0]; // get host part of host:port string
        var s = liveproxyToM3U(content, host);
        r.return(200, s);
    } catch (e) {}
}

export default {m3u, liveproxy};
