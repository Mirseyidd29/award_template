import { Config } from "@remotion/cli/config";

Config.setEntryPoint("./src/index.ts");
Config.setVideoImageFormat("jpeg");
// In the cloud container, Chromium must go through the HTTPS proxy; locally this env var is unset.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
