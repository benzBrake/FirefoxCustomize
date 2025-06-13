// ==UserScript==
// @name         000-syncify.sys.mjs
// @description  Syncify system functions
// @author       Ryan
// @version      1.0.0
// @skip         true
// ==/UserScript==
function syncify (promiser) {
    // promiser 是一个无参函数，返回 Promise
    // 例如：() => OpenWithHelper.selectDirectory("choose-directory")
    let isDone = false;            // 标记 Promise 是否已经完成
    let result;                    // 存储成功时的结果
    let error;                     // 存储错误信息
    const threadManager = Cc["@mozilla.org/thread-manager;1"].getService();
    const mainThread = threadManager.mainThread;
    // 调用传入的异步函数，并将结果/错误分别存储
    promiser()
        .then(res => {
            result = res;
            isDone = true;
        })
        .catch(err => {
            error = err;
            isDone = true;
        });
    // 轮询主线程事件，阻塞直到 Promise 执行完毕
    while (!isDone) {
        mainThread.processNextEvent(true);
    }
    // 如果有错误，则抛出错误
    if (error) {
        throw error;
    }
    // 返回结果
    return result;
}
export { syncify };