// ==UserScript==
// @name           OpenWith.uc.js
// @description    用其他浏览器打开页面、链接、书签及标签
// @author         ding
// @include        main
// @version        2022.05.18
// @homepageURL    https://bbs.kafan.cn/thread-2114879-1-1.html
// @startup        window.OpenWithManager.init();
// @shutdown       window.OpenWithManager.destroy();
// @compatibility  Firefox 78
// @note           适配Firefox57+
// @note           2022.05.18 Fix and Test on Firefox 100，增加横排菜单
// ==/UserScript==
location.href.startsWith("chrome://browser/content/browser.x") && (function() {

    const MENU_NAME = "用其它浏览器打开";
    const MENU_GROUP = true; // 横排菜单

    //是否使用二级菜单
    const USE_MENU_AREA = true; //页面
    const USE_MENU_TAB = false; //标签
    const USE_MENU_PLACE = false; //书签

    function getFirefoxPath() { //firefox.exe所在路径
        return OS.Constants.Path.libDir;
    }

    function getRootPath() { //firefox所在盘路径
        var path = getFirefoxPath();
        var index = path.indexOf(":");
        return path.substring(0, index + 1);
    }
    //修改内容后请将脚本改名来保证加载的是最新，或使用无缓存的userChrome.js
    var browsers = {
        IE: {
            enable: true,
            name: "IE",
            path: "C:\\Program Files\\Internet Explorer\\iexplore.exe",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACYklEQVRIic1VIWxTYRD+RcUW2u7/73UJYqJiJBMIBGKiAjExgUBMIBCICQRiYhLxEgSiCS9pe/ezIJATkxMViBeCWEJFxdJ17+4nOCYmJgiZmCji0Xav+/u6EhK45Mx77767+767e0r9r1YN44UllC1Dbt+QHBvkK4NyAcRHAfHGXGA67GpAt6lbshOgs5okNsTnQDIAkgFY7gfoLLSSbSCOwHK/jG71VsABJm+A5HIE5nFN8r60l1SGcQaTmm7JTj44JU8yVc5wg3IRID8fxeclMLb/OOU09dsmAZJB2Z481WFXQ5N3/eCY1AD5h0HuapJ4HvC0E74yyPXK29OH3gRguQ/EEZB7nQ3+PR3YKyrsFQPiDbCuMy1JNYwXvLwDcQToNif4baswLNwICMMCkPvoS3Jdj0yCMrrVdJ7HH9/B3t1pei02ZMWvEx/d+Hj53dd7AfFhpvoWf5oGPjSD0vZ08VM1ZHmCf/dhXlHzvGhP7o/AS81k7W+CA8lAR/1HM6s3xOeaJP4jR36glFKq3JB1oOS7txJ0X2ZpMNPSuc9rtVvNi19syIqOutXrnpk8QDkzyFfaStO/OO6zdw+UUksoW74xHd2i0l5SAZIBWD5QYVjQKOLtxPJB5gRjrwitZNu7Ayhno00OiDdSMeWZUumhy7015L6BdZ28Ixhg/+WYnibvpjQktbEmk3doHucoyyGdvgCSweRvbmr7ed0h12+IpKNuFUguhxoMn5cbsq5JYkA5m7lQJHFmqSZtBJae5EOD0jbI9VIzWRu+N8h1g9I2JMdgXceQ2w9a/Oo6tf/EfgHBDz2KquCX5wAAAABJRU5ErkJggg=="
        },
        Chrome: {
            enable: true,
            name: "Chrome",
            path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAADDUlEQVRIiaWWP2jcVhjAfzothoRyww0ebgohQyFrW8dSquBwelfOkKFT4uEgITiQIYVCxwpCuOikc+hQMmTwkKHQQil46OghLbSF4CFxAgmJkHTYJY59kuyczjmCMsjx+Y90vrQffOP7/d573/c+HgyJJY2iN8lsW2XeO8ujtorTVnE8lef+JPe9M9TbGuVhjMxY1hj3VO54Kh1fJTki+22VuysapZHgjoLmq6yNAN6XnkrHVfl6KNxVmfFV+h8L33uaoZIdwX+FDyQT1PaTDa3InH7y3wrHvLP8+n8lnsrf/gSnBwJTGNjVBYD253wxZLHvKyyOkt4ksyncrn5KS3+MJd5h6RcB/Enu74FuOgrGkkZxpC45FGblMrZIsEVCU/8dY7rU1ih7KrGvsvlCQUmvcalI063RdGsYr45/WB5vyDNbr+V6VsYbKNCq/LArsEWCXfkGwFEwHAUDgIYvMN0Oppfs5BoN9zxAHBVu9cJCkpXbUeFnsCpL+wViDUMrLmqMLWqMYSyPH4APJMZKaWWFUp6gF0pPoVl5dkCQYIvG7hU2/EsZ8DQbLy4BxIH0PEfQh5b++JDAEj6mfg4Ay53JFdz2LwJ0Q/nPLEEcSatg608zTpBgiV/S4i6Pc9vrH4Z7mxivjicJY71A6mQKAskBW5/PFNgioSG09Jq8WUx3dQB3HW55dYA3gXwlrwZxJD+AlqjnCizxD3PVL3dqcRLz5fVU1i4D9AJOdEP5jzzBVsB3YGjjWHqcK7F1B3PqQtYT2g75PreDIultP2Ji5zWLRr5g9zSrWPoitj4P0F2n3AulOL9FWRhsJR0XD4+U2CLBrl5NW7Nwd0j/P+lHnDkwMqYuYOn9IwQP0vGAkg8vJG8C+Ur2XGpVr2Hr65nwptig9VUtWeeTXshvmfCOFHUjvs2G70qmathiLaPY9wC2Xsv1THggdfJ3fjCM6RKW+GnPAOxgTJeiiFPbofzXvoEWSJvdoPBjN+Sz0eB7w6yWsfQbNEQdIO4UbsaR5MeB5PRCFnobzHbXh39b3gMjWp3Cjd87mAAAAABJRU5ErkJggg=="
        },
        Edge: {
            enable: true,
            name: "Edge",
            path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACGUlEQVRIibVWr28TcRR/4kQX2vW+7yoQiMoJBAKBqKhATCD4ExATkxMENfFNJknWZL33vkGQCgQJE4glTCAqJiYqlqwp1/u+bzKxBASiAlExUQS90vau15aVT/Lc+34+7/cdwBIoimuK7Ftke6lIBopkgMZ10NhTDOO90ru4sowjEz7HLxW7G2QZLbGhH8rB6szUKwZsz1YgnrGA7dnybKhXVOQu1iWfmLG3leP+08VlMdLMeqjY/vRZ2mhcS5GcI8mPxSKuA1p7afJGVJ+LJkJ2R4riWspZay8g+wpZhlkiZe7vpwVY2sgyUmTvsBlp0NoDrT0/lIPMiACgzP39zIxJBjP92DqRR2PyK5/sk6QfyO4rsm3ktQ2Nvc1semgPJ05BaA8VuQugXhEA4AH1HqJxHWQZbZ/IszyBgOIPCxp+OuXkTEIOAOCTfJ44ktv1G1F9kSmS8+zBkO7fMKbIFcW1fx7TOctMOWn2fxGovOmX0LjvmxKovO+XZgRKzXhnU+TIMkyXZ37ZWEZV3S7kTdFaKJpvj1Np5t2WdVHV7UJ63NzHjQkAACiWbtbSrFKqqm4XlIle5DqNj1jGfbFX2LSvJ6ckgdZewPY5GtdCsr8Wzn+CMl8rxfLlXvN//GkrVwTJ7Sqydxvd4Hn4jaie+2G5rwDA+KqyvVxnuZDd0coC0yVD41qKpavY3Uzbn18Y18Iw3ps+mgl+A9E4JERQR7sXAAAAAElFTkSuQmCC"
        },
        Opera: {
            enable: false,
            name: "Opera",
            path: "",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACbklEQVRIibVWMWhUQRAd+X9mP5oixAi5u53ZHxDEzkIbEQSJ0XQqiBYqFhYWohYWVjbW1mmEYKOghcUVdl6RRgh46t393c2JKSKkSCEaYpAosUi8mNzuT5p82O7Ne/NmZ+YvQMnXzLPcGrzjhepOyFrGJSe4YoXmHKvptqj73SHQZRxRYs84ZRlXndBa2bGMq55xqpln+a7IvcApx2qxj4zVoheqe6G6FVroF8NvhWRjpeSdSno+lLXVaaORw+A/XCOHQavTRshNwcmFILkdgdNe8H0wc60mtuNbkp51TF8DZSvanJ7rE3CGXodq7A2+iDkuWE0G70Wnja3ZV9NxK/gjfJHqXkzA15LrwaQYf7cqycXN2pv0SbRLqul4TGA2h2OxuILV5GYmTN0YsAMwEBMAAAh2nNCaY5oHAIDuEOiyPi8jBwCwQnOx2O4QaGgZOBkDeMafawD7Sh0I2ah7k52BQrKxvXLQZroKn7SaiAvg950EPGM7WoEqXQHPeKJkzyzvJOCEvsTiZyUbWx/7kqW2owDTfCy2twCdoTfRMo2qI1Hy4f1Vy7gcblM13QN2jHoQHZiSDekqeDwaV6PHPWAxCsZK+jYI1upuTKBTS24GyQ2+m63A0S3gtiQ3HOOfQMDLmEDB+CyYVA1vhy1r9TRi+fJ2rNXJJSv4q681DT7vAqigwMbaCEwmNv//JTbzLHeCzb62FlroHILDMcfrdc0PjFjGVmAmlizjjGWccYIrAZd21w+ADweh5iV96ISKsjWy3o702ev00UeTje6KfIsbgIGOpmtW6JXbeLZYxiXP1PVC9bZJbvkqDJdx/AXIjI6YTkGZ/AAAAABJRU5ErkJggg=="
        },
        FireFox: {
            enable: false,
            name: "FireFox",
            path: "",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAFEUlEQVRIiY2VeUyTZxzHX0mWzYVJL6gwzDgqDMvYFo1RtzjQ6jbjCAmloPVAe5e2+pbSQsGBB+dEzZhXaR1UcKIUOqiiRXe4P83iDgleCK5Mndpx2NoplO/+qKsCtfNJfv+8yfv5PL/jeR6CCLayToRS82w5dNJ2NFJz6koE2fmQTnY8ZpK2fjrZ0clQdEpnCi3RQRkBV9E5OoW0krGFXdfpWzsRLFL0J5xR+daaUKV1XlDmpdwYym1xFINBfrvgzXybhb61E3TSBoamC+FaOyJ03YgoPOcLXTfCtXYwNF1IVJhxuo6PA7XkHVnB9jyUpb4WUNAvZpWdFS+TRaptg/+BI3Td2Ld9PS5UL0BMke2ZYErQBMfxc91qXDd8PPFTEafZWZ2yaJpgQMIa6dmY7OWqqiEkS5FfpMHlLxIAE4GvKnICgqn8RtA2NGGRaA8aSvlwNi/Hn0aOt69iydXvc2OeZXIvix06IEhAX24iHBKWP4bL6Bj6kvLCnYfnd4Gh6gSV34hD23Lx8OQyuK0cDJpWjD/Yu7DRL1DKtfxbormT4A4JC6O7qBitCMNRYSZUCj0yFLtfLFN34Z7ZJ3C3czB8NHXcLzBrNt+cCndIWHDXvIHR8jD08JLRk5MC+5olfiBD1QGa4DjCNWf831rK+XBbOfBYFsPVthxDpg/SiLb1KyOuSJInAglclWHw7KPC2VaBuw06ZG5r8E8RhWcEhWsAde3XiNDaEVF4DgplPtxWDh63sOGxLMbFuvSDRKv0EzIQ3CFhwVnMBEwELtdmIk733BRp7b7ar2v0SfgNYMjaUKkV+QVPjsXix/LPrhNNW7JPB4IPlzIwYQiBtz4EtTs3TKo3I68dFJ4RtA1NoHANoHANoG1sxv1mzlNBEsaaotBSwhsiDmlEl6bC7+si8Zc2Er+vScE8nQXv67+ZLJC3g5JV74dTuAZE5Rx42uBlGG9iwttIRTGp8BB25cq7gUrTm8NGrzQZqfr66VNTcBbh6i5Qsk1+QRy/Du72NHhOzgeOhODJEQqOiVeNEadUq/qmCu6oozEgTMCgLB6P6l5Hw84MFJWqcKbiQ9yqica1mjikFppAF7b4JftLsuGxLMJ4k69vj2rDYBBmegi5emfxtB7I4nFLNBc3Nr4NhywOTv1sOIuZeKBn4o56DvoL4lBVIvSVS2EFhWvAkyNUPDLPw9ihVwETgeEyOmSCLbcJlq6V3SdNCjhFNzclojeH7TsHvGT0ZCfjmCADb2lP+ctFl1rAyd3m2/XuUHgNIYCJwA1NPBJFRhNBEATxgyLt8YtG1SFhYZ9iE1aoD4Nd0DqtH8zsw/itPBYjO2iAkQBMBP7ZOxMHBOmgya1zCIIgiHKV6GAwgUPCgkWxGuvUVYjWdSGy0I7UAhPE5Hb8In0Xfxcz4aqaBZh8gl+LE1AtXvfgubsUM6zK1aP/J3FIWOiTJuGqlA2HhIU/5CyM7KBhwhACz96Z8B4Owdj+V2ATLYVZnJE/6brmaap418RJAa+MgKdcPxsTT+vtqpoFGGdgZAcNg7J47BJvuhjw0THmcUs65B+/lOS2IhauqlkY+jwcDmk87pJzcEacikrp5tagT2e6ujqtQ/mp62UzcUhYuCBcCIeEhT2q3Mqg8EnZKNeaz+ct9QYDD0gS0C1Ygv3irMF+Ucx7Lw1/fmmVGkWjgnvzZF66+zvZR+Pn5Uu99Sq+a7dqc79Rlm3ulb0zP9j//wKuxGyC6r7XUQAAAABJRU5ErkJggg=="
        },

        others: {
            enable: false,
            name: "",
            path: "",
            image: ""
        },

        all: {
            enable: true,
            name: "所有浏览器",
            image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAACTklEQVRIiaVVLVDcUBBeQYfL7rsZRMUJZMWJCgSiAoGsqEAgEBUVFQjECUQFYid5++2cQlRWICqQCGQFogKBQCAqEAgEAoGoQCBS0SQNudxdju7Mm4l4+b5937c/RAtEHxgG1U0iIjFb4zTdpfF4dRGMyRiPV9nsMrh/C+7nfWAo7u8FOBMgZ7Mndj8S1cGLCfrAkIgomJ0IcMbAbfGdC5CL2RWphpcRqAYxWwsxZgzcVqDFYbMnBu6SGEek2uuMG1Q3GThls8cmaP0kMTpnmQqQv1J91wq2orpCRNQDDsT9PolxxMDdLOCaPA9sdslpujs92xgzIqIK1OyqE3gpE3AjqgMxO+Ys077q67rGS2L2IMAhq66XPzBwKu73HV9xFdz3GNiSGPfZ7CK47xERUT/GjcKsxyTG0SKZC5AHs5PnGf+VXMw+VfJUhrn/DDFmxUsO5xksQM6q6zOrhc0u6oY1KumtmP2aRTC3/hm4qZ5b6lYLUR1MqygGbmeCTxAUc6YZIU132uRis6cE2J4n0WX5Qw84mHZPVAfl/GmSFGPjSwJslz1VRQJ8bbT9ViuD6tIzv6aciW7upenHRk0ft+H3zD53KdsJ00V1kJj9rl06a5On7tWcplub9KEYVgLk7H7UzLxLPwiQJ8B1e9mq9spRXCfoA8PG62Z3dZrutPpHRLScZR/K7URExMDWIuBzCUrQ4H5efHcb1/8q8LHT2uzHuJHEOEqA60UIBPgxF7wMUR2I+/eOmf/H0h+PV4vtdlqXrFr6Me4vu7+ZBfEHTjSaAJMnzh4AAAAASUVORK5CYII="
        }
    };

    if (window.OpenWithManager) {
        window.OpenWithManager.destroy();
        delete window.OpenWithManager;
    }

    function $(id) {
        return document.getElementById(id);
    }

    window.OpenWithManager = {
        useMenu: false,
        getTypeDesc: function(type) {
            switch (type) {
                case "page":
                    return "本页";
                case "link":
                    return "链接";
                    //case "tab": return "标签";
                    //case "bm": return "书签";
            }
            return "";
        },
        buildMenuName: function(label, type) {
            return "用 " + label + " 打开" + this.getTypeDesc(type);
        },
        attachNode: function(anchorNode, node) {
            if (this.useMenu) {
                anchorNode.appendChild(node);
            } else {
                anchorNode.parentNode.insertBefore(node, anchorNode);
            }
        },
        createMenuPopup: function(anchorNode, type) {
            let menu = document.createXULElement("menu");
            menu.setAttribute("label", MENU_NAME);
            menu.setAttribute("id", "openwith-menu-" + type);
            menu.setAttribute("class", "menu-iconic openwith-menu open-" + type);
            menu.setAttribute("image", browsers.all.image);
            anchorNode.parentNode.insertBefore(menu, anchorNode);

            let popup = document.createXULElement("menupopup");
            popup.id = "openwith-popup-" + type;
            menu.appendChild(popup);
            return popup;
        },
        createMenuItem: function(anchorNode, id, browser, type) {
            let menuitem = document.createXULElement("menuitem");
            menuitem.id = "openwith-m-" + type + "-" + id;
            menuitem.setAttribute("label", this.buildMenuName(browser.name, type));
            menuitem.setAttribute("oncommand", "OpenWithManager.openWithOtherBrowser(this,'" + id + "','" + type + "')");
            menuitem.setAttribute("class", "menuitem-iconic openwith-menuitem open-" + type);
            if (browser.image) {
                menuitem.setAttribute("image", browser.image);
            }
            if (MENU_GROUP) {
                anchorNode.appendChild(menuitem);
            } else {
                this.attachNode(anchorNode, menuitem);
            }

        },
        createBrowserMenu: function(anchorNode, type) {
            if (MENU_GROUP) {
                let newAnchorNode = document.createXULElement('menugroup');
                newAnchorNode.setAttribute('id', 'OpenWithManager-Group')
                this.attachNode(anchorNode, newAnchorNode);
                anchorNode = newAnchorNode;
            }
            for (let key in browsers) {
                try {
                    if (browsers[key].enable) {
                        this.createMenuItem(anchorNode, key, browsers[key], type);
                    }
                } catch (e) {
                    alert(e.message);
                }
            }
        },
        //contentAreaContextMenu
        initContentAreaMenu: function() {
            var inspos = $("inspect-separator");
            let sep = document.createXULElement("menuseparator");
            sep.setAttribute("class", "openwith-menuitem");
            inspos.parentNode.insertBefore(sep, inspos);
            this.useMenu = USE_MENU_AREA;

            var anchorNode;
            if (this.useMenu) {
                anchorNode = this.createMenuPopup(inspos, "area");
            } else {
                anchorNode = inspos;
            }
            //链接部分
            this.createBrowserMenu(anchorNode, "link");

            let sepLink = document.createXULElement("menuseparator");
            sepLink.setAttribute("class", "open-link openwith-menuitem");
            this.attachNode(anchorNode, sepLink);

            //控制链接菜单的显示
            inspos.parentNode.addEventListener("popupshowing", this, false);

            //页面部分
            this.createBrowserMenu(anchorNode, "page");
        },
        //tabContextMenu
        initTabContextMenu: function() {

            var inspos = $("context_closeTabOptions");
            let sep = document.createXULElement("menuseparator");
            sep.setAttribute("class", "openwith-menuitem");
            inspos.parentNode.insertBefore(sep, inspos.nextSibling);

            this.useMenu = USE_MENU_TAB;

            var anchorNode;
            if (this.useMenu) {
                anchorNode = this.createMenuPopup(sep.nextSibling, "tab");
            } else {
                anchorNode = sep.nextSibling;
            }
            this.createBrowserMenu(anchorNode, "tab");

        },
        //placesContext
        initPlacesContextMenu: function() {

            var inspos = $("placesContext_openSeparator");
            //let sep = document.createXULElement("menuseparator");
            //inspos.parentNode.insertBefore(sep, inspos);

            this.useMenu = USE_MENU_PLACE;
            var anchorNode;
            if (this.useMenu) {
                anchorNode = this.createMenuPopup(inspos, "place");
            } else {
                anchorNode = inspos;
            }
            this.createBrowserMenu(anchorNode, "place");

            //文件夹显示
            inspos.parentNode.addEventListener("popupshowing", this, false);
        },
        handleEvent: function(event) {
            if (event.target.id == "placesContext") {
                var isFloder = false;
                try {
                    let selectedNode = PlacesUIUtils.getViewForNode(event.target.ownerDocument.popupNode).selectedNode;
                    isFloder = !selectedNode || selectedNode.hasChildren;
                } catch (e) {}
                let menus = $("placesContext").querySelectorAll(".open-place");
                for (let menu of menus) {
                    if (isFloder) {
                        menu.hidden = true;
                    } else {
                        menu.hidden = false;
                        menu.disabled = false;
                    }
                }
            }
            if (event.target.id == "contentAreaContextMenu") {
                let menus = $("contentAreaContextMenu").querySelectorAll(".open-link");
                for (let menu of menus) {
                    if (gContextMenu.onLink) {
                        menu.hidden = false;
                    } else {
                        menu.hidden = true;
                    }
                }
            }

        },
        init: function() {

            //contentAreaContextMenu
            this.initContentAreaMenu();

            //tabContextMenu
            this.initTabContextMenu();

            //placesContext
            this.initPlacesContextMenu();

            this.setStyle();

        },
        destroy: function() {
            $("contentAreaContextMenu").removeEventListener("popupshowing", this, false);
            $("placesContext_openSeparator").removeEventListener("popupshowing", this, false);

            let menus = document.querySelectorAll(".openwith-menu"),
                menuitems = document.querySelectorAll(".openwith-menuitem");
            for (let menuitem of menuitems) {
                menuitem.parentNode.removeChild(menuitem);
            }
            for (let menu of menus) {
                menu.parentNode.removeChild(menu);
            }
            this.sss.unregisterSheet(this.STYLE.url, this.STYLE.type);
        },
        setStyle() {
            this.STYLE = {
                url: Services.io.newURI('data:text/css;charset=UTF-8,' + encodeURIComponent(`
                @-moz-document url('chrome://browser/content/browser.xhtml') {
                    #OpenWithManager-Group > menuitem:not(:first-child) > .menu-iconic-text,
                    #OpenWithManager-Group > menuitem:not(:first-child) > .menu-accel-container {
                        display: none;
                    }
                }
              `)),
                type: 1
            }
            this.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
            this.sss.loadAndRegisterSheet(this.STYLE.url, this.STYLE.type);
        },
        openWithBrowser: function(url, path) {
            if (!path) {
                alert("浏览器路径未设置 ");
                return;
            }

            let clientApp = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
            clientApp.initWithPath(path);
            if (!clientApp.exists()) {
                alert("浏览器路径错误: " + path);
                return;
            }
            try {
                let ss = Cc["@mozilla.org/browser/shell-service;1"]
                    .getService(Ci.nsIShellService);
                ss.openApplicationWithURI(clientApp, url);
            } catch (e) {
                let p = Cc["@mozilla.org/process/util;1"]
                    .createInstance(Ci.nsIProcess);
                p.init(clientApp);
                p.run(false, [url], 1);
            }
        },
        openWithOtherBrowser: function(obj, id, type) {
            var url;
            switch (type) {
                case "page":
                    url = gBrowser.currentURI.spec;
                    break;
                case "link":
                    url = gContextMenu.linkURL;
                    break;
                case "tab":
                    {
                        let tab = document.popupNode && document.popupNode.localName == "tab" ? document.popupNode : gBrowser.selectedTab;
                        let bw = tab && tab.linkedBrowser,
                            uri = bw.documentURI.spec || bw.currentURI.spec;
                        url = bw && uri;
                    }
                    break;
                case "place":
                    url = PlacesUIUtils.getViewForNode(document.popupNode).selectedNode.uri;
                    break;
            }
            if (url) {
                if (id == "all") {
                    for (let key in browsers) {
                        let browser = browsers[key];
                        if (browser.enable && key != "all" && browser.path) {
                            this.openWithBrowser(url, browser.path);
                        }
                    }
                } else {
                    let browser = browsers[id];
                    this.openWithBrowser(url, browser.path);
                }
            }
        }

    };
    OpenWithManager.init();
})();