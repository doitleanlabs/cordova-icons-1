const fs = require("fs");
const path = require("path");
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var semver = require('semver');
var builder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    }
const extract = require("extract-zip");

async function replaceIcons(context) {
    const projectRoot = context.opts.projectRoot;

    const usesNewStructure = fs.existsSync(path.join(projectRoot, 'platforms', 'android', 'app'));
    const basePath = usesNewStructure ? path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main') : path.join(projectRoot, 'platforms', 'android');
    var configPath = path.join(basePath, 'res', 'xml', 'config.xml');

    const env = getConfigParser(context, configPath).getPreference('ICON_ENV') || ""; // Variável do ambiente
    const tempDir = path.join(projectRoot, "temp_icons");
    const androidResPath = path.join(projectRoot, "platforms/android/app/src/main/res/");

    // Mapear os arquivos ZIP para os ambientes
    const zipFiles = {
        dev: path.join(projectRoot, "dev.zip"),
        tst: path.join(projectRoot, "tst.zip"),
    };

    // Verificar se o ambiente é válido
    if (!env || !zipFiles[env]) {
        console.log(`[Replace Icons] Variável ICON_ENV não definida ou inválida. Nenhuma ação será realizada.`);
        return;
    }

    const zipPath = zipFiles[env];

    // Verificar se o arquivo ZIP existe
    if (!fs.existsSync(zipPath)) {
        console.error(`[Replace Icons] Arquivo ${env}.zip não encontrado em: ${zipPath}`);
        return;
    }

    try {
        console.log(`[Replace Icons] Ambiente selecionado: ${env}`);
        console.log(`[Replace Icons] Extraindo ícones de: ${zipPath}`);
        await extract(zipPath, { dir: tempDir });

        // Pastas Android para ícones
        const densityFolders = [
            "drawable-ldpi",
            "drawable-mdpi",
            "drawable-hdpi",
            "drawable-xhdpi",
            "drawable-xxhdpi",
            "drawable-xxxhdpi",
        ];

        // Substituir os ícones
        densityFolders.forEach((folder) => {
            const sourceIcon = path.join(tempDir, folder, "icon.png");
            const targetDir = path.join(androidResPath, folder);
            const targetIcon = path.join(targetDir, "ic_launcher.png");

            if (fs.existsSync(sourceIcon)) {
                console.log(`[Replace Icons] Substituindo: ${targetIcon}`);
                fs.mkdirSync(targetDir, { recursive: true });
                fs.copyFileSync(sourceIcon, targetIcon);
            }
        });

        // Limpar o diretório temporário
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log("[Replace Icons] Ícones substituídos com sucesso!");
    } catch (err) {
        console.error("[Replace Icons] Erro ao substituir ícones:", err);
    }
}

module.exports = replaceIcons;
