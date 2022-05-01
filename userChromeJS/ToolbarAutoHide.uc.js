// ==UserScript==
// @name ToolbarAutoHide.uc.js
// ==/UserScript==

/*			userChrome.cssで
/*			#navigator-toolbox #toolbar-menubar {	-moz-box-ordinal-group	: 1;}
/*			等と、-moz-box-ordinal-group　を指定してあると表示が乱れる場合があります。
/*			各自、修正してください。
/*			もっとスマートに低負荷にできると思いますが、私のスキルではこれが限界です。
/*			誰でも改造してより良いものを作ってください。
*/

(function () {
	if (location != 'chrome://browser/content/browser.xhtml') return;
	try {

		let navbox = document.getElementById('navigator-toolbox');
		let menubar = document.getElementById('toolbar-menubar');
		let tabsbar = document.getElementById('TabsToolbar');
		let navbar = document.getElementById('nav-bar');
		let perbar = document.getElementById('PersonalToolbar');

		//	toolbarの属性変化を監視
		let observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				toolbarFlag(mutation);
			});
		});
		let config = {
			attributes: true,
			attributeOldValue: true,
			attributeFilter: ['customizing', 'autohide', 'collapsed', 'barAuto']
		};
		observer.observe(menubar, config);
		observer.observe(tabsbar, config);
		observer.observe(navbar, config);
		observer.observe(perbar, config);

		//	tabsbarのリサイズを監視
		let resizeObserver = new ResizeObserver(function (entries) {
			entries.forEach(function (entry) {
				toolbarFlag(entry);
			});
		});
		resizeObserver.observe(tabsbar);
		/**/

		//	タブバー、ナビバーも隠せるように
		tabsbar.setAttribute('toolbarname', tabsbar.getAttribute('aria-label'));
		navbar.setAttribute('toolbarname', navbar.getAttribute('aria-label'));

		/*
		//	ブックマークバーはデフォルトで自動開閉に
				menubar.removeAttribute('barAuto');
				tabsbar.removeAttribute('barAuto');
				navbar.removeAttribute('barAuto');
				perbar.setAttribute('barAuto', 'true');
		*/
		//	自動開閉するかどうかをfirefoxに保存
		menubar.setAttribute('persist', 'barAuto');
		tabsbar.setAttribute('persist', 'barAuto');
		navbar.setAttribute('persist', 'barAuto');
		perbar.setAttribute('persist', 'barAuto');
		//	タブバーは不具合多発なので起動時は自動開閉しないように
		tabsbar.removeAttribute('barAuto');

		//	全消し用にナビゲーションボックスに空要素追加　ダブルクリックで復活
		let box = MozXULElement.parseXULToFragment(`
<vbox id="nav-box-escape" context="toolbar-context-menu" tooltiptext="ダブルクリックでツールバーを表示"/>
		`);
		navbox.appendChild(box);
		/*
		//	コンテキストメニューのヘッドにツールバーのコンテキストメニュー追加
				document.getElementById('context-navigation').setAttribute('context', 'toolbar-context-menu');
		*/
		//	ツールバーメニューに項目追加
		let menu = MozXULElement.parseXULToFragment(`
<menu id="toolbarauto-menu" label="自动隐藏">
	<menupopup id="toolbarauto-popup" onpopupshowing="autoHideToolbarsPopupShowing(event);"/>
</menu>
<menuseparator/>
		`);
		document.getElementById('menu_customizeToolbars').before(menu);

		//	ナビゲーション上の右クリックメニューに追加
		let contextmenu = MozXULElement.parseXULToFragment(`
<menu id="toolbarauto-contextmenu" label="自动隐藏">
	<menupopup id="toolbarauto-contextpopup"
		onpopupshowing="autoHideToolbarsPopupShowing(event);"/>
</menu>
<menuseparator/>
		`);
		document.getElementById('viewToolbarsMenuSeparator').after(contextmenu);

		let uccss = `
#navigator-toolbox #titlebar {
	-moz-box-ordinal-group	: 0;
}
#navigator-toolbox #toolbar-menubar {
	-moz-box-ordinal-group	: 1;
}
#navigator-toolbox #TabsToolbar {
	-moz-box-ordinal-group	: 2;
}
#navigator-toolbox #nav-bar {
	-moz-box-ordinal-group	: 3;
}
#navigator-toolbox #PersonalToolbar {
	-moz-box-ordinal-group	: 4;
}
#navigator-toolbox[barsAuto]:not([custommode]) {
	z-index							: 100 !important;
	position				: relative !important;
}
#navigator-toolbox[barsAuto]:not(:-moz-lwtheme, [custommode]) {
	background-color		: var(--toolbar-bgcolor) !important;
	background-image		: var(--toolbar-bgimage) !important;
}
#navigator-toolbox[barsAuto]:-moz-lwtheme:not([custommode]) {
	background-color		: var(--lwt-accent-color) !important;
	background-image		: var(--lwt-header-image, var(--lwt-additional-images)) !important;
}
#navigator-toolbox:not([inFullscreen], [custommode]) #nav-box-escape[notShown] {
	-moz-box-ordinal-group	: 10;
	transition					: all 0.3s ease 0s;
	height							: 5px;
	cursor							: alias;
}
#navigator-toolbox:not([inFullscreen], [custommode]) #nav-box-escape:not([notShown]) {
	display							: none;
}
#navigator-toolbox:not([inFullscreen], [custommode]) #nav-box-escape[allAuto] {
	margin-block-end		: -5px;
}
#navigator-toolbox:not([inFullscreen], [custommode]):hover #nav-box-escape[allAuto] {
	height							: 0;
	margin-block-end		: 0;
}
#navigator-toolbox[barsAuto]:not([inFullscreen], [custommode]) {
	margin-block-end		: 0;
	transition					: all 0.3s ease 0s !important;
}
#navigator-toolbox[barsAuto]:not([inFullscreen], [custommode]):hover {
	margin-block-end		: calc(var(--barshide-height) * -1px);
}
#navigator-toolbox:not([inFullscreen], [custommode]) > #titlebar[barsAuto] {
	margin-block-start	: calc(var(--ttlhide-height) * -1px) !important;
	transition					: all 0.3s ease 0s !important;
}
#navigator-toolbox:not([inFullscreen], [custommode]):hover > #titlebar[barsAuto] {
	margin-block-start	: 0 !important;
}
#navigator-toolbox:not([inFullscreen], [custommode]) > #titlebar[barsAuto] #toolbar-menubar:not([barAuto]),
#navigator-toolbox:not([inFullscreen], [custommode]) > #titlebar[barsAuto] #TabsToolbar:not([barAuto]) {
	-moz-box-ordinal-group	: 2;
}
#navigator-toolbox:not([inFullscreen], [custommode]) #toolbar-menubar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]) #TabsToolbar[barAuto] {
	-moz-box-ordinal-group	: 1;
	transition					: all 0.3s ease 0s !important;
	opacity							: 0 !important;
}
#navigator-toolbox:not([inFullscreen], [custommode]):hover #toolbar-menubar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]):hover > #titlebar[barsAuto] #TabsToolbar:not([barAuto]) {
	-moz-box-ordinal-group	: 1;
}
#navigator-toolbox:not([inFullscreen], [custommode]):hover > #titlebar[barsAuto] #toolbar-menubar:not([barAuto]),
#navigator-toolbox:not([inFullscreen], [custommode]):hover #TabsToolbar[barAuto] {
	-moz-box-ordinal-group	: 2;
}
#navigator-toolbox:not([inFullscreen], [custommode]) #nav-bar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]) #PersonalToolbar[barAuto] {
	margin-block-start	: calc(var(--barhide-height) * -1px) !important;
	transition					: all 0.3s ease 0s !important;
	opacity							: 0 !important;
}

#navigator-toolbox:not([inFullscreen], [custommode]):hover #toolbar-menubar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]):hover #TabsToolbar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]):hover #nav-bar[barAuto],
#navigator-toolbox:not([inFullscreen], [custommode]):hover #PersonalToolbar[barAuto] {
	margin-block-start	: 0 !important;
	opacity							: 1 !important;
}
		`;
		let ucuri = makeURI('data:text/css;charset=UTF=8,' + encodeURIComponent(uccss));
		let ucsss = Cc['@mozilla.org/content/style-sheet-service;1']
			.getService(Ci.nsIStyleSheetService);
		ucsss.loadAndRegisterSheet(ucuri, ucsss.AGENT_SHEET);

	} catch (e) { };
})();

