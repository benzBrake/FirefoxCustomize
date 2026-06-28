// ==UserScript==
// @name          Extension Options Menu.uc.js
// @description   拡張を操作するメニューボタンを追加
// @include       main
// @charset       UTF-8
// @version       3.1.9 Fix bug Bug 1880914
// @version       3.1.8 Fix not work in new window
// @version       3.1.7 メニューリスト表示がおかしくなっていた問題を修正
// @version       3.1.6 ボタン中クリックの再起動が機能していない問題を修正、ほか微修正
// @version       3.1.5 ビルトインの拡張や検索プラグインを表示させないように ※Fx67未満、Fx68以降での動作は保証外
// @version       3.1.4 Fx65以降に対応
// @version       3.1.3 Fx62以降でアドオンの有効/無効化ができない問題を修正、他AM API変更による修正
// @version       3.1.2 問題が出ることがあるので拡張の設定画面の別ウィンドウ表示を廃止
// @version       3.1.1 拡張のフォルダを開く処理が機能してなかったのを修正
// @version       3.1.0 Fx57以降に対応 無効化できない組み込みアドオンを非表示に
// ==/UserScript==

'use strict';
(function () {
	var AddonMgr = () => {
		let args = [...arguments], b = "openAddonsMgr";
		eval(`${parseInt(Services.appinfo.version) < 126
			? "Browser" + b[0].toUpperCase() + b.slice(1)
			: "BrowserAddonUI." + b}(...args)`);
	}

	var EOM = {

		showVersion: true,    // ヴァージョンを表示するか
		showAll: false,    // 設定のないアドオンも表示するか
		showDisabled: true,    // 無効のアドオンを表示するか
		autoRestart: false,   // アドオンの有効/無効時に自動で再起動するか(再起動不要アドオンは除外される)
		iconURL: 'chrome://mozapps/skin/extensions/extension.svg',
		lang: {
			'zh-CN': {
				"Extension Options Menu": "扩展选项菜单",
				"Extension Options Menu Tooltip": "扩展选项菜单\n\n左键单击：显示扩展选项菜单\n中键单击：重启浏览器\n右键单击：打开扩展管理",
				"Extension Tooltip": "\n\n左键单击： 打开扩展选项\n右键单击：启用/禁用插件\n中键单击：打开插件主页\nCtrl + 左键单击：打开扩展文件夹\nCtrl + 右键单击：卸载加载项\nAlt + 左键单击：复制扩展 ID"
			},
			'en-US': {
				"Extension Options Menu": "Extension Options Menu",
				"Extension Options Menu Tooltip": "Extension Options Menu\n\nLeft click: Show extension options menu\nMiddle click: Restart browser\nRight click: Open extension management",
				"Extension Tooltip": "\n\nLeft click: Open extension options\nRight click: Enable/disable plugin\nMiddle click: Open plugin home page\nCtrl + Left click: Open extension folder\nCtrl + Right click Click: Uninstall Add-on\nAlt + Left Click: Copy Extension ID"
			},
		},
		get locale() {
			delete this.locale;
			try {
				let _locale, _locales, osPrefs = Cc["@mozilla.org/intl/ospreferences;1"].getService(Ci.mozIOSPreferences);
				if (osPrefs.hasOwnProperty("getRegionalPrefsLocales").hasOwnProperty("getRegionalPrefsLocales"))
					_locales = osPrefs.getRegionalPrefsLocales();
				else
					_locales = osPrefs.regionalPrefsLocales;
				for (let i = 0; i < _locales.length; i++) {
					if (EOM.lang.hasOwnProperty(_locales[i])) {
						_locale = _locales[i];
						break;
					}
				}
				return this.locale = _locale;
			} catch (e) { }
			return this.locale = "en-US";
		},

		sort: {
			enabled: 0,
			disabled: 1
			// 0, 0 = アルファベット順に
			// 0, 1 = アドオンマネージャと同じようにソート
		},

		init: function () {
			var style = `
			@namespace url('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul');
			#eom-button {
				list-style-image: url('${this.iconURL}');
			}
		
			.addon-disabled > .menu-iconic-left { filter: grayscale(1); }
			.addon-disabled label { color: Gray !important; }
			.addon-uninstall label { font-weight: bold !important; }
			.addon-uninstall label:after { content: '-'; }

			#eom-button[cui-areatype="menu-panel"],
			toolbarpaletteitem[place="palette"] > #eom-button {
				list-style-image: url('${this.iconURL}');
			}
		`;

			style = style.replace(/\s+/g, " ");
			var sspi = document.createProcessingInstruction(
				'xml-stylesheet',
				'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
			);
			document.insertBefore(sspi, document.documentElement);
			sspi.getAttribute = function (name) {
				return document.documentElement.getAttribute(name);
			};

			if (CustomizableUI.getPlacementOfWidget("eom-button", true)) return;

			try {
				CustomizableUI.createWidget({
					id: 'eom-button',
					type: 'custom',
					defaultArea: 'nav-bar',
					removable: true,
					onBuild: function (doc) {
						var btn = doc.createXULElement('toolbarbutton');
						var attributes = {
							id: 'eom-button',
							class: 'toolbarbutton-1 chromeclass-toolbar-additional',
							type: 'menu',
							label: EOM.lang[EOM.locale]["Extension Options Menu"] || "Extension Options Menu",
							tooltiptext: EOM.lang[EOM.locale]["Extension Options Menu Tooltip"] || "Extension Options Menu",
							oncontextmenu: 'return false'
						};
						for (var a in attributes) {
							btn.setAttribute(a, attributes[a]);
						};
						btn.addEventListener('click', EOM.iconClick);
						var mp = btn.appendChild(doc.createXULElement('menupopup'));
						mp.setAttribute('id', 'eom-button-popup');
						mp.setAttribute('onclick', 'event.preventDefault(); event.stopPropagation();');
						mp.addEventListener('popupshowing', (event) => EOM.populateMenu(event));
						return btn;
					}
				});
			} catch (e) { };

		},

		populateMenu: async function (event) {
			var document = event.target.ownerDocument;
			var prevState;

			var popup = event.target;
			if (popup !== event.currentTarget) {
				return;
			}

			while (popup.hasChildNodes()) {
				popup.removeChild(popup.firstChild);
			}

			var addons = await AddonManager.getAddonsByTypes(['extension']);

			addons.sort((a, b) => {
				var ka = this.key(a);
				var kb = this.key(b);
				return (ka < kb) ? -1 : 1;
			}).forEach((addon) => {
				if (addon.isBuiltin || addon.id.endsWith("@search.mozilla.org")) return;
				if (!addon.appDisabled && ((addon.isActive && addon.optionsURL)
					|| ((addon.userDisabled && this.showDisabled)
						|| (!addon.userDisabled && this.showAll)))) {
					var state = addon.isActive;
					if (this.sort.disabled === 1 && (prevState && state !== prevState)) {
						popup.appendChild(document.createXULElement('menuseparator'));
					}
					prevState = state;

					var mi = document.createXULElement('menuitem');
					var label = addon.name;
					if (this.showVersion) label = label += ' ' + '[' + addon.version + ']';
					mi.setAttribute('label', label);
					mi.setAttribute('class', 'menuitem-iconic');
					mi.setAttribute('tooltiptext', 'id : ' + addon.id + EOM.lang[EOM.locale]["Extension Tooltip"]);
					var icon = addon.iconURL || addon.iconURL64 || this.iconURL || '';
					mi.setAttribute('image', icon);
					mi._Addon = addon;
					mi.addEventListener('click', (event) => this.handleClick(event));

					if (!addon.optionsURL && addon.isActive) {
						mi.setAttribute('style', 'color: Gray');
					}
					if (!addon.operationsRequiringRestart) {
						mi.setAttribute('style', 'color: Green');
					}

					this.updateState(mi, addon.userDisabled);
					this.setUninstall(mi, this.isPending(addon));

					popup.appendChild(mi);
				}
			});
		},

		iconClick: function (event) {
			if (event.target !== event.currentTarget) {
				return;
			}
			if (event.button === 1) {
				EOM.restart();
			} else if (event.button === 2) {
				event.preventDefault();
				event.stopPropagation();
				setTimeout(() => { document.getElementById('toolbar-context-menu').hidePopup(); }, 0);
				AddonMgr('addons://list/extension');
			}
		},

		handleClick: function (event) {
			var mi = event.target;
			if (mi !== event.currentTarget) {
				return;
			}
			if (!('_Addon' in mi)) {
				return;
			}

			var addon = mi._Addon;
			var pending = this.isPending(addon);
			var hasMdf = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

			switch (event.button) {
				case 0:
					if (addon.optionsURL && !hasMdf) {
						this.openAddonOptions(addon, event.target.ownerGlobal);
					} else if (event.ctrlKey) {
						this.browseDir(addon);
					} else if (event.altKey) {
						var clipboard = Cc['@mozilla.org/widget/clipboardhelper;1']
							.getService(Ci.nsIClipboardHelper);
						clipboard.copyString(addon.id);
					}
					break;
				case 1:
					if (addon.homepageURL) {
						openURL(addon.homepageURL);
					}
					break;
				case 2:
					if (!hasMdf) {
						var state = !addon.userDisabled;
						state ? addon.disable() : addon.enable();

						this.updateState(mi, state);

						if (addon.operationsRequiringRestart && this.autoRestart) {
							EOM.restart();
						}
					} else if (event.ctrlKey) {
						pending ? addon.cancelUninstall() : addon.uninstall();
						this.setUninstall(mi, pending);
					}
					break;
			}
		},

		updateState: function (mi, dis) {
			var cls = mi.classList;
			dis ? cls.add('addon-disabled') : cls.remove('addon-disabled');
		},

		setUninstall: function (mi, uninst) {
			var cls = mi.classList;
			uninst ? cls.add('addon-uninstall') : cls.remove('addon-uninstall');
		},

		isPending: function (addon) {
			return addon.pendingOperations & AddonManager.PENDING_UNINSTALL;
		},

		openAddonOptions: function (addon, win) {
			var optionsURL = addon.optionsURL || '';
			if (!addon.isActive || !optionsURL) {
				return;
			}
			switch (Number(addon.__AddonInternal__.optionsType)) {
				case 5:
					AddonMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
				case 3:
					"switchToTabHavingURI" in window ? switchToTabHavingURI(optionsURL, true) : openTab("contentTab", { contentPage: optionsURL });
					break;
				case 1:
					var windows = Services.wm.getEnumerator(null);
					while (windows.hasMoreElements()) {
						var win2 = windows.getNext();
						if (win2.closed) {
							continue;
						}
						if (win2.document.documentURI == addon.optionsURL) {
							win2.focus();
							return;
						}
					}
					win.openDialog(addon.optionsURL, addon.id, 'chrome,titlebar,toolbar,centerscreen');
			}
		},

		browseDir: function (addon) {
			var dir = Services.dirsvc.get('ProfD', Ci.nsIFile);
			var nsLocalFile = Components.Constructor('@mozilla.org/file/local;1', 'nsIFile', 'initWithPath');
			dir.append('extensions');
			dir.append(addon.id);
			var fileOrDir = dir.path + (dir.exists() ? '' : '.xpi');
			try {
				new nsLocalFile(fileOrDir).reveal();
			} catch (e) {
				var addonDir = /.xpi$/.test(fileOrDir) ? dir.parent : dir;
				try {
					if (addonDir.exists()) {
						addonDir.launch();
					}
				} catch (e) {
					var uri = Services.io.newFileURI(addonDir);
					var protSvc = Cc['@mozilla.org/uriloader/external-protocol-service;1']
						.getService(Ci.nsIExternalProtocolService);
					protSvc.loadUrl(uri);
				}
			}
		},

		key: function (addon) {
			var sort = this.sort;
			var sortPos = addon.isActive ? sort.enabled : sort.disabled;
			return sortPos + '\n' + addon.name.toLowerCase();
		},

		restart: function () {
			let cancelQuit = Cc["@mozilla.org/supports-PRBool;1"].
				createInstance(Ci.nsISupportsPRBool);
			Services.obs.notifyObservers(cancelQuit, "quit-application-requested", "restart");

			if (cancelQuit.data) return;
			if (Services.appinfo.inSafeMode) {
				Services.startup.restartInSafeMode(Ci.nsIAppStartup.eAttemptQuit);
				return;
			}
			Services.appinfo.invalidateCachesOnRestart();
			Services.startup.quit(Ci.nsIAppStartup.eAttemptQuit | Ci.nsIAppStartup.eRestart);
		}
	};
	EOM.init();
})()