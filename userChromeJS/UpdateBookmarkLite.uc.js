location.href.startsWith('chrome://browser/content/browser.x') && (function () {
  var newBM = document.getElementById('placesContext_show_bookmark:info');
  var repBM = newBM.parentNode.insertBefore(newBM.cloneNode(true), newBM);
  repBM.removeAttribute('data-l10n-id');
  repBM.setAttribute('label', newBM.label.indexOf('Bookmark') > -1 ? 'Update Bookmark' : '替换为当前网址');
  repBM.setAttribute('tooltiptext', '左键：替换当前网址\n中键：替换当前地址和标题\n右键：替换当前网址和自定义当前标题');
  repBM.id = 'UC_update_bookmark';
  repBM.setAttribute('accesskey', 'U');
  repBM.removeAttribute('command');
  repBM.removeAttribute('hideifnoinsertionpoint');
  document.getElementById('placesContext').addEventListener('popupshowing', function(event) {
    let popupNode = event.target.triggerNode;
    repBM.hidden = (popupNode._placesNode || popupNode.node).type !== 0;
  });
  repBM.addEventListener('command', async (e) => {
    let popupNode = PlacesUIUtils.lastContextMenuTriggerNode || document.popupNode;
    const node = popupNode._placesNode;
    if(!node) return;
    const guid = node.bookmarkGuid;
    if(!guid) return;
    const info = {
      guid,
      title: node.title,
      url: gBrowser.currentURI.spec,
    }
    if(e.button === 1){
      info.title = gBrowser.contentTitle;
    }else if(e.button === 2){
      const title = window.prompt('更新当前书签标题，原标题为：\n' + node.title, gBrowser.contentTitle);
      if(title === null) return;
      if(title !== node.title)
        info.title = title;
    }
    await PlacesUtils.bookmarks.update(info);
  }, false);
})()