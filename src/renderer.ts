import { PluginConfig, Wallpaper, getPluginConfig } from "./config";
import { s } from "./utils/sep";
import * as qqntim from "qqntim/renderer";
const { fs } = qqntim.modules;

export default class Entry implements QQNTim.Entry.Renderer {
    private config: PluginConfig;
    constructor() {
        this.config = getPluginConfig(qqntim.env.config.plugins.config);
    }
    private pathToURL(file: string) {
        return encodeURI(`appimg://${file.replaceAll(s, "/")}`);
    }
    private async fileToURLs(files: string[]) {
        return (
            await Promise.all(
                files.map(async (file) => {
                    if (!(await fs.exists(file)) || !(await fs.stat(file)).isFile()) return;
                    return this.pathToURL(file);
                }),
            )
        ).filter(Boolean) as string[];
    }
    private async dirToURLs(dirs: string[]) {
        const urls: string[] = [];
        await Promise.all(
            dirs.map(async (dir) => {
                if (!(await fs.exists(dir)) || !(await fs.stat(dir)).isDirectory()) return;
                urls.push(
                    ...((
                        await Promise.all(
                            (
                                await fs.readdir(dir)
                            ).map(async (item) => {
                                const path = `${dir}${s}${item}`;
                                if ((await fs.exists(path)) && (await fs.stat(path)).isFile()) return this.pathToURL(path);
                            }),
                        )
                    ).filter(Boolean) as string[]),
                );
            }),
        );
        return urls;
    }
    private async getWallpaperURLs(wallpaper: Wallpaper) {
        const urls: string[] = [];
        if (wallpaper.source == "file" && wallpaper.files) urls.push(...(await this.fileToURLs(wallpaper.files)));
        else if (wallpaper.source == "dir" && wallpaper.dirs) urls.push(...(await this.dirToURLs(wallpaper.dirs)));
        else if (wallpaper.source == "url" && wallpaper.urls) urls.push(...wallpaper.urls);
        else if (wallpaper.source == "script" && wallpaper.script) urls.push(...(await new Function(wallpaper.script)()));
        return urls;
    }
    onWindowLoaded(): void {
        document.body.classList.add(`wallpaper-${this.config.position}`);

        const urls: string[] = [];
        let currentIdx = 0;

        Promise.all(this.config.wallpapers.map(async (wallpaper) => urls.push(...(await this.getWallpaperURLs(wallpaper))))).then(() => {
            if (urls.length == 0) return;

            const renderWallpaper = () => {
                document.body.style.backgroundImage = `url(${urls[currentIdx]})`;
                currentIdx++;
                if (currentIdx >= urls.length) currentIdx = 0;
            };

            setInterval(renderWallpaper, this.config.duration * 1000);
            renderWallpaper();
        });
    }
}
