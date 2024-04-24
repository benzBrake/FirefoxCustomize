// ==UserScript==
// @name           SaveAsPNG.uc.js
// @version        2024.04.24
// @author         Ryan
// @compatibility  Firefox 72
// @include        chrome://browser/content/browser.xhtml
// @homepageURL    https://github.com/benzBrake/FirefoxCustomize
// @description    保存图片为 PNG 格式
// ==/UserScript==
(function (ins) {
    const isChinese = Services.locale.appLocaleAsBCP47.includes("zh-");
    const label = isChinese ? "保存为 PNG 图片" : "Save as PNG";
    const menuItem = document.createXULElement("menuitem");
    menuItem.id = "context-video-saveimage-topng";
    menuItem.className = ins.className;
    menuItem.setAttribute("label", label);

    menuItem.addEventListener("command", async function () {
        const imageURL = gContextMenu.imageURL || gContextMenu.imageInfo.currentSrc || "";
        if (!imageURL) return;

        try {
            const filename = imageURL.split("/").pop();
            const { path } = await saveFileDialog(filename + ".png");
            if (!path) return;

            const imageBlob = await fetch(imageURL).then(res => res.blob());
            const base64data = await readBlobAsBase64(imageBlob);
            if (!base64data) {
                throw new Error(isChinese ? "无法获取图片类型" : "Cannot get image type");
            }

            const imageTools = Cc["@mozilla.org/image/tools;1"].getService(Ci.imgITools);
            const base64Data = base64data.split(";base64,")[1];
            const imageBytes = atob(base64Data);
            const imageContainer = imageTools.decodeImageFromBuffer(imageBytes, imageBytes.length, imageBlob.type);
            const encodedImageStream = imageTools.encodeImage(imageContainer, "image/png");
            const bytes = readBytesFromInputStream(encodedImageStream);
            const file = Cc['@mozilla.org/file/local;1'].createInstance(Ci.nsIFile);
            file.initWithPath(path);
            const foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
            foStream.init(file, 0x02 | 0x08 | 0x20, 0o664, 0);
            foStream.write(bytes, bytes.length);
            foStream.close();
            if (file.exists() && file.fileSize > 0) {
                alerts((isChinese ? "成功图片保存到 %s!" : "Successfully saved image to %s!").replace("%s", file.path), function() {
                    file.launch();
                });
            }
        } catch (error) {
            alerts(error.message);
        }
    });

    ins.after(menuItem);

    const contextMenu = ins.parentNode;
    contextMenu.addEventListener("popupshowing", callback);

    window.addEventListener("beforeunload", function () {
        contextMenu.removeEventListener("popupshowing", callback);
    });

    function callback() {
        setTimeout(function () {
            menuItem.hidden = !gContextMenu.onImage;
        }, 10);
    }

    async function saveFileDialog(defaultFilename) {
        return new Promise(function (resolve) {
            const fp = makeFilePicker();
            const title = isChinese ? "保存图片" : "Save Image";
            const mode = Ci.nsIFilePicker.modeSave;
            try {
                fp.init(window.browsingContext, title, mode);
            } catch (ex) {
                fp.init(window, title, mode);
            }
            fp.defaultString = defaultFilename;
            fp.appendFilter(isChinese ? "PNG 图片" : "PNG Image", "*.png");
            fp.open(async function (result) {
                resolve({
                    result,
                    path: fp.file ? fp.file.path : null
                });
            });
        });
    }

    function readBlobAsBase64(blob) {
        return new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onloadend = function () {
                resolve(reader.result);
            };
            reader.onerror = function () {
                reject(new Error("Failed to read blob as base64"));
            };
            reader.readAsDataURL(blob);
        });
    }

    function readBytesFromInputStream(stream, count) {
        let BinaryInputStream = Components.Constructor(
            "@mozilla.org/binaryinputstream;1",
            "nsIBinaryInputStream",
            "setInputStream"
        );
        if (!count) {
            count = stream.available();
        }
        return new BinaryInputStream(stream).readBytes(count);
    }

    function alerts(message, aCallback) {
        var callback = aCallback ? {
            observe: function (subject, topic, data) {
                if ("alertclickcallback" != topic)
                    return;
                aCallback.call(null);
            }
        } : null;
        const alertsService = Cc["@mozilla.org/alerts-service;1"].getService(Ci.nsIAlertsService);
        alertsService.showAlertNotification(
            "chrome://devtools/skin/images/browsers/firefox.svg",
            isChinese ? "保存为 PNG 图片" : "Save As PNG",
            message + "",
            !!callback, "", callback
        );
    }
})(document.getElementById('context-video-saveimage'));