//	起動時にセット
window.addEventListener('MozAfterPaint', toolbarsset, { once: true });

//	ESCキーでTabsToolbar,nav-barを強制表示
document.addEventListener('keydown', function (event) {
	if (event.keyCode == 27) navescape();
});
//	全消し時のバーをダブルクリックで復活
document.getElementById('nav-box-escape').addEventListener('dblclick', navescape);

function navescape() {
	document.getElementById('nav-bar').setAttribute('collapsed', 'false');
	document.getElementById('nav-bar').removeAttribute('barAuto');
	document.getElementById('TabsToolbar').setAttribute('collapsed', 'false');
	document.getElementById('TabsToolbar').removeAttribute('barAuto');
}

//	ツールバーの属性値変化（カスタマイズ、非表示）
function toolbarFlag(aEvent) {
	let barelm = aEvent.target;
	let attribute = aEvent.attributeName;
	//	タブ追加でタブバーが表示されるのをキャンセル
	if ((barelm.id == 'TabsToolbar')
		&& (attribute == 'collapsed')
		&& !(barelm.hasAttribute('collapsed'))) {
		barelm.setAttribute('collapsed', aEvent.oldValue);
	}
	toolbarsset();
}

function toolbarsset() {
	let boxelm = document.getElementById('navigator-toolbox');
	let ttlbar = document.getElementById('titlebar');
	let escbox = document.getElementById('nav-box-escape');
	let barelm, hidingAttr, barheight, hasShown;
	let barshide = 0, barsAuto = false, custommode = false, notShown = true;
	let ttlhide = 0, tbarsAuto = false, allAuto = false;
	let toolbarsid = ['toolbar-menubar', 'TabsToolbar', 'nav-bar', 'PersonalToolbar'];
	for (let toolbar of toolbarsid) {
		barelm = document.getElementById(toolbar);
		hidingAttr = (barelm.getAttribute('type') == 'menubar') ? 'autohide' : 'collapsed';
		if (hasShown = (barelm.getAttribute(hidingAttr) == 'true')) barelm.removeAttribute('barAuto');
		barheight = barelm.clientHeight;
		if (barelm.hasAttribute('barAuto')) {
			barsAuto = true;
			allAuto = true;
			barelm.style.setProperty("--barhide-height", barheight);
			barshide += barheight;
			if ((toolbar == 'toolbar-menubar') || (toolbar == 'TabsToolbar')) {
				tbarsAuto = true;
				ttlhide += barheight;
			}
		} else {
			if (!hasShown) notShown = false;
			barelm.style.setProperty("--barhide-height", 0);
		}
		if (barelm.hasAttribute('customizing')) custommode = true;
	}

	if (barsAuto) boxelm.setAttribute('barsAuto', 'true');
	else boxelm.removeAttribute('barsAuto');
	if (tbarsAuto) ttlbar.setAttribute('barsAuto', 'true');
	else ttlbar.removeAttribute('barsAuto');
	if (custommode) boxelm.setAttribute('custommode', 'true');
	else boxelm.removeAttribute('custommode');
	if (notShown) {
		escbox.setAttribute('notShown', 'true');
		if (allAuto) escbox.setAttribute('allAuto', 'true');
		else escbox.removeAttribute('allAuto');
	} else {
		escbox.removeAttribute('notShown');
	}

	boxelm.style.setProperty("--barshide-height", barshide);
	ttlbar.style.setProperty("--ttlhide-height", ttlhide);
}

