const fs = require("fs");
const path = require("path");
const extract = require("extract-zip")
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var semver = require('semver');
var builder = new xml2js.Builder({
    xmldec: {
        version: '1.0',
        encoding: 'UTF-8'
    }
});

async function replaceIcons(context) {
    const projectRoot = context.opts.projectRoot;

    const usesNewStructure = fs.existsSync(path.join(projectRoot, 'platforms', 'android', 'app'));
    const basePath = usesNewStructure ? path.join(projectRoot, 'platforms', 'android', 'app', 'src', 'main') : path.join(projectRoot, 'platforms', 'android');
    var configPath = path.join(basePath, 'res', 'xml', 'config.xml');

    var env = getConfigParser(context, configPath).getPreference('ICON_ENV') || ""; // Variável do ambiente
    const tempDir = path.join(projectRoot, "temp_icons");
    const androidResPath = path.join(projectRoot, "platforms/android/app/src/main/res/");

    //env = "dev";

    // Mapear os arquivos ZIP para os ambientes
    const zipFiles = {
        dev: path.join(__dirname, '..', 'dev.zip'),
        tst: path.join(__dirname, '..', 'tst.zip')
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
            "mipmap-ldpi",
            "mipmap-mdpi",
            "mipmap-hdpi",
            "mipmap-xhdpi",
            "mipmap-xxhdpi",
            "mipmap-xxxhdpi",
        ];


        fs.readdir(androidResPath, (err, files) => {
          if (err) {
            console.error('Erro ao ler o diretório:', err);
            return;
          }
          files.forEach(file => {
            const filePath = path.join(androidResPath, file);
            fs.stat(filePath, (err, stats) => {
              if (err) {
                console.error('Erro ao obter informações do arquivo:', err);
                return;
              }
              if (stats.isDirectory()) {
                console.log('Diretório:', file);
              } else if (stats.isFile()) {
                console.log('Arquivo:', file);
              }
            });
          });
        });


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


function getConfigParser(context, config) {

    if (semver.lt(context.opts.cordova.version, '5.4.0')) {
        ConfigParser = context.requireCordovaModule('cordova-lib/src/ConfigParser/ConfigParser');
    } else {
        ConfigParser = context.requireCordovaModule('cordova-common/src/ConfigParser/ConfigParser');
    }

    return new ConfigParser(config);
}

module.exports = replaceIcons;
