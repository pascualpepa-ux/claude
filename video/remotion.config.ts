import { Config } from "@remotion/cli/config";

// Calidad para YouTube: H.264, buena calidad de imagen y audio AAC.
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
// Usa el Chromium que ya está instalado en esta máquina.
if (process.env.CHROMIUM_PATH) Config.setBrowserExecutable(process.env.CHROMIUM_PATH);
Config.setChromiumOpenGlRenderer("swangle");
