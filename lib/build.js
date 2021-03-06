const fs = require("fs");
const mkdirp = require('mkdirp');
const { dirname, join, isAbsolute, } = require('path');
const { youdao, baidu, google } = require('translation.js')

const fromLan = "zh-CN";
const toLan = "en";

let engineMapper = {
    "g": google,
    "y": youdao,
    "b": baidu,
}
let engineName = {
    g: "google",
    y: "youdao",
    b: "baidu",
}
let engine = google;

module.exports = function(inputDir, outputDir, directly, type) {
    engine = engineMapper[type] || engine;
    console.log("----------", engineName[type] || "google", "----------");
    // 直接翻译 json 文件
    if (directly) {
        if (inputDir == "./") {
            inputDir = "zh.json";
        }
        let stat = fs.statSync(inputDir);
        if (!stat.isFile()) {
            console.log('必须提供 -i 参数，并且指定为某个 json 文件');
            return;
        }

        fs.readFile(inputDir, function(err, data) {
            if (err) throw err;

            let idText = JSON.parse(data.toString());

            resultOutput(translate(idText), outputDir);
        });
        return;
    }
    // 解析并翻译目录下的 jsx
    fs.readdir(inputDir, function(err, files) {
        if (err) throw err;

        let realFiles = files.map(it => `${isAbsolute(inputDir) ? '' : './'}${join(inputDir, it)}`);
        parsing(realFiles, outputDir);
    });
}

// parsing(['../test/input.txt', '../test/input2.txt']);

function parsing(fileArray = [], outputDir) {
    // formatMessage({id: "Modal.confirm.delete-title", defaultMessage: "您是否确认要删除这项内容"})
    let re1 = /formatMessage.+id[: ,='"]+([a-z]{1}[\w\.-]+)[: ,'"]+defaultMessage[: ,='"]+([^: ,'"]+)/g;
    // <FormattedMessage id="Table.title-operate.modify" defaultMessage="修改" />
    let re2 = /FormattedMessage.+id[: ,='"]+([a-z]{1}[\w\.-]+)[: ,'"]+defaultMessage[: ,='"]+([^: ,'"]+)/g;
    // UtilTool.formatMessage("index.table-title-url", "操作路径", xx, xx);
    let re3 = /formatMessage[ ('"]+([a-z]{1}[\w\.-]+)[: ,'"]+([^: ,'"]+)/g;

    let idTextArray = fileArray.map(file => {
        let stat = fs.statSync(file);
        if (!stat.isFile()) return null;

        let data = fs.readFileSync(file);
        return collectIdText(file, data.toString(), [re1, re2, re3]);
    });

    let idText = {};
    idTextArray.forEach(it => {
        if (!it) return;

        Object.keys(it.data).forEach(item => {
            if (!!idText[item]) {
                console.warn(`文件 ${it.name} 中 key[${item}] 在多个文件中存在定义`);
            }
        });
        Object.assign(idText, it.data);
    })

    // console.log(idText);

    // 默认 zh.json
    genFile(idText, outputDir);
    // 输出 译后文件
    resultOutput(translate(idText), outputDir);
}

function resultOutput(promises, outputDir) {
    Promise.all(promises).then(res => {
        let data = {};
        res.forEach(it => {
            data[it.id] = it.text;
        });
        // 翻译的 xx.json
        genFile(data, outputDir, toLan);
    });
}

function collectIdText(file, fileString, regexpArray = []) {
    let idText = {};
    regexpArray.forEach(regexp => {
        fileString.replace(regexp, (all, id, text) => {
            if (!!id && !!idText[id] && idText[id] != text) {
                console.warn(`文件 ${file} 中 key[${id}] 可能被重复定义 old[${idText[id]}] new[${text}]`);
            }
            idText[id] = text;
        });
    });
    return { name: file, data: idText };
}

// 串行翻译
// function translate(textArray, i = 0) {
//     engine.translate({
//         text: textArray[i++],
//         from: fromLan,
//         to: toLan,
//     }).then(response => {
//         console.log(response.result[0]);
//         if (i < textArray.length) {
//             translate(textArray, i);
//         }
//     });
// }

// 并行翻译
function translate(textObject) {
    return Object.keys(textObject).map(it => {
        return new Promise((resolve, reject) => {
            engine.translate({
                text: textObject[it],
                from: fromLan,
                to: toLan,
            }).then(response => {
                resolve({ id: it, text: response.result[0] || '-----------------------------' });
            }).catch(error => {
                console.log(`key [${it}] 翻译失败`);
            });
        });
    });
}

// 输出多语文件
function genFile(data = {}, outputDir, fileName = "zh") {
    let path = `${join(outputDir, fileName)}.json`;

    mkdirp(dirname(path), function(err) {
        if (err) throw err;

        fs.writeFile(path, JSON.stringify(data, null, ' \t'), (err) => {
            if (err) throw err;
            console.log(`${fileName}.json 已生成`);
        });
    });
}