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

    console.log(`[Replace Icons] projectRoot: ${projectRoot}`);

    //console.log(getDirectoryStructure(projectRoot));

    const androidResPath = path.join(projectRoot, "res/android");

    


    // Path to the app's config.xml file
    const configXmlPath = path.join(projectRoot, 'config.xml');

    // Check if the config.xml file exists
    if (fs.existsSync(configXmlPath)) {
      // Read and print the config.xml file
      const configXmlContent = fs.readFileSync(configXmlPath, 'utf-8');
      console.log('--- App config.xml Content ---');
      console.log(configXmlContent);
    } else {
      console.error('Error: config.xml file not found in', projectRoot);
    }



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
            "drawable-ldpi",
            "drawable-mdpi",
            "drawable-hdpi",
            "drawable-xhdpi",
            "drawable-xxhdpi",
            "drawable-xxxhdpi",
        ];


        //listFilesRecursively(projectRoot);


        // Substituir os ícones
        densityFolders.forEach((folder) => {
            console.log(`[Replace Icons] densityFolder: ${folder}`);

            const sourceIcon = path.join(tempDir, folder, "icon.png");
            const targetDir = path.join(androidResPath, folder);
            const targetIcon = path.join(targetDir, "icon-"+env+".png");

            console.log(`[Replace Icons] sourceIcon: ${sourceIcon}`);
            console.log(`[Replace Icons] targetDir: ${targetDir}`);
            console.log(`[Replace Icons] targetIcon: ${targetIcon}`);

            if (fs.existsSync(targetIcon)) {
                console.log(`[Replace Icons] targetIcon exists`);
            }

            if (fs.existsSync(sourceIcon)) {
                console.log(`[Replace Icons] Substituindo: ${targetIcon}`);
                fs.mkdirSync(targetDir, { recursive: true });
                console.log(`[Replace Icons] Copiando: ${sourceIcon} para ${targetIcon}`);
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

function listFilesRecursively(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error('Erro ao ler o diretório:', err);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Erro ao obter informações do arquivo:', err);
          return;
        }
        if (stats.isDirectory()) {
          console.log('Diretório:', file);
          listFilesRecursively(filePath); // Chamada recursiva para subdiretórios
        } else if (stats.isFile()) {
          console.log('Arquivo:', dirPath+"/"+file);
        }
      });
    });
  });
}

function listFiles(dirPath) {
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      console.error('Erro ao ler o diretório:', err);
      return;
    }
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Erro ao obter informações do arquivo:', err);
          return;
        }
        if (stats.isDirectory()) {
          console.log('Diretório:', file);
        } else if (stats.isFile()) {
          console.log('Arquivo:', dirPath+"/"+file);
        }
      });
    });
  });
}

function getDirectoryStructure(dirPath, indent = '') {
  let result = `[Replace Icons]  ${dirPath}` + '\n'; // To hold the concatenated result

  try {
    const filesAndFolders = fs.readdirSync(dirPath);

    filesAndFolders.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);

      // Append the current file/folder with indentation
      result += indent + file + '\n';

      // If it's a directory, recursively append its contents
      if (stats.isDirectory()) {
        result += getDirectoryStructure(fullPath, indent + '  '); // Indent further for subdirectories
      }
    });
  } catch (error) {
    console.error('Error reading directory:', error);
  }

  return result; // Return the concatenated result
}



module.exports = replaceIcons;