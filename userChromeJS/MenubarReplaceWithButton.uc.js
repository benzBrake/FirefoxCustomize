// ==UserScript==
// @name        MenubarReplaceWithButton.uc.js
// @description 把主菜单替换成按钮
// @author      unknown
// @include     main
// ==/UserScript==

(function () {

    if (location != 'chrome://browser/content/browser.xhtml') return;

    try {

        CustomizableUI.createWidget({
            id: 'main-menubar_button',
            type: 'custom',
            defaultArea: CustomizableUI.AREA_NAVBAR,
            onBuild: function (aDocument) {
                let toolbaritem = aDocument.createXULElement('toolbarbutton');
                let props = {
                    id: 'main-menubar_button',
                    class: 'toolbarbutton-1 chromeclass-toolbar-additional',
                    removable: false,
                    label: Services.locale.appLocaleAsBCP47.includes("zh") ? "主菜单" : "メニューバー",
                    tooltiptext: Services.locale.appLocaleAsBCP47.includes("zh") ? "主菜单" : "メニューバー",
                    style: 'list-style-image: url("chrome://global/skin/icons/more.svg");',
                    popup: 'main-menubar_popup',
                };
                for (let p in props) toolbaritem.setAttribute(p, props[p]);
                return toolbaritem;
            }
        });
    } catch (e) { };
})();

window.addEventListener("MozAfterPaint", function () {
    //	ポップアップメニューが無かったら作成
    if (!document.getElementById('main-menubar_popup')) {
        //	ポップアップ作成
        let menupopup = document.createXULElement('menupopup');
        menupopup.setAttribute('id', 'main-menubar_popup');
        //	menubarにあったから付けてみた
        menupopup.setAttribute('onpopupshowing',
            `if (event.target.parentNode.parentNode == this &&
							!('@mozilla.org/widget/nativemenuservice;1' in Cc))
									this.setAttribute('openedwithkey',
										event.target.parentNode.openedWithKey);
//	開かれたらopen追加
					 if (event.target != this) return true;
						document.getElementById('main-menubar_button').setAttribute('open', 'true');`);
        menupopup.setAttribute('onpopuphiding',
            //	閉じたらopen削除
            `if (event.target != this) return;
						document.getElementById('main-menubar_button').removeAttribute('open');`);
        //	メニューの位置
        menupopup.setAttribute('position', 'after_start');
        document.getElementById('mainPopupSet').append(menupopup);
        //	メニューをメニューバーからポップアップに移動
        let menubar = document.getElementById('main-menubar');
        let cl = menubar.childNodes.length;
        for (let i = 0; i < cl; ++i) {
            //	子要素がmenuと決め打ち
            let menu = menubar.firstChild;
            if (menu.nodeName === 'menu') {
                menu.setAttribute('class', 'menu-iconic');
                let menutxt = menu.firstChild;
                if (menutxt.classList.contains('menubar-text')) {
                    //	labelのclass替えとvalueとkey取得
                    menutxt.classList.remove('menubar-text');
                    menutxt.classList.add('menu-iconic-text');
                    menutxt.setAttribute('flex', '1');
                    // menu-left作成
                    let menuleft = MozXULElement.parseXULToFragment(`
<hbox class="menu-iconic-left" align="center" pack="center" aria-hidden="true">
	<image/>
</hbox>
					`);
                    menu.prepend(menuleft);
                    //	menu-right作成
                    let menuright = MozXULElement.parseXULToFragment(`
<hbox class="menu-accel-container" anonid="accel" aria-hidden="true">
	<label class="menu-iconic-accel"/>
</hbox>
<hbox align="center" class="menu-right" aria-hidden="true">
	<image/>
</hbox>
					`);
                    menutxt.after(menuright);
                }
                menupopup.append(menu);
            }
        }
        //	document.getElementById('menubar-items').removeChild(menubar);
    }
}, { once: true });
