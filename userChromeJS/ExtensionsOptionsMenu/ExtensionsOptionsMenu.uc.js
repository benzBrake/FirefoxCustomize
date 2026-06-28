// ==UserScript==
// @name          Extension Options Menu.uc.js
// @description   拡張を操作するメニューボタンを追加
// @include       main
// @charset       UTF-8
// @sandbox       true
// @version       3.3.0 Fx152+
// @version       3.1.9 CSPエラー修正、他微修正
// @version       3.1.8 メニューリストが意図した表示になっていなかった問題の修正と意味のないコードを削除
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

	let EOM = {

		showVersion: true,    // ヴァージョンを表示するか
		showAll: true,        // 設定のないアドオンも表示するか
		showDisabled: true,  // 無効のアドオンを表示するか
		iconURL: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAZdEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjbQg61aAAACkUlEQVQ4T43T60tTYRwH8HMQ9QQJRSBJ50xU8BL1QpJMsbxNc162edxcYlAoZdkFh6gZurF5WV6nc7M/oBdBb7q9DSPEVBDbZtN0c5tzNymolwXht2eDhVO0Dnx4Hn6/5/me8xx4KOqQR2rcYfjpIC81BpXiqWBnxUSgpWQ0kHrY+gN1xdOdu/XTQfDGIMSGAET6AMpG/TbhiD/uv0LqTYF7cmPgN2/wQzzhh2jMB+Gwz1I65I3/Z8A1o5eRTXqP85M+pVTv260Z86JieNtcMridXNjnZvI1Lia31xV7IIgf99AKg/e1wrAN+YQHtXoPJKNbqBrewlWdG6UDLlzRupCv3sTFns3vFx47SqJCFHoPoyAb5eNb4MlGyYgb1UNuiHQulPW7UKRx4rJqE5d6HMjpdiC7066mRFpHvFTnbCHuSJ84E+rIJumQExKdEzVE5YAT5RoHCnvsyO3aQHb7Os63rSHrwRoy76+qqErNBi/ut4PYrdFsKCWDDoj77CjvXUdu+yqyWleQcsuK5GYrBE0WcE0Wm6DZmsk1W7VEI1XRu6YUqb6gUh22W9BhQ8ZtCwQ3PoEjQuM+psi5SSBNCR/Zusq7bSju+IyMpmWwjUvgrh+hcWks6scVKs0tBQ/NSG5YBKtYNHOKRRxt4WUogKufTwmh8lqXU9MaFlY42UcLJ5tnOfk8yPwov0j/LfGNUIe/huXnYrm6uTiOn2UI7GEjcxMxTrwifu7rq6KOw0o+MAT2SI8sYGtnaVJ/s68fFUCfONd2jK2e+cFWv0dY1bu+mPiTocsTmyR8kU56X//2wmtmuiMvoMkkdEkEp3K0N08XPZsKScwzdNB0zFlSz0pIaxBG6mQ0JBU/1yXmm878AbFQoHrb98HyAAAAAElFTkSuQmCC',

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
			let style = `
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
			let sspi = document.createProcessingInstruction(
				'xml-stylesheet',
				'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
			);
			document.insertBefore(sspi, document.documentElement);
			sspi.getAttribute = function (name) {
				return document.documentElement.getAttribute(name);
			};

			try {
				CustomizableUI.createWidget({
					id: 'eom-button',
					type: 'custom',
					onBuild: function (doc) {
						let btn = doc.createXULElement('toolbarbutton');
						let attributes = {
							id: 'eom-button',
							class: 'toolbarbutton-1 chromeclass-toolbar-additional',
							type: 'menu',
							label: EOM.lang[EOM.locale]["Extension Options Menu"] || "Extension Options Menu",
							tooltiptext: EOM.lang[EOM.locale]["Extension Options Menu Tooltip"] || "Extension Options Menu",
						};
						for (let a in attributes) {
							btn.setAttribute(a, attributes[a]);
						};
						btn.addEventListener('contextmenu', event => {
							event.preventDefault();
						}, false);
						btn.addEventListener('click', EOM.iconClick);
						let mp = btn.appendChild(doc.createXULElement('menupopup'));
						mp.setAttribute('id', 'eom-button-popup');
						mp.addEventListener('popupshowing', (event) => EOM.populateMenu(event));
						return btn;
					}
				});
			} catch (e) { };

		},

		populateMenu: async function (event) {
			let prevState;

			let popup = event.target;
			if (popup !== event.currentTarget) {
				return;
			}

			while (popup.hasChildNodes()) {
				popup.removeChild(popup.firstChild);
			}

			let addons = await AddonManager.getAddonsByTypes(['extension']);

			addons.sort((a, b) => {
				let ka = this.key(a);
				let kb = this.key(b);
				return (ka < kb) ? -1 : 1;
			}).forEach((addon) => {
				if (addon.isBuiltin || addon.id.endsWith("@search.mozilla.org")) return;
				if (!addon.appDisabled && ((addon.isActive && addon.optionsURL)
					|| ((addon.userDisabled && this.showDisabled)
						|| (!addon.userDisabled && this.showAll)))) {
					let state = addon.isActive;
					if (this.sort.disabled === 1 && (prevState && state !== prevState)) {
						popup.appendChild(document.createXULElement('menuseparator'));
					}
					prevState = state;

					let mi = document.createXULElement('menuitem');
					let label = addon.name;
					if (this.showVersion) label = label += ' ' + '[' + addon.version + ']';
					mi.setAttribute('label', label);
					mi.setAttribute('class', 'menuitem-iconic');
					mi.setAttribute('tooltiptext', 'id : ' + addon.id + EOM.lang[EOM.locale]["Extension Tooltip"]);
					let icon = addon.iconURL || addon.iconURL64 || this.iconURL || '';
					mi.setAttribute('image', icon);
					mi._Addon = addon;
					mi.addEventListener('click', (event) => this.handleClick(event));

					if (!addon.optionsURL && addon.isActive) {
						mi.setAttribute('style', 'color: Gray');
					}
					if (addon.optionsURL) {
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
				BrowserAddonUI.openAddonsMgr('addons://list/extension');
			}
		},

		handleClick: function (event) {
			let mi = event.target;
			if (mi !== event.currentTarget) {
				return;
			}
			if (!('_Addon' in mi)) {
				return;
			}

			let addon = mi._Addon;
			let pending = this.isPending(addon);
			let hasMdf = event.ctrlKey || event.shiftKey || event.altKey || event.metaKey;

			switch (event.button) {
				case 0:
					if (addon.optionsURL && !hasMdf) {
						this.openAddonOptions(addon);
					} else if (event.ctrlKey) {
						this.browseDir(addon);
					} else if (event.altKey) {
						let clipboard = Cc['@mozilla.org/widget/clipboardhelper;1']
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
						let state = !addon.userDisabled;
						state ? addon.disable() : addon.enable();
						this.updateState(mi, state);
					} else if (event.ctrlKey) {
						pending ? addon.cancelUninstall() : addon.uninstall();
						this.setUninstall(mi, pending);
					}
					break;
			}
		},

		updateState: function (mi, dis) {
			let cls = mi.classList;
			dis ? cls.add('addon-disabled') : cls.remove('addon-disabled');
		},

		setUninstall: function (mi, uninst) {
			let cls = mi.classList;
			uninst ? cls.add('addon-uninstall') : cls.remove('addon-uninstall');
		},

		isPending: function (addon) {
			return addon.pendingOperations & AddonManager.PENDING_UNINSTALL;
		},

		openAddonOptions: function (addon) {
			let optionsURL = addon.optionsURL || '';
			if (!addon.isActive || !optionsURL) {
				return;
			}
			if (addon.optionsType === 3) {
				"switchToTabHavingURI" in window ? switchToTabHavingURI(optionsURL, true) : openTab("contentTab", { contentPage: optionsURL });
			} else {
				BrowserAddonUI.openAddonsMgr('addons://detail/' + encodeURIComponent(addon.id) + '/preferences');
			}
		},

		browseDir: function (addon) {
			try {
				let dir = Services.dirsvc.get('ProfD', Ci.nsIFile);
				dir.append('extensions');
				dir.append(addon.id + (addon.unpack ? '' : '.xpi'));
				if (dir.exists()) {
					dir.reveal();
				} else {
					Services.prompt.alert(null, "Error", "Directory or file not found.");
				}
			} catch (e) {
				Cu.reportError("EOM: browseDir failed: " + e);
			}
		},

		key: function (addon) {
			let sort = this.sort;
			let sortPos = addon.isActive ? sort.enabled : sort.disabled;
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
