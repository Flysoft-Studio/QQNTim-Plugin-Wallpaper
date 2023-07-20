export const id = "wallpaper-plugin" as const;

export const defaults: PluginConfig = {
    wallpapers: [],
    duration: 120,
    position: "fill",
};
export function getPluginConfig(config: Config | undefined) {
    return Object.assign({}, defaults, config?.[id] || {});
}

export interface Wallpaper {
    source: "none" | "file" | "dir" | "url" | "script";
    files: string[];
    dirs: string[];
    urls: string[];
    script: string;
}
export interface PluginConfig {
    wallpapers: Wallpaper[];
    duration: 30 | 60 | 120 | 300 | 600 | 1800 | 3600;
    position: "fit" | "tile" | "center" | "fill" | "stretch";
}
export type Config = {
    [X in typeof id]?: Partial<PluginConfig>;
};