//	メニュー作成
function autoHideToolbarsPopupShowing(aEvent) {
	let popup = aEvent.target;
	if (popup != aEvent.currentTarget) return;

	while (popup.firstChild) popup.removeChild(popup.firstChild);	//	メニュークリア

	let toolbarsid = ['toolbar-menubar', 'TabsToolbar', 'nav-bar', 'PersonalToolbar'];
	let barelm, hidingAttr;
	for (let toolbar of toolbarsid) {
		barelm = document.getElementById(toolbar);
		hidingAttr = (barelm.getAttribute('type') == 'menubar') ? 'autohide' : 'collapsed';

		let menuitem = MozXULElement.parseXULToFragment(`
<menuitem id="toolbarauto-${toolbar}" toolbarId="${toolbar}" type="checkbox"
	label="${barelm.getAttribute('toolbarname')}"
	checked="${(barelm.getAttribute('barAuto') == 'true')}"
	disabled="${(barelm.getAttribute(hidingAttr) == 'true')}"
	oncommand="autoHideToolbar(event);" />
		`);
		popup.append(menuitem);
	}
}

//	自動開閉メニューチェック
function autoHideToolbar(aEvent) {
	let eventelm = aEvent.target;
	let barid = eventelm.getAttribute('toolbarId');
	let barelm = document.getElementById(barid);
	if (eventelm.getAttribute('checked') == "true") {
		barelm.setAttribute('barAuto', 'true');
	} else {
		barelm.removeAttribute('barAuto');
	}
}


