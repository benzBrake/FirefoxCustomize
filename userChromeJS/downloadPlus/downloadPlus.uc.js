// ==UserScript==
// @name		   downloadPlus.uc.js
// @description	下载窗口添加:另存为、双击复制链接、第三方工具下载
// @include		chrome://mozapps/content/downloads/unknownContentType.xul
// @version		2019.09.18
// @startup		window.MDownloadPlus.init();
// @note		   新增链接类型不支持提示，新增第三方应用调用参数 by Ryan Lieu<github-benzBrake@woai.ru>
// @note		   适配Firefox57+
// ==/UserScript==

(location == "chrome://mozapps/content/downloads/unknownContentType.xul") &&
(function () {
	const PREF_BD_USEDOWNLOADDIR = "browser.download.useDownloadDir";

	let config = {
		defaultActionToSave:true,//默认选择下载文件
		addSaveAsButton:true,//添加另存为按钮，只在选择了默认保存位置时添加
		copySourceByDbClick:true,//来源显示完整目录并支持双击复制完整地址
		useExtraAppDownload:true,//使用第三方下载工具下载
		extraAppName:"IDM",//下载工具名称
		extraAppPath:"C:\\Program\ Files\ (x86)\\Internet\ Download\ Manager\\IDMan.exe", //下载工具路径
		extraAppParameter: ["/d"],//下载工具参数
		_:false
	};

	var downloadModule = {};
	Components.utils.import("resource://gre/modules/DownloadLastDir.jsm", downloadModule);
	Components.utils.import("resource://gre/modules/Downloads.jsm");
	var MDownloadPlus = {
		createExtraAppButton:function () {
			let btn = dialog.mDialog.document.documentElement.getButton("extra2");
			if(btn){  
				btn.setAttribute("hidden", "false");
				btn.setAttribute("label", config.extraAppName);
				btn.setAttribute("oncommand", 'window.MDownloadPlus.lauchExtraApp();')
			}
		},
		lauchExtraApp:function () {
			let url = dialog.mLauncher.source.spec;
			let regEx = new RegExp("^data");
			if (regEx.test(url)) {
				alert("此类链接不支持调用第三方工具下载");
				return;
			}
			let parameter = config.extraAppParameter;
			parameter.push(url);
			let extraApp = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsIFile);
			extraApp.initWithPath(config.extraAppPath);
			if (!extraApp.exists()) {
				alert(config.extraAppName+ "不存在: " + config.extraAppPath);
				return;
			}
			try {
				let ss = Components.classes["@mozilla.org/browser/shell-service;1"]
					.getService(Components.interfaces.nsIShellService);
				ss.openApplicationWithURI(extraApp, parameter.join(" "));
			} catch (e) {
				let p = Components.classes["@mozilla.org/process/util;1"]
					.createInstance(Components.interfaces.nsIProcess);
				p.init(extraApp);
				p.run(false, parameter, parameter.length);
			}
			dialog.mDialog.dialog = null;
			window.close();
		},
		createSaveAsButton(){
			let prefs = Components.classes["@mozilla.org/preferences-service;1"]
				.getService(Components.interfaces.nsIPrefBranch);
			let autodownload = prefs.getBoolPref(PREF_BD_USEDOWNLOADDIR, false);
			if(autodownload){
				var btn = dialog.mDialog.document.documentElement.getButton("extra1");
				if(btn){
					btn.setAttribute("hidden", "false");
					btn.setAttribute("label", "另存为");
					btn.setAttribute("oncommand", 'window.MDownloadPlus.saveAs();')
				}
			}
		},
		saveAs:function () {
			var modeGroup = dialog.dialogElement("mode");
			modeGroup.selectedItem = dialog.dialogElement("save");
			let aLauncher = dialog.mLauncher;
			let aContext = dialog.mContext;
			(async () => {
				var nsIFilePicker = Components.interfaces.nsIFilePicker;
				var picker = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

				var parent,gDownloadLastDir;
				try {
					parent = aContext.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow);
				} catch (ex) {}

				if (parent) {
					gDownloadLastDir = new downloadModule.DownloadLastDir(parent);
				} else {
					gDownloadLastDir = this._mDownloadDir;
					let windowsEnum = Services.wm.getEnumerator("");
					while (windowsEnum.hasMoreElements()) {
						let someWin = windowsEnum.getNext();
						if (someWin != this.mDialog) {
							parent = someWin;
						}
					}
					if (!parent) {
						Components.utils.reportError("No candidate parent windows were found for the save filepicker." +
							"This should never happen.");
					}
				}

				picker.init(parent, "另存为", nsIFilePicker.modeSave);
				picker.defaultString = aLauncher.suggestedFileName;
				try {
					picker.defaultExtension = this.mLauncher.MIMEInfo.primaryExtension;
				}
				catch (ex) { }

				picker.appendFilters( nsIFilePicker.filterAll );

				let preferredDir = await Downloads.getPreferredDownloadsDirectory();
				picker.displayDirectory = new FileUtils.File(preferredDir);

				gDownloadLastDir.getFileAsync(aLauncher.source, lastDir => {
					if (lastDir && isUsableDirectory(lastDir))
						picker.displayDirectory = lastDir;

					picker.open(returnValue => {
						if (returnValue == nsIFilePicker.returnCancel) {
							aLauncher.saveDestinationAvailable(null);
							return;
						}
						result = picker.file;

						if (result) {
							try {
								if (result.exists() && dialog.getFinalLeafName(result.leafName) == result.leafName)
									result.remove(false);
							}
							catch (ex) {
							}
							var newDir = result.parent.QueryInterface(Components.interfaces.nsIFile);
							gDownloadLastDir.setFile(aLauncher.source, newDir);

							try {
								result = dialog.validateLeafName(newDir, result.leafName, null);
							}
							catch (ex) {
								if (ex.result == Components.results.NS_ERROR_FILE_AComponents.classesESS_DENIED) {
									dialog.displayBadPermissionAlert();
									aLauncher.saveDestinationAvailable(null);
									return;
								}
							}
						}
						aLauncher.saveDestinationAvailable(result);
						dialog.mDialog.dialog = null;
						window.close();

					});
				});
			})().catch(Components.utils.reportError);
		},
		copySourceByDbClick:function () {
			var source = document.querySelector("#source");
			source.value = dialog.mSourcePath;
			source.setAttribute("crop", "center");
			source.setAttribute("tooltiptext", dialog.mLauncher.source.spec);
			source.setAttribute("ondblclick", 'Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper).copyString(dialog.mLauncher.source.spec)');
		},
		init:function () {

			if(config.defaultActionToSave){
				var modeGroup = dialog.dialogElement("mode");
				modeGroup.selectedItem = dialog.dialogElement("save");
			}

			if(config.addSaveAsButton){
				this.createSaveAsButton();
			}

			if(config.copySourceByDbClick){
				this.copySourceByDbClick();
			}

			if(config.useExtraAppDownload){
				this.createExtraAppButton();
			}
		}
	}

	function isUsableDirectory(aDirectory)
	{
		return aDirectory.exists() && aDirectory.isDirectory() &&
			aDirectory.isWritable();
	}

	MDownloadPlus.init();
	window.MDownloadPlus = MDownloadPlus;
})()