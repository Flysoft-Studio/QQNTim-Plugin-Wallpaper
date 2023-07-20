import { Wallpaper } from "./config";
import { usePluginConfig } from "./utils/hooks";
import { defineSettingsPanels } from "qqntim-settings";
import { Button, Dropdown, Input, SettingsBox, SettingsBoxItem, SettingsSection, Switch } from "qqntim-settings/components";
import { dialog } from "qqntim/renderer";

export default class Entry implements QQNTim.Entry.Renderer {
    constructor() {
        // 如果不需要设置界面，将下一行注释掉即可；如果需要在设置项目旁边加一个小图标，请将 `undefined` 改为一段 HTML 代码（可以是 `<svg>`, `<img>` 等等）。
        defineSettingsPanels(["壁纸插件", SettingsPanel, undefined]);
    }
}

function SettingsPanel({ config: _config, setConfig: _setConfig }: QQNTim.Settings.PanelProps) {
    const [pluginConfig, setPluginConfig] = usePluginConfig(_config, _setConfig);

    return (
        <>
            <SettingsSection
                title="插件设置"
                buttons={[
                    <Button
                        onClick={() => {
                            setPluginConfig("wallpapers", [...pluginConfig.wallpapers, { source: "none", files: [], dirs: [], urls: [], script: "" }]);
                        }}
                        primary={false}
                        small={true}
                    >
                        增加新壁纸源
                    </Button>,
                ]}
            >
                <SettingsBox>
                    <SettingsBoxItem title="位置" description={["指定壁纸的定位方式。"]}>
                        <Dropdown
                            items={[
                                ["fit" as const, "适应"],
                                ["tile" as const, "平铺"],
                                ["center" as const, "居中"],
                                ["fill" as const, "填充"],
                                ["stretch" as const, "拉伸"],
                            ]}
                            selected={pluginConfig.position}
                            onChange={(state) => setPluginConfig("position", state)}
                            width="150px"
                        />
                    </SettingsBoxItem>
                    <SettingsBoxItem title="更换间隔" description={["指定壁纸的切换间隔（如果存在多个壁纸）。"]}>
                        <Dropdown
                            items={[
                                [30 as const, "30 秒钟"],
                                [60 as const, "1 分钟"],
                                [120 as const, "2 分钟"],
                                [300 as const, "5 分钟"],
                                [600 as const, "10 分钟"],
                                [1800 as const, "30 分钟"],
                                [3600 as const, "1 小时"],
                            ]}
                            selected={pluginConfig.duration}
                            onChange={(state) => setPluginConfig("duration", state)}
                            width="150px"
                        />
                    </SettingsBoxItem>
                </SettingsBox>
            </SettingsSection>
            {pluginConfig.wallpapers.map((wallpaper, idx) => {
                const setWallpaper = <T extends keyof Wallpaper>(key: T, value: Wallpaper[T]) =>
                    setPluginConfig(
                        "wallpapers",
                        pluginConfig.wallpapers.map((currentWallpaper, currentIdx) => (currentIdx == idx ? { ...currentWallpaper, [key]: value } : currentWallpaper)),
                    );
                return (
                    <SettingsSection
                        // rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={idx}
                        title={`壁纸 ${idx + 1}`}
                        buttons={[
                            <Button
                                onClick={() =>
                                    setPluginConfig(
                                        "wallpapers",
                                        pluginConfig.wallpapers.filter((currentWallpaper) => currentWallpaper != wallpaper),
                                    )
                                }
                                primary={false}
                                small={true}
                            >
                                删除此壁纸源
                            </Button>,
                        ]}
                    >
                        <SettingsBoxItem title="来源" description={["指定此插件应从何处获取壁纸。"]}>
                            <Dropdown
                                items={[
                                    ["none" as const, "无"],
                                    ["file" as const, "文件"],
                                    ["dir" as const, "目录"],
                                    ["url" as const, "网址"],
                                    ["script" as const, "自定义脚本"],
                                ]}
                                selected={wallpaper.source}
                                onChange={(state) => setWallpaper("source", state)}
                                width="150px"
                            />
                        </SettingsBoxItem>
                        {wallpaper.source == "file" && (
                            <SettingsBoxItem title="文件" description={["指定壁纸文件（支持多选）。", `当前文件：${wallpaper.files.join(", ") || "无"}`]}>
                                <Button
                                    onClick={() => {
                                        dialog.openDialog({ title: "打开图片", filters: [{ name: "支持的图片", extensions: ["jpg", "jpeg", "png", "gif", "svg", "bmp", "ico", "webp"] }], properties: ["openFile", "multiSelections"] }).then((ret) => {
                                            if (!ret.canceled) setWallpaper("files", [...wallpaper.files, ...ret.filePaths]);
                                        });
                                    }}
                                    primary={true}
                                    small={true}
                                >
                                    浏览
                                </Button>
                                <Button onClick={() => setWallpaper("files", [])} primary={false} small={true}>
                                    清空
                                </Button>
                            </SettingsBoxItem>
                        )}
                        {wallpaper.source == "dir" && (
                            <SettingsBoxItem title="文件" description={["指定包含壁纸文件的目录（支持多选）。", `当前目录：${wallpaper.files.join(", ") || "无"}`]}>
                                <Button
                                    onClick={() => {
                                        dialog.openDialog({ title: "打开目录", properties: ["openDirectory", "multiSelections"] }).then((ret) => {
                                            if (!ret.canceled) setWallpaper("dirs", [...wallpaper.files, ...ret.filePaths]);
                                        });
                                    }}
                                    primary={true}
                                    small={true}
                                >
                                    浏览
                                </Button>
                                <Button onClick={() => setWallpaper("dirs", [])} primary={false} small={true}>
                                    清空
                                </Button>
                            </SettingsBoxItem>
                        )}
                        {wallpaper.source == "url" && (
                            <SettingsBoxItem title="URL" description={["指定包含壁纸文件的 URL（使用换行区分多个 URL）。"]}>
                                <Input value={wallpaper.urls.join("\n")} onChange={(state) => setWallpaper("urls", state.split("\n"))} />
                            </SettingsBoxItem>
                        )}
                        {wallpaper.source == "script" && (
                            <SettingsBoxItem title="自定义脚本" description={["指定一个函数，该函数应返回一个返回网址数组的 Promise。示例：", 'return fetch("https://my-wallpaper-source.com/api.json")', "    .then((res)=>res.json()).then((data)=>data.urls);"]}>
                                <Input value={wallpaper.script} onChange={(state) => setWallpaper("script", state)} />
                            </SettingsBoxItem>
                        )}
                    </SettingsSection>
                );
            })}
        </>
    );
}
