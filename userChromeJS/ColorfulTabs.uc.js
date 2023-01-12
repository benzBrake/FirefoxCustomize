// ==UserScript==
// @name            ColorfulTabs.uc.js
// @description     多彩标签
// @license         MIT License
// @compatibility   Firefox 90
// @charset         UTF-8
// @include         chrome://browser/content/browser.xhtml
// @shutdown        window. ColorfulTabs.destroy()
// @homepageURL     https://github.com/benzBrake/FirefoxCustomize/tree/master/userChromeJS
// ==/UserScript==
(function (css) {
    const BLACK_LIST = [
        "chrome://global/skin/icons/info.svg"
    ];
    class ColorfulTabs {
        constructor() {
            this.style = addStyle(css);
            gBrowser.tabContainer.addEventListener('TabAttrModified', this);
        }
        refreshColor(tab) {
            if (tab.hasAttribute('image')) {
                let imageSrc = tab.getAttribute('image');
                if (BLACK_LIST.includes(imageSrc)) {
                    if (tab.hasAttribute('colorful')) tab.removeAttribute('colorful');
                    tab.style.removeProperty("-colorful-tab-background");
                    return;
                }
                let imgEl = document.createElement("img");
                imgEl.src = imageSrc;
                let rgb = this.getAverageRGB(imgEl);
                tab.setAttribute('colorful', true);
                tab.style.setProperty("--colorful-tab-background", `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
            }
        }
        handleEvent(event) {
            this.refreshColor(event.target);
        }
        getAverageRGB(imgEl) {
            var blockSize = 5, // only visit every 5 pixels
                defaultRGB = { r: 0, g: 0, b: 0 }, // for non-supporting envs
                canvas = document.createElement('canvas'),
                context = canvas.getContext && canvas.getContext('2d'),
                data, width, height,
                i = -4,
                length,
                rgb = { r: 0, g: 0, b: 0 },
                count = 0;

            if (!context) {
                return defaultRGB;
            }

            height = canvas.height = imgEl.naturalHeight || imgEl.offsetHeight || imgEl.height;
            width = canvas.width = imgEl.naturalWidth || imgEl.offsetWidth || imgEl.width;

            context.drawImage(imgEl, 0, 0);

            try {
                data = context.getImageData(0, 0, width, height);
            } catch (e) {
                /* security error, img on diff domain */
                return defaultRGB;
            }

            length = data.data.length;

            while ((i += blockSize * 4) < length) {
                ++count;
                rgb.r += data.data[i];
                rgb.g += data.data[i + 1];
                rgb.b += data.data[i + 2];
            }

            // ~~ used to floor values
            rgb.r = ~~(rgb.r / count);
            rgb.g = ~~(rgb.g / count);
            rgb.b = ~~(rgb.b / count);

            return rgb;

        }
        destroy() {
            if (this.style && this.style.parentNode)
                this.style.parentNode.removeChild(this.style);
            gBrowser.tabContainer.removeEventListener('TabAttrModified', this);
        }
    }

    function addStyle(css) {
        var pi = document.createProcessingInstruction(
            'xml-stylesheet',
            'type="text/css" href="data:text/css;utf-8,' + encodeURIComponent(css) + '"'
        );
        return document.insertBefore(pi, document.documentElement);
    }

    if (gBrowserInit.delayedStartupFinished) window.ColorfulTabs = new ColorfulTabs();
    else {
        let delayedListener = (subject, topic) => {
            if (topic == "browser-delayed-startup-finished" && subject == window) {
                Services.obs.removeObserver(delayedListener, topic);
                window.ColorfulTabs = new ColorfulTabs();
            }
        };
        Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
    }

})(`
#TabsToolbar:not([brighttext]) #tabbrowser-tabs .tabbrowser-tab[visuallyselected=true][colorful] .tab-background {
    background: -moz-linear-gradient(left, color-mix(in srgb, var(--colorful-tab-background) 50%, white), color-mix(in srgb, var(--colorful-tab-background) 70%, white)) !important;
}
`);